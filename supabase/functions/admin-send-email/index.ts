// Lets a signed-in admin email an applicant from the dashboard, whether they
// submitted a form or abandoned one part-way.
//
// POST { submissionId | draftId, subject, message }  (Authorization: Bearer <admin JWT>)
//   -> 200 { id }
//
// The message goes out from the office address with replies routed to the
// staff inbox, is recorded on the record's timeline, stamps last_contacted_at,
// and moves a fresh record (new / open) to "contacted".

import { corsHeaders, json } from "../_shared/cors.ts";
import { isUuid, serviceClient } from "../_shared/context.ts";
import { REPLY_TO, sendEmail } from "../_shared/resend.ts";
import { staffMessageEmail, titleCase } from "../_shared/templates.ts";

const service = serviceClient();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST")
    return json(req, { error: "Method not allowed" }, 405);

  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return json(req, { error: "Not signed in." }, 401);

  const { data: userData, error: userError } =
    await service.auth.getUser(token);
  if (userError || !userData.user)
    return json(req, { error: "Session expired. Sign in again." }, 401);

  const { data: admin } = await service
    .from("admins")
    .select("user_id, email, full_name")
    .eq("user_id", userData.user.id)
    .maybeSingle();
  if (!admin) return json(req, { error: "This account is not an admin." }, 403);

  let body: {
    submissionId?: string;
    draftId?: string;
    subject?: string;
    message?: string;
  };
  try {
    body = await req.json();
  } catch {
    return json(req, { error: "Invalid JSON body." }, 400);
  }

  const subject = body.subject?.trim() ?? "";
  const message = body.message?.trim() ?? "";
  if (!subject || subject.length > 150)
    return json(
      req,
      { error: "Subject is required (max 150 characters)." },
      422,
    );
  if (!message || message.length > 5000)
    return json(
      req,
      { error: "Message is required (max 5000 characters)." },
      422,
    );

  const table = isUuid(body.submissionId)
    ? "submissions"
    : isUuid(body.draftId)
      ? "form_drafts"
      : null;
  if (!table) return json(req, { error: "Missing record." }, 400);
  const recordId = (body.submissionId ?? body.draftId)!;

  const { data: record } = await service
    .from(table)
    .select(
      table === "submissions"
        ? "id, status, reference, first_name, full_name, email"
        : "id, status, first_name, full_name, email",
    )
    .eq("id", recordId)
    .maybeSingle<{
      id: string;
      status: string;
      reference?: string;
      first_name: string | null;
      full_name: string | null;
      email: string | null;
    }>();
  if (!record) return json(req, { error: "Record not found." }, 404);
  if (!record.email)
    return json(
      req,
      { error: "No email address on this record. Call or WhatsApp instead." },
      422,
    );

  const mail = staffMessageEmail({
    reference: record.reference ?? null,
    greetingName: record.first_name ? titleCase(record.first_name) : null,
    subject,
    message,
    senderName: admin.full_name || "NIN Support Atlanta",
  });

  const result = await sendEmail({
    to: record.email,
    replyTo: REPLY_TO,
    ...mail,
  });

  const target =
    table === "submissions"
      ? { submission_id: record.id }
      : { draft_id: record.id };

  await service.from("submission_events").insert({
    ...target,
    type: result.ok ? "email_sent" : "email_failed",
    body: result.ok ? message : `Email failed: ${result.error}`,
    meta: {
      to: record.email,
      subject,
      resend_id: result.ok ? result.id : null,
    },
    actor_id: admin.user_id,
    actor_email: admin.email,
  });

  if (!result.ok)
    return json(req, { error: `Email not sent: ${result.error}` }, 502);

  const fresh = record.status === "new" || record.status === "open";
  await service
    .from(table)
    .update({
      last_contacted_at: new Date().toISOString(),
      ...(fresh ? { status: "contacted" } : {}),
    })
    .eq("id", record.id);

  return json(req, { id: result.id });
});
