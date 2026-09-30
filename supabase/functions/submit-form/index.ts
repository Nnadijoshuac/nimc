// Public endpoint behind the pre-enrolment and appointment forms.
//
// POST { type: "pre_enrollment" | "appointment", data: {...}, company?: "" }
//   -> 200 { reference }
//
// Validates input, stores it with the service role (the tables have no anon
// policies), then emails the applicant and the staff inbox through Resend.
// Email failures are logged on the submission's timeline but never fail the
// request: the record is what matters, staff can follow up from /admin.

import { corsHeaders, json } from "../_shared/cors.ts";
import { clientIp, isUuid, serviceClient } from "../_shared/context.ts";
import { recordJourneyStep, resolveJourney } from "../_shared/journey.ts";
import { REPLY_TO, sendEmail, STAFF_EMAILS } from "../_shared/resend.ts";
import {
  appointmentApplicantEmail,
  preEnrollmentApplicantEmail,
  staffNotificationEmail,
} from "../_shared/templates.ts";

const supabase = serviceClient();

const SERVICES = [
  "New Diaspora NIN Enrolment",
  "Child / Minor NIN Enrolment",
  "Lost NIN Slip Re-issuance",
  "NIN Data Modification & Biometric Update",
];

const TIME_SLOTS = [
  "09:30 AM",
  "10:30 AM",
  "11:30 AM",
  "01:30 PM",
  "02:30 PM",
  "03:30 PM",
  "04:30 PM",
];

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

class ValidationError extends Error {
  constructor(
    public field: string,
    message: string,
  ) {
    super(message);
  }
}

type Input = Record<string, unknown>;

function text(
  input: Input,
  field: string,
  opts: { required?: boolean; max?: number; upper?: boolean } = {},
): string {
  const { required = true, max = 120, upper = false } = opts;
  const raw = input[field];
  const value = typeof raw === "string" ? raw.trim().replace(/\s+/g, " ") : "";
  if (required && !value)
    throw new ValidationError(field, "This field is required.");
  if (value.length > max)
    throw new ValidationError(field, `Keep this under ${max} characters.`);
  return upper ? value.toUpperCase() : value;
}

function email(input: Input, field = "email"): string {
  const value = text(input, field, { max: 254 }).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
    throw new ValidationError(field, "Enter a valid email address.");
  }
  return value;
}

function phone(input: Input, field = "phone"): string {
  const value = text(input, field, { max: 32 });
  const digits = value.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) {
    throw new ValidationError(field, "Enter a valid phone number.");
  }
  return value;
}

function isoDate(input: Input, field: string): string {
  const value = text(input, field, { max: 10 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) {
    throw new ValidationError(field, "Enter a valid date.");
  }
  return value;
}

function oneOf(input: Input, field: string, allowed: string[]): string {
  const value = text(input, field);
  if (!allowed.includes(value))
    throw new ValidationError(field, "Choose one of the listed options.");
  return value;
}

function todayInAtlanta(): string {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/New_York",
  });
}

function parsePreEnrollment(input: Input) {
  const surname = text(input, "surname", { max: 60, upper: true });
  const firstName = text(input, "firstName", { max: 60, upper: true });
  const middleName = text(input, "middleName", {
    required: false,
    max: 60,
    upper: true,
  });
  const dateOfBirth = isoDate(input, "dateOfBirth");
  if (dateOfBirth > todayInAtlanta() || dateOfBirth < "1900-01-01") {
    throw new ValidationError("dateOfBirth", "Enter a real date of birth.");
  }
  const passportNumber = text(input, "passportNumber", {
    max: 20,
    upper: true,
  });
  if (!/^[A-Z0-9]{6,20}$/.test(passportNumber)) {
    throw new ValidationError(
      "passportNumber",
      "Passport numbers contain only letters and digits.",
    );
  }

  return {
    firstName,
    fullName: [surname, firstName, middleName].filter(Boolean).join(" "),
    email: email(input),
    phone: phone(input),
    whatsapp: input.whatsapp === "yes",
    details: {
      surname,
      first_name: firstName,
      middle_name: middleName || null,
      date_of_birth: dateOfBirth,
      gender: oneOf(input, "gender", ["Male", "Female"]),
      state_of_origin: text(input, "stateOfOrigin", { max: 60 }),
      passport_number: passportNumber,
    },
  };
}

