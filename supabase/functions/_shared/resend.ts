// Minimal Resend client over fetch, so edge functions carry no extra deps.
// https://resend.com/docs/api-reference/emails/send-email

export interface EmailMessage {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  /** Resend de-duplicates retries that reuse the same key for 24h. */
  idempotencyKey?: string;
}

export type SendResult =
  { ok: true; id: string } | { ok: false; error: string };

export const EMAIL_FROM =
  Deno.env.get("EMAIL_FROM") ?? "NIN Support Atlanta <onboarding@resend.dev>";

export const STAFF_EMAILS = (Deno.env.get("STAFF_NOTIFY_EMAILS") ?? "")
  .split(",")
  .map((email) => email.trim())
  .filter(Boolean);

/** Where applicant replies should land. Defaults to the first staff inbox. */
export const REPLY_TO = Deno.env.get("EMAIL_REPLY_TO") ?? STAFF_EMAILS[0];

export async function sendEmail(message: EmailMessage): Promise<SendResult> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY is not set" };

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
  if (message.idempotencyKey) {
    headers["Idempotency-Key"] = message.idempotencyKey;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers,
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
        ...(message.replyTo ? { reply_to: message.replyTo } : {}),
      }),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        ok: false,
        error: body?.message ?? `Resend responded ${res.status}`,
      };
    }
    return { ok: true, id: body.id };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
