// Team management for the back office.
//
// Public (no sign-in):
//   { action: "request_access", name, email, note?, company? }
//
// Any admin (Authorization: Bearer <admin JWT>):
//   { action: "list" }                        members (+ requests and audit for owners)
//   { action: "joined" }                      first sign-in after an invite
//
// Owners only:
//   { action: "invite", name, email, role }
//   { action: "approve", requestId, role }
//   { action: "decline", requestId }
//   { action: "set_role", userId, role }
//   { action: "remove", userId }
//
// Rules enforced here, not in the browser: only owners manage the team, there
// is always at least one owner, and nobody removes themselves. New members
// receive a one-time invite link and choose their own password.

import { corsHeaders, json } from "../_shared/cors.ts";
import { clientIp, isUuid, serviceClient } from "../_shared/context.ts";
import { sendEmail } from "../_shared/resend.ts";
import { accessRequestEmail, teamInviteEmail } from "../_shared/templates.ts";

const db = serviceClient();
const ADMIN_URL = (
  Deno.env.get("ADMIN_DASHBOARD_URL") ?? "https://admin.ninsupportatalanta.com"
).replace(/\/$/, "");
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Role = "owner" | "staff";
interface Admin {
  user_id: string;
  email: string;
  full_name: string | null;
  role: Role;
}

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

const clean = (v: unknown, max: number) =>
  typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max) : "";

function parseRole(v: unknown): Role {
  if (v === "owner" || v === "staff") return v;
  throw new HttpError(422, "Role must be owner or staff.");
}

async function audit(
  action: string,
  actor: Admin | null,
  targetEmail: string,
  detail: Record<string, unknown> = {},
) {
  await db.from("team_audit").insert({
    action,
    actor_id: actor?.user_id ?? null,
    actor_email: actor?.email ?? null,
    target_email: targetEmail,
    detail,
  });
}

async function currentAdmin(req: Request): Promise<Admin> {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new HttpError(401, "Not signed in.");
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user)
    throw new HttpError(401, "Session expired. Sign in again.");
  const { data: admin } = await db
    .from("admins")
    .select("user_id, email, full_name, role")
    .eq("user_id", data.user.id)
    .maybeSingle();
  if (!admin) throw new HttpError(403, "This account is not an admin.");
  return admin as Admin;
}

async function ownerCount() {
  const { count } = await db
    .from("admins")
    .select("user_id", { count: "exact", head: true })
    .eq("role", "owner");
  return count ?? 0;
}

/**
 * Creates (or reuses) the login for `email`, makes it an admin with `role`,
 * and emails a one-time link where they choose their own password.
 */
async function inviteMember(
  actor: Admin,
  name: string,
  email: string,
  role: Role,
) {
  const { data: existingAdmin } = await db
    .from("admins")
    .select("user_id")
    .ilike("email", email)
    .maybeSingle();
  if (existingAdmin)
    throw new HttpError(409, `${email} is already on the team.`);

  // New people get an invite link; an existing login gets a sign-in link.
  let link = await db.auth.admin.generateLink({
    type: "invite",
    email,
    options: {
      redirectTo: `${ADMIN_URL}/`,
      data: { full_name: name, needs_password: true },
    },
  });
  if (link.error && /already|registered|exists/i.test(link.error.message)) {
    link = await db.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo: `${ADMIN_URL}/` },
    });
  }
  if (link.error || !link.data?.user || !link.data.properties?.action_link) {
    console.error("generateLink failed", link.error);
    throw new HttpError(500, "Couldn't create the invite. Try again.");
  }

  const { error: adminError } = await db.from("admins").insert({
    user_id: link.data.user.id,
    email,
    full_name: name,
    role,
    invited_by: actor.user_id,
  });
  if (adminError) {
    console.error("admins insert failed", adminError);
    throw new HttpError(500, "Couldn't add them to the team.");
  }

  const mail = teamInviteEmail({
    name,
    inviterName: actor.full_name || actor.email,
    role,
    link: link.data.properties.action_link,
  });
  const sent = await sendEmail({ to: email, ...mail });
  if (!sent.ok) {
    // Keep the membership; the owner can resend by removing and inviting again.
    console.error("invite email failed", sent.error);
    throw new HttpError(
      502,
      `Added to the team, but the invite email failed: ${sent.error}`,
    );
  }
}