function parseAppointment(input: Input) {
  const date = isoDate(input, "date");
  if (date < todayInAtlanta()) {
    throw new ValidationError("date", "Pick today or a future date.");
  }
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  if (weekday === 0) {
    throw new ValidationError("date", "The office is closed on Sundays.");
  }

  const firstName = text(input, "firstName", { max: 60, upper: true });
  const surname = text(input, "surname", { max: 60, upper: true });

  return {
    firstName,
    fullName: `${surname} ${firstName}`,
    email: email(input),
    phone: phone(input),
    whatsapp: input.whatsapp === "yes",
    date,
    time: oneOf(input, "time", TIME_SLOTS),
    details: {
      surname,
      first_name: firstName,
      service: oneOf(input, "service", SERVICES),
      notes: text(input, "notes", { required: false, max: 1000 }) || null,
    },
  };
}

// ---------------------------------------------------------------------------
// Abuse limits (cheap, database-backed; good enough for a single office)
// ---------------------------------------------------------------------------

async function tooManyRecent(
  column: "email" | "source_ip",
  value: string,
  minutes: number,
  max: number,
) {
  const since = new Date(Date.now() - minutes * 60_000).toISOString();
  const { count } = await supabase
    .from("submissions")
    .select("id", { count: "exact", head: true })
    .eq(column, value)
    .gte("created_at", since);
  return (count ?? 0) >= max;
}

// ---------------------------------------------------------------------------

