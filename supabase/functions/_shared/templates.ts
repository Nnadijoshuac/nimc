// Transactional email templates. Inline styles and tables only: email clients
// ignore <style> blocks and flexbox.

export const OFFICE = {
  name: "NIN Support Atlanta Diaspora Enrolment Center",
  address: "1 Glenlake Parkway, Suite 702, Atlanta, GA 30328",
  phone: "+1 (404) 563-1228",
  email: "info@ninsupportatalanta.com",
  website: "https://www.ninsupportatalanta.com",
  hours: "Monday – Friday, 9:00 AM – 5:00 PM EST",
};

const DASHBOARD_URL =
  Deno.env.get("ADMIN_DASHBOARD_URL") ?? "https://admin.ninsupportatalanta.com";

/** "CHUKWUDI" -> "Chukwudi" for greetings; names are stored upper-case. */
export const titleCase = (value: string) =>
  value.toLowerCase().replace(/(^|[\s'-])\p{L}/gu, (m) => m.toUpperCase());

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type Row = [label: string, value: string | null | undefined];

function rowsHtml(rows: Row[]): string {
  return rows
    .filter(([, value]) => value)
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eeeeef;color:#6e6e73;font-size:12px;text-transform:uppercase;letter-spacing:.04em;white-space:nowrap;vertical-align:top">${escapeHtml(label)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eeeeef;color:#1d1d1f;font-size:14px;font-weight:600">${escapeHtml(value)}</td>
        </tr>`,
    )
    .join("");
}

function rowsText(rows: Row[]): string {
  return rows
    .filter(([, value]) => value)
    .map(([label, value]) => `${label}: ${value}`)
    .join("\n");
}

function layout(opts: {
  preheader: string;
  heading: string;
  body: string;
}): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#1d1d1f">
    <span style="display:none;max-height:0;overflow:hidden">${escapeHtml(opts.preheader)}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;padding:24px 12px">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e5ea">
          <tr><td style="background:#075f3c;height:6px;line-height:6px;font-size:0">&nbsp;</td></tr>
          <tr><td style="padding:24px 28px 8px">
            <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#075f3c">NIN Support · Atlanta</div>
            <h1 style="margin:8px 0 0;font-size:20px;line-height:1.3;color:#1d1d1f">${escapeHtml(opts.heading)}</h1>
          </td></tr>
          <tr><td style="padding:8px 28px 24px;font-size:14px;line-height:1.6;color:#3a3a3c">${opts.body}</td></tr>
          <tr><td style="padding:16px 28px;background:#fbfbfd;border-top:1px solid #eeeeef;font-size:12px;line-height:1.6;color:#6e6e73">
            ${escapeHtml(OFFICE.name)}<br>
            ${escapeHtml(OFFICE.address)}<br>
            ${escapeHtml(OFFICE.phone)} · <a href="mailto:${OFFICE.email}" style="color:#075f3c">${OFFICE.email}</a>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

function referenceBlock(reference: string): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;background:#f2eee4;border-radius:8px">
      <tr><td style="padding:14px 16px">
        <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#6e6e73">Your reference</div>
        <div style="font-family:Consolas,Menlo,monospace;font-size:20px;font-weight:800;letter-spacing:.04em;color:#1d1d1f">${escapeHtml(reference)}</div>
      </td></tr>
    </table>`;
}

// ---------------------------------------------------------------------------

export interface PreEnrollmentEmailData {
  reference: string;
  fullName: string;
  firstName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  stateOfOrigin: string;
  passportNumber: string;
}

export interface AppointmentEmailData {
  reference: string;
  fullName: string;
  firstName: string;
  email: string;
  phone: string;
  service: string;
  date: string;
  time: string;
  notes?: string;
}

function prettyDate(iso: string): string {
  const date = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function preEnrollmentApplicantEmail(d: PreEnrollmentEmailData) {
  const rows: Row[] = [
    ["Name", d.fullName],
    ["Date of birth", d.dateOfBirth],
    ["State of origin", d.stateOfOrigin],
    ["Passport no.", d.passportNumber],
  ];
  const steps = [
    "Complete the diaspora NIN fee payment through the official portal and keep the receipt.",
    "Bring this reference, your valid Nigerian passport (or other accepted ID) and payment receipt to our office.",
    "Your biometrics (fingerprints, photo, signature) are captured on the spot. Your NIN is issued after NIMC validation.",
  ];

  return {
    subject: `Pre-enrolment received · ${d.reference}`,
    html: layout({
      preheader: `We received your NIN pre-enrolment. Reference ${d.reference}.`,
      heading: `Thank you, ${titleCase(d.firstName)}. Your pre-enrolment is in.`,
      body: `
        <p style="margin:0 0 4px">Our Atlanta team has received your NIN pre-enrolment and will contact you shortly to help you complete the process.</p>
        ${referenceBlock(d.reference)}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eeeeef;border-radius:8px;border-collapse:separate">${rowsHtml(rows)}</table>
        <h2 style="margin:24px 0 8px;font-size:15px;color:#1d1d1f">What happens next</h2>
        <ol style="margin:0;padding-left:20px">${steps.map((s) => `<li style="margin-bottom:6px">${escapeHtml(s)}</li>`).join("")}</ol>
        <p style="margin:20px 0 0">Walk-ins are welcome ${escapeHtml(OFFICE.hours)}, or reply to this email to book a time. Questions? Call <a href="tel:${OFFICE.phone}" style="color:#075f3c;font-weight:600">${escapeHtml(OFFICE.phone)}</a>.</p>
        <p style="margin:16px 0 0;font-size:12px;color:#6e6e73">If you did not submit this form, reply and let us know and we will delete the record.</p>`,
    }),
    text: [
      `Thank you, ${titleCase(d.firstName)}. Your NIN pre-enrolment is in.`,
      "",
      `Reference: ${d.reference}`,
      "",
      rowsText(rows),
      "",
      "What happens next:",
      ...steps.map((s, i) => `${i + 1}. ${s}`),
      "",
      `${OFFICE.name}`,
      `${OFFICE.address}`,
      `${OFFICE.phone} · ${OFFICE.email}`,
    ].join("\n"),
  };
}

export function appointmentApplicantEmail(d: AppointmentEmailData) {
  const rows: Row[] = [
    ["Service", d.service],
    ["Requested date", prettyDate(d.date)],
    ["Requested time", d.time],
    ["Location", OFFICE.address],
  ];

  return {
    subject: `Appointment request received · ${d.reference}`,
    html: layout({
      preheader: `We received your appointment request for ${prettyDate(d.date)} at ${d.time}.`,
      heading: "We received your appointment request",
      body: `
        <p style="margin:0 0 4px">Hello ${escapeHtml(titleCase(d.firstName))}, thanks for booking with us. A member of our team will confirm your slot by phone or email.</p>
        ${referenceBlock(d.reference)}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eeeeef;border-radius:8px;border-collapse:separate">${rowsHtml(rows)}</table>
        <h2 style="margin:24px 0 8px;font-size:15px;color:#1d1d1f">Please bring</h2>
        <ul style="margin:0;padding-left:20px">
          <li style="margin-bottom:6px">Valid Nigerian passport or other accepted identification</li>
          <li style="margin-bottom:6px">Your diaspora NIN payment receipt (printed or on your phone)</li>
          <li style="margin-bottom:6px">Your pre-enrolment reference, if you have one</li>
        </ul>
        <p style="margin:20px 0 0">Need to change the time? Reply to this email or call <a href="tel:${OFFICE.phone}" style="color:#075f3c;font-weight:600">${escapeHtml(OFFICE.phone)}</a>.</p>`,
    }),
    text: [
      `Hello ${titleCase(d.firstName)}, we received your appointment request.`,
      "",
      `Reference: ${d.reference}`,
      "",
      rowsText(rows),
      "",
      "Please bring: valid passport or accepted ID, your NIN payment receipt, and your pre-enrolment reference if you have one.",
      "",
      "A member of our team will confirm your slot. Reply to this email or call to change the time.",
      "",
      `${OFFICE.name}`,
      `${OFFICE.address}`,
      `${OFFICE.phone} · ${OFFICE.email}`,
    ].join("\n"),
  };
}

export function staffNotificationEmail(opts: {
  kind: "pre_enrollment" | "appointment";
  reference: string;
  fullName: string;
  email: string;
  phone: string;
  rows: Row[];
}) {
  const label =
    opts.kind === "pre_enrollment" ? "pre-enrolment" : "appointment request";
  const rows: Row[] = [
    ["Reference", opts.reference],
    ["Name", opts.fullName],
    ["Email", opts.email],
    ["Phone", opts.phone],
    ...opts.rows,
  ];

  return {
    subject: `New ${label}: ${opts.fullName} (${opts.reference})`,
    html: layout({
      preheader: `${opts.fullName} submitted a ${label}.`,
      heading: `New ${label}`,
      body: `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eeeeef;border-radius:8px;border-collapse:separate">${rowsHtml(rows)}</table>
        <p style="margin:20px 0 0">
          <a href="${escapeHtml(DASHBOARD_URL)}" style="display:inline-block;background:#075f3c;color:#ffffff;text-decoration:none;font-weight:700;font-size:13px;padding:10px 18px;border-radius:999px">Open in dashboard</a>
        </p>
        <p style="margin:12px 0 0;font-size:12px;color:#6e6e73">Reply to this email to write to the applicant directly.</p>`,
    }),
    text: [
      `New ${label}`,
      "",
      rowsText(rows),
      "",
      `Dashboard: ${DASHBOARD_URL}`,
    ].join("\n"),
  };
}

export function staffMessageEmail(opts: {
  reference: string | null;
  greetingName: string | null;
  subject: string;
  message: string;
  senderName: string;
}) {
  const greeting = opts.greetingName ? `Hello ${opts.greetingName},` : "Hello,";
  const paragraphs = opts.message
    .split(/\n{2,}/)
    .map(
      (p) =>
        `<p style="margin:0 0 12px">${escapeHtml(p).replace(/\n/g, "<br>")}</p>`,
    )
    .join("");
  const footer = opts.reference
    ? `Reference ${escapeHtml(opts.reference)} · reply to this email to reach us.`
    : "Reply to this email to reach us.";

  return {
    subject: opts.subject,
    html: layout({
      preheader: opts.message.slice(0, 120),
      heading: opts.subject,
      body: `
        <p style="margin:0 0 12px">${escapeHtml(greeting)}</p>
        ${paragraphs}
        <p style="margin:16px 0 0">${escapeHtml(opts.senderName)}<br><span style="color:#6e6e73">NIN Support Atlanta enrolment team</span></p>
        <p style="margin:16px 0 0;font-size:12px;color:#6e6e73">${footer}</p>`,
    }),
    text: [
      greeting,
      "",
      opts.message,
      "",
      opts.senderName,
      "NIN Support Atlanta enrolment team",
      "",
      opts.reference ? `Reference ${opts.reference}` : "",
    ].join("\n"),
  };
}

// ---------------------------------------------------------------------------
// Team emails
// ---------------------------------------------------------------------------

function button(href: string, label: string) {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;background:#075f3c;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 22px;border-radius:999px">${escapeHtml(label)}</a>`;
}

export function teamInviteEmail(opts: {
  name: string;
  inviterName: string;
  role: "owner" | "staff";
  link: string;
}) {
  const roleLine =
    opts.role === "owner"
      ? "As an owner you can also invite and manage team members."
      : "You'll be able to see new submissions and follow up with applicants.";
  return {
    subject: "You're invited to the NIN Support Atlanta back office",
    html: layout({
      preheader: `${opts.inviterName} invited you to the NIN Support Atlanta back office.`,
      heading: `Welcome to the team, ${opts.name}`,
      body: `
        <p style="margin:0 0 12px">${escapeHtml(opts.inviterName)} has given you access to the NIN Support Atlanta back office. ${escapeHtml(roleLine)}</p>
        <p style="margin:0 0 20px">Click below to choose your password and sign in. Nobody else will ever know it.</p>
        <p style="margin:0 0 20px">${button(opts.link, "Accept invite and set password")}</p>
        <p style="margin:0;font-size:12px;color:#6e6e73">This link works once and expires in 24 hours. If you weren't expecting this, you can ignore it.</p>`,
    }),
    text: [
      `Welcome to the team, ${opts.name}.`,
      "",
      `${opts.inviterName} has given you access to the NIN Support Atlanta back office. ${roleLine}`,
      "",
      "Choose your password and sign in here (works once, expires in 24 hours):",
      opts.link,
    ].join("\n"),
  };
}

export function accessRequestEmail(opts: {
  name: string;
  email: string;
  note: string | null;
  teamUrl: string;
}) {
  return {
    subject: `Access request: ${opts.name}`,
    html: layout({
      preheader: `${opts.name} (${opts.email}) asked for back-office access.`,
      heading: "Someone asked to join the back office",
      body: `
        <p style="margin:0 0 12px"><strong>${escapeHtml(opts.name)}</strong> (${escapeHtml(opts.email)}) is asking for access.</p>
        ${opts.note ? `<p style="margin:0 0 16px;padding:12px 14px;background:#f5f5f7;border-radius:8px">“${escapeHtml(opts.note)}”</p>` : ""}
        <p style="margin:0 0 20px">${button(opts.teamUrl, "Review request")}</p>
        <p style="margin:0;font-size:12px;color:#6e6e73">Only approve people you know. If you don't recognise this request, decline it.</p>`,
    }),
    text: [
      `${opts.name} (${opts.email}) is asking for back-office access.`,
      opts.note ? `Note: ${opts.note}` : "",
      "",
      `Review it: ${opts.teamUrl}`,
    ].join("\n"),
  };
}
