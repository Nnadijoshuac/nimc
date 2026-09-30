// Captures forms piece by piece, and powers resume links.
//
// POST { action: "save", draftId, visitorId?, sessionId?, kind, data,
//        step?, lastField? }
//   Creates the draft the moment it holds a valid email OR phone number, then
//   keeps it up to date as the applicant types. If they never submit, staff
//   see who they are, how far they got, and can reach out by name.
//
// POST { action: "load", draftId }
//   Returns the saved fields for a resume link, if the draft is still open.
//
// The draft id is a random UUID made in the browser. It is the only key to a
// draft, and is what goes in the resume link emailed to the applicant.

import { corsHeaders, json } from "../_shared/cors.ts";
import { clientIp, isBot, isUuid, serviceClient } from "../_shared/context.ts";
import { recordJourneyStep, resolveJourney } from "../_shared/journey.ts";

const supabase = serviceClient();

// Field order is the order they appear in the form.
const FIELDS: Record<string, string[]> = {
  pre_enrollment: [
    "firstName",
    "surname",
    "email",
    "phone",
    "whatsapp",
    "middleName",
    "dateOfBirth",
    "gender",
    "stateOfOrigin",
    "passportNumber",
  ],
  appointment: [
    "firstName",
    "surname",
    "email",
    "phone",
    "whatsapp",
    "service",
    "date",
    "time",
    "notes",
  ],
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const validPhone = (v?: string) => {
  const digits = (v ?? "").replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
};

function clean(kind: string, raw: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!raw || typeof raw !== "object") return out;
  for (const key of FIELDS[kind]) {
    const value = (raw as Record<string, unknown>)[key];
    if (typeof value === "string" && value.trim()) {
      out[key] = value
        .trim()
        .replace(/\s+/g, " ")
        .slice(0, key === "notes" ? 1000 : 120);
    }
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST")
    return json(req, { error: "Method not allowed" }, 405);

  // deno-lint-ignore no-explicit-any
  let body: any;
  try {
    body = JSON.parse(await req.text());
  } catch {
    return json(req, { error: "Invalid JSON body." }, 400);
  }

  if (!isUuid(body?.draftId)) return json(req, { error: "Bad draft id." }, 400);
  const draftId: string = body.draftId;

  // ---- Resume ---------------------------------------------------------------
  if (body.action === "load") {
    const { data: draft } = await supabase
      .from("form_drafts")
      .select("id, kind, status, data, resume_count")
      .eq("id", draftId)
      .maybeSingle();

    if (
      !draft ||
      draft.status === "converted" ||
      draft.status === "dismissed"
    ) {
      return json(
        req,
        { error: "This link has expired or the form was already submitted." },
        404,
      );
    }

    await Promise.all([
      supabase
        .from("form_drafts")
        .update({ resume_count: (draft.resume_count ?? 0) + 1 })
        .eq("id", draftId),
      supabase.from("submission_events").insert({
        draft_id: draftId,
        type: "system",
        body: "Reopened the form from their resume link",
      }),
    ]);

    return json(req, { kind: draft.kind, data: draft.data });
  }

  // ---- Save -----------------------------------------------------------------
  if (body.action !== "save")
    return json(req, { error: "Unknown action." }, 400);
  if (isBot(req.headers.get("user-agent") ?? ""))
    return json(req, { ok: true });

  const kind = body.kind;
  if (!FIELDS[kind]) return json(req, { error: "Unknown form type." }, 400);

  const data = clean(kind, body.data);
  const email =
    data.email && EMAIL.test(data.email) && data.email.length <= 254
      ? data.email.toLowerCase()
      : null;
  const phone = validPhone(data.phone) ? data.phone : null;

  // Nothing to reach them on yet: don't store anything.
  if (!email && !phone) return json(req, { ok: true, saved: false });
  if (email) data.email = email;

  const firstName = data.firstName?.toUpperCase() ?? null;
  const fullName =
    [data.surname, data.firstName, data.middleName]
      .filter(Boolean)
      .join(" ")
      .toUpperCase() || null;

  const fields = FIELDS[kind];
  const lastField =
    typeof body.lastField === "string" && fields.includes(body.lastField)
      ? body.lastField
      : null;
  const step = Number.isInteger(body.step)
    ? Math.min(Math.max(body.step, 1), 5)
    : 1;

  const row = {
    first_name: firstName,
    full_name: fullName,
    email,
    phone,
    whatsapp: data.whatsapp === "yes",
    data,
    step,
    last_field: lastField,
    fields_completed: Object.keys(data).filter((k) => k !== "whatsapp").length,
    fields_total: fields.filter((k) => k !== "whatsapp").length,
  };

  const { data: existing } = await supabase
    .from("form_drafts")
    .select("id, status, kind, step, visitor_id, email")
    .eq("id", draftId)
    .maybeSingle();

  if (existing) {
    // Finished or dismissed drafts are frozen; a different kind means a forged id.
    if (
      existing.status === "converted" ||
      existing.status === "dismissed" ||
      existing.kind !== kind
    ) {
      return json(req, { ok: true, saved: false });
    }
    await supabase
      .from("form_drafts")
      .update({ ...row, step: Math.max(step, existing.step) })
      .eq("id", draftId);
    // Contact details added later (e.g. email after phone) reach the visitor too.
    if (existing.visitor_id && email && email !== existing.email) {
      await supabase
        .from("visitors")
        .update({ email, full_name: row.full_name })
        .eq("id", existing.visitor_id);
    }
    return json(req, { ok: true, saved: true });
  }

  // New draft: cheap abuse limit per IP.
  const ip = clientIp(req);
  if (ip) {
    const since = new Date(Date.now() - 60 * 60_000).toISOString();
    const { count } = await supabase
      .from("form_drafts")
      .select("id", { count: "exact", head: true })
      .eq("source_ip", ip)
      .gte("created_at", since);
    if ((count ?? 0) >= 30) return json(req, { ok: true, saved: false });
  }

  const journey = await resolveJourney(
    supabase,
    body.visitorId,
    body.sessionId,
  );

  const { error } = await supabase.from("form_drafts").insert({
    id: draftId,
    kind,
    visitor_id: journey.visitorId,
    session_id: journey.sessionId,
    source_ip: ip,
    ...row,
  });
  if (error) {
    // A concurrent save may have created it first; that's fine.
    if (error.code === "23505") return json(req, { ok: true, saved: true });
    console.error("draft insert failed", error);
    return json(req, { ok: false }, 500);
  }

  await Promise.all([
    supabase.from("submission_events").insert({
      draft_id: draftId,
      type: "created",
      body: "Started the form and left contact details",
    }),
    recordJourneyStep(supabase, journey, {
      event: "contact_captured",
      formKind: kind,
      stage: 3,
      contact: { email, phone, fullName },
    }),
  ]);

  return json(req, { ok: true, saved: true });
});