async function logEvent(
  submissionId: string,
  type: "created" | "email_sent" | "email_failed",
  body: string,
  meta = {},
) {
  await supabase
    .from("submission_events")
    .insert({ submission_id: submissionId, type, body, meta });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST")
    return json(req, { error: "Method not allowed" }, 405);

  let payload: {
    type?: string;
    data?: Input;
    company?: string;
    visitorId?: string;
    sessionId?: string;
    draftId?: string;
  };
  try {
    payload = await req.json();
  } catch {
    return json(req, { error: "Invalid JSON body." }, 400);
  }

  // Honeypot: the field is hidden from humans. Pretend success so bots move on.
  if (payload.company) {
    return json(req, { reference: "RECEIVED" });
  }

  const input = (payload.data ?? {}) as Input;
  const ip = clientIp(req);
  const userAgent = req.headers.get("user-agent")?.slice(0, 300) ?? null;

  let row: Record<string, unknown>;
  let parsedPre: ReturnType<typeof parsePreEnrollment> | null = null;
  let parsedAppt: ReturnType<typeof parseAppointment> | null = null;

  try {
    if (payload.type === "pre_enrollment") {
      parsedPre = parsePreEnrollment(input);
      row = {
        kind: "pre_enrollment",
        first_name: parsedPre.firstName,
        full_name: parsedPre.fullName,
        email: parsedPre.email,
        phone: parsedPre.phone,
        whatsapp: parsedPre.whatsapp,
        details: parsedPre.details,
      };
    } else if (payload.type === "appointment") {
      parsedAppt = parseAppointment(input);
      row = {
        kind: "appointment",
        first_name: parsedAppt.firstName,
        full_name: parsedAppt.fullName,
        email: parsedAppt.email,
        phone: parsedAppt.phone,
        whatsapp: parsedAppt.whatsapp,
        appointment_date: parsedAppt.date,
        appointment_time: parsedAppt.time,
        details: parsedAppt.details,
      };
    } else {
      return json(req, { error: "Unknown form type." }, 400);
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      return json(req, { error: error.message, field: error.field }, 422);
    }
    throw error;
  }

  if (
    (await tooManyRecent("email", row.email as string, 10, 5)) ||
    (ip && (await tooManyRecent("source_ip", ip, 60, 20)))
  ) {
    return json(
      req,
      {
        error:
          "We've received several submissions from you already. Please call the office if you need help.",
      },
      429,
    );
  }

  // Link the submission to the visitor's journey and to their draft.
  const journey = await resolveJourney(
    supabase,
    payload.visitorId,
    payload.sessionId,
  );
  let draft: { id: string; last_contacted_at: string | null } | null = null;
  if (isUuid(payload.draftId)) {
    const { data } = await supabase
      .from("form_drafts")
      .select("id, kind, status, last_contacted_at")
      .eq("id", payload.draftId)
      .maybeSingle();
    if (data && data.kind === row.kind && data.status !== "converted")
      draft = data;
  }

  const { data: inserted, error: insertError } = await supabase
    .from("submissions")
    .insert({
      ...row,
      visitor_id: journey.visitorId,
      session_id: journey.sessionId,
      draft_id: draft?.id ?? null,
      source_ip: ip,
      user_agent: userAgent,
    })
    .select("id, reference")
    .single();

  if (insertError || !inserted) {
    console.error("insert failed", insertError);
    return json(
      req,
      {
        error:
          "We couldn't save your submission. Please try again or call the office.",
      },
      500,
    );
  }

  const { id, reference } = inserted;
  await Promise.all([
    logEvent(
      id,
      "created",
      draft?.last_contacted_at
        ? "Submitted from the website after staff follow-up"
        : "Submitted from the website",
    ),
    draft
      ? supabase
          .from("form_drafts")
          .update({
            status: "converted",
            submission_id: id,
            converted_at: new Date().toISOString(),
          })
          .eq("id", draft.id)
      : Promise.resolve(),
    recordJourneyStep(supabase, journey, {
      event: "form_submit",
      formKind: row.kind as string,
      stage: 4,
      contact: {
        email: row.email as string,
        phone: row.phone as string,
        fullName: row.full_name as string,
      },
      submitted: true,
    }),
  ]);

  // ---- Emails --------------------------------------------------------------

  const applicantMail = parsedPre
    ? preEnrollmentApplicantEmail({
        reference,
        fullName: parsedPre.fullName,
        firstName: parsedPre.details.first_name,
        email: parsedPre.email,
        phone: parsedPre.phone,
        dateOfBirth: parsedPre.details.date_of_birth,
        gender: parsedPre.details.gender,
        stateOfOrigin: parsedPre.details.state_of_origin,
        passportNumber: parsedPre.details.passport_number,
      })
    : appointmentApplicantEmail({
        reference,
        fullName: parsedAppt!.fullName,
        firstName: parsedAppt!.firstName,
        email: parsedAppt!.email,
        phone: parsedAppt!.phone,
        service: parsedAppt!.details.service,
        date: parsedAppt!.date,
        time: parsedAppt!.time,
        notes: parsedAppt!.details.notes ?? undefined,
      });

  const staffMail = staffNotificationEmail({
    kind: row.kind as "pre_enrollment" | "appointment",
    reference,
    fullName: row.full_name as string,
    email: row.email as string,
    phone: row.phone as string,
    rows: parsedPre
      ? [
          ["Date of birth", parsedPre.details.date_of_birth],
          ["Gender", parsedPre.details.gender],
          ["State of origin", parsedPre.details.state_of_origin],
          ["Passport no.", parsedPre.details.passport_number],
        ]
      : [
          ["Service", parsedAppt!.details.service],
          ["Date", parsedAppt!.date],
          ["Time", parsedAppt!.time],
          ["Notes", parsedAppt!.details.notes],
        ],
  });

  const [applicantResult, staffResult] = await Promise.all([
    sendEmail({
      to: row.email as string,
      replyTo: REPLY_TO,
      idempotencyKey: `${id}-applicant`,
      ...applicantMail,
    }),
    STAFF_EMAILS.length
      ? sendEmail({
          to: STAFF_EMAILS,
          replyTo: row.email as string,
          idempotencyKey: `${id}-staff`,
          ...staffMail,
        })
      : Promise.resolve(null),
  ]);

  await logEvent(
    id,
    applicantResult.ok ? "email_sent" : "email_failed",
    applicantResult.ok
      ? `Confirmation emailed to ${row.email}`
      : `Confirmation email failed: ${applicantResult.error}`,
    { to: row.email, subject: applicantMail.subject, automatic: true },
  );
  if (staffResult && !staffResult.ok) {
    console.error("staff notification failed", staffResult.error);
  }

  return json(req, { reference });
});