// ---------------------------------------------------------------------------

async function handle(req: Request, body: Record<string, unknown>) {
  const action = body.action;

  // ---- Public: ask for access ----------------------------------------------
  if (action === "request_access") {
    if (body.company) return { ok: true }; // honeypot
    const name = clean(body.name, 80);
    const email = clean(body.email, 254).toLowerCase();
    const note = clean(body.note, 300) || null;
    if (!name) throw new HttpError(422, "Enter your name.");
    if (!EMAIL.test(email))
      throw new HttpError(422, "Enter a valid email address.");

    const ip = clientIp(req);
    if (ip) {
      const since = new Date(Date.now() - 60 * 60_000).toISOString();
      const { count } = await db
        .from("access_requests")
        .select("id", { count: "exact", head: true })
        .eq("source_ip", ip)
        .gte("created_at", since);
      if ((count ?? 0) >= 5)
        throw new HttpError(429, "Too many requests. Try again later.");
    }

    // Already a member, or already waiting: answer the same way, reveal nothing.
    const { data: member } = await db
      .from("admins")
      .select("user_id")
      .ilike("email", email)
      .maybeSingle();
    if (member) return { ok: true };

    const { error } = await db
      .from("access_requests")
      .insert({ email, full_name: name, note, source_ip: ip });
    if (error) {
      if (error.code === "23505") return { ok: true };
      console.error("request insert failed", error);
      throw new HttpError(500, "Couldn't send your request. Try again.");
    }
    await audit("request_received", null, email, { name });

    const { data: owners } = await db
      .from("admins")
      .select("email")
      .eq("role", "owner");
    const to = (owners ?? []).map((o) => o.email);
    if (to.length) {
      await sendEmail({
        to,
        replyTo: email,
        ...accessRequestEmail({
          name,
          email,
          note,
          teamUrl: `${ADMIN_URL}/?tab=team`,
        }),
      });
    }
    return { ok: true };
  }

  // ---- Everything else needs a signed-in admin ------------------------------
  const me = await currentAdmin(req);
  const requireOwner = () => {
    if (me.role !== "owner")
      throw new HttpError(403, "Only owners can manage the team.");
  };

  switch (action) {
    case "list": {
      const [{ data: admins }, users] = await Promise.all([
        db
          .from("admins")
          .select("user_id, email, full_name, role, created_at")
          .order("created_at"),
        db.auth.admin.listUsers({ perPage: 1000 }),
      ]);
      const byId = new Map((users.data?.users ?? []).map((u) => [u.id, u]));
      const members = (admins ?? []).map((a) => {
        const u = byId.get(a.user_id);
        return {
          ...a,
          last_sign_in_at: u?.last_sign_in_at ?? null,
          pending: !u?.last_sign_in_at,
        };
      });
      if (me.role !== "owner")
        return { me: me.user_id, role: me.role, members };
      const [{ data: requests }, { data: log }] = await Promise.all([
        db
          .from("access_requests")
          .select("*")
          .eq("status", "pending")
          .order("created_at", { ascending: false }),
        db
          .from("team_audit")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(40),
      ]);
      return {
        me: me.user_id,
        role: me.role,
        members,
        requests: requests ?? [],
        audit: log ?? [],
      };
    }

    case "joined": {
      const { count } = await db
        .from("team_audit")
        .select("id", { count: "exact", head: true })
        .eq("action", "joined")
        .ilike("target_email", me.email);
      if (!count) await audit("joined", me, me.email);
      return { ok: true };
    }

    case "invite": {
      requireOwner();
      const name = clean(body.name, 80);
      const email = clean(body.email, 254).toLowerCase();
      const role = parseRole(body.role);
      if (!name) throw new HttpError(422, "Enter their name.");
      if (!EMAIL.test(email))
        throw new HttpError(422, "Enter a valid email address.");
      await inviteMember(me, name, email, role);
      await audit("invited", me, email, { name, role });
      // An open request from the same person is now handled.
      await db
        .from("access_requests")
        .update({
          status: "approved",
          decided_by: me.user_id,
          decided_at: new Date().toISOString(),
        })
        .eq("status", "pending")
        .ilike("email", email);
      return { ok: true };
    }

    case "approve":
    case "decline": {
      requireOwner();
      if (!isUuid(body.requestId)) throw new HttpError(400, "Missing request.");
      const { data: request } = await db
        .from("access_requests")
        .select("*")
        .eq("id", body.requestId)
        .eq("status", "pending")
        .maybeSingle();
      if (!request)
        throw new HttpError(404, "That request was already handled.");

      if (action === "approve") {
        const role = parseRole(body.role ?? "staff");
        await inviteMember(me, request.full_name, request.email, role);
        await audit("request_approved", me, request.email, {
          name: request.full_name,
          role,
        });
      } else {
        await audit("request_declined", me, request.email, {
          name: request.full_name,
        });
      }
      await db
        .from("access_requests")
        .update({
          status: action === "approve" ? "approved" : "declined",
          decided_by: me.user_id,
          decided_at: new Date().toISOString(),
        })
        .eq("id", request.id);
      return { ok: true };
    }

    case "set_role": {
      requireOwner();
      if (!isUuid(body.userId)) throw new HttpError(400, "Missing member.");
      const role = parseRole(body.role);
      const { data: target } = await db
        .from("admins")
        .select("user_id, email, role")
        .eq("user_id", body.userId)
        .maybeSingle();
      if (!target) throw new HttpError(404, "Member not found.");
      if (target.role === role) return { ok: true };
      if (target.role === "owner" && (await ownerCount()) <= 1) {
        throw new HttpError(409, "There must always be at least one owner.");
      }
      await db.from("admins").update({ role }).eq("user_id", target.user_id);
      await audit("role_changed", me, target.email, {
        from: target.role,
        to: role,
      });
      return { ok: true };
    }

    case "remove": {
      requireOwner();
      if (!isUuid(body.userId)) throw new HttpError(400, "Missing member.");
      if (body.userId === me.user_id) {
        throw new HttpError(
          409,
          "You can't remove yourself. Ask another owner.",
        );
      }
      const { data: target } = await db
        .from("admins")
        .select("user_id, email, role, full_name")
        .eq("user_id", body.userId)
        .maybeSingle();
      if (!target) throw new HttpError(404, "Member not found.");
      if (target.role === "owner" && (await ownerCount()) <= 1) {
        throw new HttpError(409, "There must always be at least one owner.");
      }
      // Removing the admin row cuts data access immediately (row level
      // security); deleting the login ends their sessions for good.
      await db.from("admins").delete().eq("user_id", target.user_id);
      const { error } = await db.auth.admin.deleteUser(target.user_id);
      if (error) console.error("deleteUser failed", error);
      await audit("removed", me, target.email, {
        name: target.full_name,
        role: target.role,
      });
      return { ok: true };
    }

    default:
      throw new HttpError(400, "Unknown action.");
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST")
    return json(req, { error: "Method not allowed" }, 405);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json(req, { error: "Invalid JSON body." }, 400);
  }

  try {
    return json(req, await handle(req, body));
  } catch (error) {
    if (error instanceof HttpError)
      return json(req, { error: error.message }, error.status);
    console.error(error);
    return json(req, { error: "Something went wrong." }, 500);
  }
});
