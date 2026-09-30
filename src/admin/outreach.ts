/**
 * Follow-up messaging: personalised templates for people who stopped part-way
 * and for people who submitted, plus WhatsApp / SMS deep links and resume links.
 *
 * Emails get "Hello <first name>," and the sender's signature added by the
 * server, so email bodies start straight after the greeting. WhatsApp and SMS
 * messages are sent from the staff member's own phone, so they carry their own
 * greeting and sign-off.
 */

import { Draft, formatDate, KIND_LABEL, Submission, titleCase } from "./types";

/** The public website, which is a different address from this back office. */
export const PUBLIC_SITE_URL = (
  import.meta.env.VITE_PUBLIC_SITE_URL || "https://www.ninsupportatalanta.com"
).replace(/\/$/, "");

export const resumeLink = (draftId: string) =>
  `${PUBLIC_SITE_URL}/?resume=${draftId}`;

/** Digits only, with a US country code added to bare 10-digit numbers. */
export function internationalDigits(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `1${digits}`;
  return digits;
}

export const whatsappLink = (phone: string, text: string) =>
  `https://wa.me/${internationalDigits(phone)}?text=${encodeURIComponent(text)}`;

export const smsLink = (phone: string, text: string) =>
  `sms:+${internationalDigits(phone)}?&body=${encodeURIComponent(text)}`;

export interface EmailTemplate {
  label: string;
  subject: string;
  message: string;
}

const formName = (kind: Draft["kind"]) =>
  kind === "appointment" ? "appointment booking" : "NIN pre-enrolment";

// ---------------------------------------------------------------------------
// People who started but didn't finish
// ---------------------------------------------------------------------------

export function draftEmailTemplates(d: Draft): EmailTemplate[] {
  const link = resumeLink(d.id);
  const what = formName(d.kind);
  return [
    {
      label: "Need a hand?",
      subject: `Can we help you finish your ${what}?`,
      message: `We saw you started your ${what} with NIN Support Atlanta but stopped part-way. Did you run into any difficulty, or do you have questions we can answer?

Your details are saved, so you can pick up right where you left off:
${link}

Or simply reply to this email or call us on +1 (404) 563-1228 and we'll help you complete it.`,
    },
    {
      label: "Finish in 2 minutes",
      subject: `Your ${what} is almost done`,
      message: `You're nearly there. We've saved everything you entered, so finishing your ${what} only takes a couple of minutes:
${link}

If anything was unclear (documents, fees, or which service you need), reply and we'll sort it out with you.`,
    },
    {
      label: "Can we call you?",
      subject: `Quick call about your ${what}?`,
      message: `We noticed you started your ${what} but didn't get to finish. Many people find it easier to go through it with us on the phone.

Reply with a good time to call${d.phone ? ` on ${d.phone}` : ""}, or ring us on +1 (404) 563-1228 (Monday to Friday, 9am to 5pm). You can also continue online any time:
${link}`,
    },
    {
      label: "Last reminder",
      subject: `We're holding your ${what} for you`,
      message: `Just a final note: your ${what} is still saved with us. If you'd still like to get your NIN sorted in Atlanta, you can finish here:
${link}

If your plans have changed, no problem at all, you won't hear from us again about this form.`,
    },
  ];
}

export function draftChatMessage(d: Draft, senderName: string) {
  const first = titleCase(d.first_name) || "there";
  return `Hi ${first}, this is ${senderName} from NIN Support Atlanta. We saw you started your ${formName(d.kind)} on our website but didn't get to finish. Do you need any help with it? You can continue where you left off here: ${resumeLink(d.id)}`;
}

// ---------------------------------------------------------------------------
// People who submitted
// ---------------------------------------------------------------------------

export function submissionEmailTemplates(s: Submission): EmailTemplate[] {
  const visit = s.appointment_date
    ? `${formatDate(s.appointment_date)} at ${s.appointment_time}`
    : "[date and time]";
  return [
    {
      label: "Next steps",
      subject: `Your NIN enrolment · ${s.reference}`,
      message: `Thank you for choosing NIN Support Atlanta. To complete your NIN enrolment, please:

1. Pay the diaspora NIN fee through the official portal and keep the receipt.
2. Visit us at 1 Glenlake Parkway, Suite 702, Atlanta, GA 30328 with your valid Nigerian passport (or other accepted ID) and the payment receipt.

We are open Monday to Friday, 9am to 5pm. Reply to this email if you would like us to book a time for you.`,
    },
    {
      label: "Confirm visit",
      subject: `Appointment confirmed · ${s.reference}`,
      message: `Your appointment is confirmed for ${visit}.

Please bring your valid Nigerian passport (or other accepted ID), your NIN payment receipt, and your reference number. Plan for about 30 minutes for biometric capture.

If you need to reschedule, just reply to this email.`,
    },
    {
      label: "Missing documents",
      subject: `We need a few more details · ${s.reference}`,
      message: `We are reviewing your enrolment and need the following before we can continue:

- [list what is missing]

You can reply to this email with the details, or bring them with you to the office.`,
    },
    {
      label: "Reminder",
      subject: `See you soon · ${s.reference}`,
      message: `A friendly reminder about your NIN enrolment with us${s.appointment_date ? ` on ${visit}` : ""}. Remember to bring your passport and payment receipt.

If you can no longer make it, reply and we'll find you another time.`,
    },
    {
      label: "Completed",
      subject: `Your NIN enrolment is complete · ${s.reference}`,
      message: `Your biometric enrolment has been captured and submitted to NIMC. Your NIN will be issued once NIMC completes validation, and we will contact you as soon as it is available.

Thank you for enrolling with NIN Support Atlanta.`,
    },
  ];
}

export function submissionChatMessage(s: Submission, senderName: string) {
  return `Hi ${titleCase(s.first_name)}, this is ${senderName} from NIN Support Atlanta about your ${KIND_LABEL[s.kind].toLowerCase()} (ref ${s.reference}). `;
}
