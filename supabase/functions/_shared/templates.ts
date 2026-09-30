// Transactional email design system.
//
// Email clients are hostile to modern CSS, so everything here is tables and
// inline styles, with a small <style> block only for progressive enhancements
// (mobile stacking) that clients which ignore it can safely skip. Colours are
// pinned to a light scheme so dark-mode clients don't invert the brand.

export const OFFICE = {
  name: "NIN Support Atlanta",
  longName: "NIN Support Atlanta Diaspora Enrolment Center",
  address: "1 Glenlake Parkway, Suite 702",
  city: "Atlanta, GA 30328",
  phone: "+1 (404) 563-1228",
  phoneHref: "tel:+14045631228",
  email: "info@ninsupportatalanta.com",
  website: "https://www.ninsupportatalanta.com",
  websiteLabel: "ninsupportatalanta.com",
  hours: "Monday – Friday, 9:00 AM – 5:00 PM EST",
};

/** Brand images are served by the public site so every email can load them. */
const ASSETS = `${OFFICE.website}/brand`;

const DASHBOARD_URL =
  Deno.env.get("ADMIN_DASHBOARD_URL") ?? "https://admin.ninsupportatalanta.com";

// Palette
const C = {
  canvas: "#eef0f3",
  card: "#ffffff",
  ink: "#0f1419",
  body: "#3b4350",
  muted: "#667080",
  hairline: "#e7e9ee",
  well: "#f6f7f9",
  green: "#075f3c",
  greenSoft: "#e7f3ec",
  greenInk: "#064e32",
  ticket: "#f7f3ea",
  ticketLine: "#e6dcc6",
  amberSoft: "#fdf3dc",
  amberInk: "#7a4d00",
  blueSoft: "#e8f1fb",
  blueInk: "#123f73",
};

const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO = "'SFMono-Regular',Menlo,Consolas,'Liberation Mono',monospace";

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

const e = escapeHtml;

// ---------------------------------------------------------------------------
// Building blocks
// ---------------------------------------------------------------------------

type Tone = "green" | "amber" | "blue";

const TONES: Record<Tone, [bg: string, ink: string]> = {
  green: [C.greenSoft, C.greenInk],
  amber: [C.amberSoft, C.amberInk],
  blue: [C.blueSoft, C.blueInk],
};

function eyebrow(label: string, tone: Tone = "green") {
  const [bg, ink] = TONES[tone];
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 18px"><tr>
    <td style="background:${bg};color:${ink};border-radius:999px;padding:6px 12px;font:700 11px/1 ${FONT};letter-spacing:.08em;text-transform:uppercase">${e(label)}</td>
  </tr></table>`;
}

function heading(text: string) {
  return `<h1 class="h1" style="margin:0 0 12px;font:800 26px/1.25 ${FONT};letter-spacing:-.02em;color:${C.ink}">${e(text)}</h1>`;
}

function lead(html: string) {
  return `<p style="margin:0 0 24px;font:400 16px/1.6 ${FONT};color:${C.body}">${html}</p>`;
}

function para(html: string, extra = "") {
  return `<p style="margin:0 0 16px;font:400 16px/1.65 ${FONT};color:${C.body};${extra}">${html}</p>`;
}

function sectionTitle(text: string) {
  return `<p style="margin:32px 0 14px;font:700 12px/1 ${FONT};letter-spacing:.08em;text-transform:uppercase;color:${C.muted}">${e(text)}</p>`;
}

/** Bulletproof pill button (renders as a solid block even without images). */
function button(
  href: string,
  label: string,
  variant: "primary" | "secondary" = "primary",
) {
  const [bg, ink] =
    variant === "primary" ? [C.green, "#ffffff"] : [C.well, C.ink];
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="display:inline-table;margin:0 8px 8px 0"><tr>
    <td style="background:${bg};border-radius:999px">
      <a href="${e(href)}" target="_blank" style="display:inline-block;padding:14px 26px;font:700 15px/1 ${FONT};color:${ink};text-decoration:none;border-radius:999px">${e(label)}</a>
    </td>
  </tr></table>`;
}

function ticket(label: string, value: string, note: string) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.ticket};border:1px dashed ${C.ticketLine};border-radius:14px"><tr>
    <td class="stack" style="padding:18px 22px">
      <p style="margin:0 0 6px;font:700 11px/1 ${FONT};letter-spacing:.1em;text-transform:uppercase;color:${C.muted}">${e(label)}</p>
      <p style="margin:0;font:800 24px/1.2 ${MONO};letter-spacing:.04em;color:${C.ink}">${e(value)}</p>
    </td>
    <td class="stack" align="right" style="padding:18px 22px;font:500 13px/1.5 ${FONT};color:${C.muted}">${e(note)}</td>
  </tr></table>`;
}

type Row = [label: string, value: string | null | undefined];

function details(rows: Row[]) {
  const shown = rows.filter(([, v]) => v);
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.well};border-radius:14px">
    ${shown
      .map(
        ([label, value], i) => `<tr>
      <td style="padding:14px 20px;${i ? `border-top:1px solid ${C.hairline};` : ""}font:500 14px/1.4 ${FONT};color:${C.muted};white-space:nowrap;vertical-align:top">${e(label)}</td>
      <td align="right" style="padding:14px 20px;${i ? `border-top:1px solid ${C.hairline};` : ""}font:600 15px/1.4 ${FONT};color:${C.ink}">${e(value)}</td>
    </tr>`,
      )
      .join("")}
  </table>`;
}

function steps(items: [title: string, body: string][]) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    ${items
      .map(
        ([title, body], i) => `<tr>
      <td width="44" valign="top" style="padding:0 0 18px">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr><td width="30" height="30" align="center" style="background:${C.greenSoft};color:${C.greenInk};border-radius:999px;font:800 14px/30px ${FONT}">${i + 1}</td></tr></table>
      </td>
      <td valign="top" style="padding:3px 0 18px">
        <p style="margin:0 0 4px;font:700 15px/1.4 ${FONT};color:${C.ink}">${e(title)}</p>
        <p style="margin:0;font:400 14px/1.6 ${FONT};color:${C.body}">${e(body)}</p>
      </td>
    </tr>`,
      )
      .join("")}
  </table>`;
}

function checklist(items: string[]) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    ${items
      .map(
        (item) => `<tr>
      <td width="34" valign="top" style="padding:0 0 12px">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr><td width="22" height="22" align="center" style="background:${C.green};color:#ffffff;border-radius:999px;font:800 12px/22px ${FONT}">&#10003;</td></tr></table>
      </td>
      <td valign="top" style="padding:1px 0 12px;font:500 15px/1.5 ${FONT};color:${C.ink}">${e(item)}</td>
    </tr>`,
      )
      .join("")}
  </table>`;
}

function callout(html: string, tone: Tone = "blue") {
  const [bg, ink] = TONES[tone];
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${bg};border-radius:14px"><tr>
    <td style="padding:16px 20px;font:500 14px/1.6 ${FONT};color:${ink}">${html}</td>
  </tr></table>`;
}

function helpCard() {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.well};border-radius:14px;margin-top:28px"><tr>
    <td style="padding:18px 22px">
      <p style="margin:0 0 4px;font:700 15px/1.4 ${FONT};color:${C.ink}">Need help?</p>
      <p style="margin:0;font:400 14px/1.6 ${FONT};color:${C.body}">Reply to this email, or call <a href="${OFFICE.phoneHref}" style="color:${C.green};font-weight:700;text-decoration:none;white-space:nowrap">${e(OFFICE.phone)}</a>. We're open ${e(OFFICE.hours)}.</p>
    </td>
  </tr></table>`;
}

function layout(opts: {
  preheader: string;
  content: string;
  audience?: "public" | "staff";
}): string {
  const footerNote =
    opts.audience === "staff"
      ? "Internal message for the NIN Support Atlanta team."
      : `You're receiving this because of activity on ${OFFICE.websiteLabel}.`;
  return `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${e(OFFICE.name)}</title>
<style>
  body { margin:0 !important; padding:0 !important; }
  a { color:${C.green}; }
  @media (max-width: 620px) {
    .px { padding-left:24px !important; padding-right:24px !important; }
    .h1 { font-size:23px !important; }
    .stack { display:block !important; width:auto !important; text-align:left !important; }
    .stack + .stack { padding-top:0 !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${C.canvas};-webkit-text-size-adjust:100%">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${e(opts.preheader)}${"&#8202;&zwnj;&nbsp;".repeat(40)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.canvas}">
    <tr><td align="center" style="padding:32px 12px 40px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px">

        <!-- Brand -->
        <tr><td align="center" style="padding:0 8px 22px">
          <a href="${OFFICE.website}" target="_blank" style="text-decoration:none">
            <img src="${ASSETS}/logo-email.png" width="190" alt="NIN Support Atlanta" style="display:block;width:190px;max-width:190px;height:auto;border:0;outline:none;font:800 18px/1.2 ${FONT};color:${C.green}">
          </a>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:${C.card};border-radius:20px;box-shadow:0 1px 2px rgba(16,24,40,.06),0 12px 32px -12px rgba(16,24,40,.18)">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td class="px" style="padding:36px 40px 40px">${opts.content}</td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td align="center" style="padding:28px 16px 0">
          <p style="margin:0 0 6px;font:700 13px/1.5 ${FONT};color:${C.ink}">${e(OFFICE.longName)}</p>
          <p style="margin:0 0 6px;font:400 13px/1.6 ${FONT};color:${C.muted}">${e(OFFICE.address)}, ${e(OFFICE.city)}<br>${e(OFFICE.hours)}</p>
          <p style="margin:0 0 16px;font:500 13px/1.6 ${FONT};color:${C.muted}">
            <a href="${OFFICE.phoneHref}" style="color:${C.green};text-decoration:none;white-space:nowrap">${e(OFFICE.phone)}</a>
            &nbsp;·&nbsp; <a href="mailto:${OFFICE.email}" style="color:${C.green};text-decoration:none">${e(OFFICE.email)}</a>
            &nbsp;·&nbsp; <a href="${OFFICE.website}" style="color:${C.green};text-decoration:none">${e(OFFICE.websiteLabel)}</a>
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 16px"><tr>
            <td style="padding-right:10px;font:700 10px/1 ${FONT};letter-spacing:.12em;text-transform:uppercase;color:#8a93a1">Supported by</td>
            <td><img src="${ASSETS}/nimc.png" width="64" alt="NIMC" style="display:block;width:64px;height:auto;border:0;font:700 12px/1 ${FONT};color:${C.muted}"></td>
          </tr></table>
          <p style="margin:0;font:400 12px/1.6 ${FONT};color:#8a93a1">${e(footerNote)}</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// Plain-text companions -----------------------------------------------------

const textFooter = [
  "",
  "—",
  OFFICE.longName,
  `${OFFICE.address}, ${OFFICE.city}`,
  `${OFFICE.phone} · ${OFFICE.email} · ${OFFICE.websiteLabel}`,
].join("\n");

const textRows = (rows: Row[]) =>
  rows
    .filter(([, v]) => v)
    .map(([l, v]) => `${l}: ${v}`)
    .join("\n");

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

// ---------------------------------------------------------------------------
// Applicant emails
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

const BRING = [
  "Your valid Nigerian passport (or another accepted ID)",
  "Your diaspora NIN payment receipt, printed or on your phone",
  "This reference number",
];

export function preEnrollmentApplicantEmail(d: PreEnrollmentEmailData) {
  const first = titleCase(d.firstName);
  const rows: Row[] = [
    ["Full name", titleCase(d.fullName)],
    ["Date of birth", prettyDate(d.dateOfBirth)],
    ["State of origin", d.stateOfOrigin],
    ["Passport number", d.passportNumber],
  ];
  const next: [string, string][] = [
    [
      "Pay the diaspora NIN fee",
      "Complete payment through the official NIMC portal and keep your receipt.",
    ],
    [
      "Visit our Atlanta office",
      `Come to ${OFFICE.address}, ${OFFICE.city}. Walk-ins are welcome ${OFFICE.hours}.`,
    ],
    [
      "Capture your biometrics",
      "Fingerprints, photo and signature take about 30 minutes. Your NIN is issued once NIMC validates it.",
    ],
  ];

  return {
    subject: `You're pre-enrolled, ${first} · ${d.reference}`,
    html: layout({
      preheader: `Your NIN pre-enrolment is in. Reference ${d.reference}. Here's what to do next.`,
      content: `
        ${eyebrow("Pre-enrolment received")}
        ${heading(`You're all set, ${first}.`)}
        ${lead("We've received your NIN pre-enrolment. Our Atlanta team will be in touch shortly to help you finish, and everything you need is below.")}
        ${ticket("Your reference", d.reference, "Keep this handy for your visit.")}
        ${sectionTitle("What happens next")}
        ${steps(next)}
        ${sectionTitle("Please bring")}
        ${checklist(BRING)}
        ${sectionTitle("Your details")}
        ${details(rows)}
        <p style="margin:12px 0 0;font:400 13px/1.6 ${FONT};color:${C.muted}">Something wrong? Just reply and we'll correct it before your visit.</p>
        ${helpCard()}`,
    }),
    text: [
      `You're all set, ${first}.`,
      "",
      "We've received your NIN pre-enrolment. Our Atlanta team will be in touch shortly.",
      "",
      `Your reference: ${d.reference}`,
      "",
      "What happens next:",
      ...next.map(([t, b], i) => `${i + 1}. ${t}: ${b}`),
      "",
      "Please bring:",
      ...BRING.map((b) => `- ${b}`),
      "",
      "Your details:",
      textRows(rows),
      "",
      `Need help? Reply to this email or call ${OFFICE.phone}.`,
      textFooter,
    ].join("\n"),
  };
}

export function appointmentApplicantEmail(d: AppointmentEmailData) {
  const first = titleCase(d.firstName);
  const when = `${prettyDate(d.date)} at ${d.time}`;
  const rows: Row[] = [
    ["Service", d.service],
    ["Date", prettyDate(d.date)],
    ["Time", d.time],
    ["Where", `${OFFICE.address}, ${OFFICE.city}`],
  ];

  return {
    subject: `Appointment request received · ${prettyDate(d.date)}`,
    html: layout({
      preheader: `We've got your request for ${when}. We'll confirm your slot shortly.`,
      content: `
        ${eyebrow("Appointment request", "blue")}
        ${heading(`Thanks, ${first}. We've got your request.`)}
        ${lead(`You asked to visit on <strong style="color:${C.ink}">${e(when)}</strong>. A member of our team will confirm your slot by phone or email.`)}
        ${ticket("Your reference", d.reference, "Quote this if you call us.")}
        ${sectionTitle("Your visit")}
        ${details(rows)}
        ${sectionTitle("Please bring")}
        ${checklist(BRING)}
        <div style="margin-top:24px">${callout(`Need a different time? Reply to this email or call <a href="${OFFICE.phoneHref}" style="color:${C.blueInk};font-weight:700;white-space:nowrap">${e(OFFICE.phone)}</a> and we'll rearrange it.`)}</div>
        ${helpCard()}`,
    }),
    text: [
      `Thanks, ${first}. We've got your appointment request for ${when}.`,
      "",
      `Your reference: ${d.reference}`,
      "",
      textRows(rows),
      "",
      "Please bring:",
      ...BRING.map((b) => `- ${b}`),
      "",
      `Need a different time? Reply or call ${OFFICE.phone}.`,
      textFooter,
    ].join("\n"),
  };
}

// ---------------------------------------------------------------------------
// Staff alert for every new submission
// ---------------------------------------------------------------------------

const waLink = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits.length === 10 ? `1${digits}` : digits}`;
};

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
  const name = titleCase(opts.fullName);
  const rows: Row[] = [
    ["Reference", opts.reference],
    ["Phone", opts.phone],
    ["Email", opts.email],
    ...opts.rows.map(([l, v]): Row => [
      l,
      v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? prettyDate(v) : v,
    ]),
  ];

  return {
    subject: `New ${label}: ${name} (${opts.reference})`,
    html: layout({
      audience: "staff",
      preheader: `${name} just submitted a ${label}. Reach out while it's fresh.`,
      content: `
        ${eyebrow(`New ${label}`, opts.kind === "appointment" ? "blue" : "green")}
        ${heading(name)}
        ${lead("Just submitted from the website. People are most responsive in the first hour, so reach out while it's fresh.")}
        <div style="margin:0 0 24px">
          ${button(`${DASHBOARD_URL}/?tab=submissions`, "Open in back office")}
          ${button(`tel:${opts.phone.replace(/[^\d+]/g, "")}`, "Call", "secondary")}
          ${button(waLink(opts.phone), "WhatsApp", "secondary")}
        </div>
        ${details(rows)}
        <p style="margin:16px 0 0;font:400 13px/1.6 ${FONT};color:${C.muted}">Reply to this email to write to the applicant directly.</p>`,
    }),
    text: [
      `New ${label}: ${name}`,
      "",
      textRows(rows),
      "",
      `Open in back office: ${DASHBOARD_URL}/?tab=submissions`,
    ].join("\n"),
  };
}

// ---------------------------------------------------------------------------
// Messages staff write from the back office
// ---------------------------------------------------------------------------

const URL_RE = /https?:\/\/[^\s<]+[^\s<.,;:!?)"'\]]/g;

export function staffMessageEmail(opts: {
  reference: string | null;
  greetingName: string | null;
  subject: string;
  message: string;
  senderName: string;
}) {
  const greeting = opts.greetingName ? `Hello ${opts.greetingName},` : "Hello,";
  const resume = opts.message.match(
    /https?:\/\/\S*[?&]resume=[0-9a-f-]{36}/i,
  )?.[0];

  // The resume link becomes a button placed exactly where the link was, so
  // "pick up where you left off:" is followed by the button, not raw URL text.
  const linkify = (text: string) =>
    e(text)
      .replace(
        URL_RE,
        (url) =>
          `<a href="${url}" style="color:${C.green};font-weight:600;word-break:break-all">${url}</a>`,
      )
      .replace(/\n/g, "<br>");

  const paragraphs = opts.message
    .split(/\n{2,}/)
    .filter((p) => p.trim())
    .map((p) => {
      if (!resume || !p.includes(resume)) return para(linkify(p));
      const text = p
        .split("\n")
        .filter((line) => line.trim() !== resume)
        .join("\n")
        .replace(resume, "")
        .trim();
      return `${text ? para(linkify(text), "margin-bottom:14px") : ""}<div style="margin:0 0 22px">${button(resume, "Continue where you left off")}</div>`;
    })
    .join("");

  const initials = opts.senderName
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return {
    subject: opts.subject,
    html: layout({
      preheader: opts.message.replace(/\s+/g, " ").slice(0, 110),
      content: `
        ${para(`<strong style="color:${C.ink}">${e(greeting)}</strong>`)}
        ${paragraphs}
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:8px"><tr>
          <td width="44" height="44" align="center" style="background:${C.greenSoft};color:${C.greenInk};border-radius:999px;font:800 15px/44px ${FONT}">${e(initials)}</td>
          <td style="padding-left:12px">
            <p style="margin:0;font:700 15px/1.3 ${FONT};color:${C.ink}">${e(opts.senderName)}</p>
            <p style="margin:2px 0 0;font:500 13px/1.3 ${FONT};color:${C.muted}">Enrolment team · ${e(OFFICE.name)}</p>
          </td>
        </tr></table>
        ${opts.reference ? `<p style="margin:24px 0 0;font:500 13px/1.6 ${FONT};color:${C.muted}">Your reference: <span style="font-family:${MONO};font-weight:700;color:${C.ink}">${e(opts.reference)}</span></p>` : ""}
        ${helpCard()}`,
    }),
    text: [
      greeting,
      "",
      opts.message,
      "",
      opts.senderName,
      `Enrolment team · ${OFFICE.name}`,
      opts.reference ? `\nYour reference: ${opts.reference}` : "",
      textFooter,
    ].join("\n"),
  };
}

// ---------------------------------------------------------------------------
// Team emails
// ---------------------------------------------------------------------------

export function teamInviteEmail(opts: {
  name: string;
  inviterName: string;
  role: "owner" | "staff";
  link: string;
}) {
  const first = opts.name.split(" ")[0];
  const role =
    opts.role === "owner"
      ? [
          "Owner",
          "Work submissions and unfinished forms, and invite, approve and manage team members.",
        ]
      : [
          "Staff",
          "See new submissions and unfinished forms, and follow up with applicants by call, WhatsApp or email.",
        ];

  return {
    subject: `${opts.inviterName} invited you to the NIN Support Atlanta back office`,
    html: layout({
      audience: "staff",
      preheader: `Accept your invite and choose your password. The link works once and expires in 24 hours.`,
      content: `
        ${eyebrow("You're invited")}
        ${heading(`Welcome to the team, ${first}.`)}
        ${lead(`<strong style="color:${C.ink}">${e(opts.inviterName)}</strong> has given you access to the NIN Support Atlanta back office, where we help applicants complete their NIN enrolment.`)}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.well};border-radius:14px;margin:0 0 28px"><tr>
          <td style="padding:18px 22px">
            <p style="margin:0 0 4px;font:700 11px/1 ${FONT};letter-spacing:.1em;text-transform:uppercase;color:${C.muted}">Your role</p>
            <p style="margin:6px 0 4px;font:800 18px/1.3 ${FONT};color:${C.ink}">${role[0]}</p>
            <p style="margin:0;font:400 14px/1.6 ${FONT};color:${C.body}">${e(role[1])}</p>
          </td>
        </tr></table>
        ${button(opts.link, "Accept invite & set password")}
        <p style="margin:12px 0 28px;font:400 13px/1.6 ${FONT};color:${C.muted}">This link works once and expires in 24 hours.</p>
        ${callout(`<strong>You choose your own password.</strong> Nobody at ${e(OFFICE.name)} will ever ask you for it, by email, phone or WhatsApp.`, "green")}
        <p style="margin:24px 0 6px;font:400 12px/1.6 ${FONT};color:${C.muted}">Button not working? Paste this link into your browser:</p>
        <p style="margin:0;font:400 12px/1.6 ${MONO};color:${C.muted};word-break:break-all">${e(opts.link)}</p>
        <p style="margin:20px 0 0;font:400 12px/1.6 ${FONT};color:${C.muted}">Weren't expecting this? You can safely ignore it.</p>`,
    }),
    text: [
      `Welcome to the team, ${first}.`,
      "",
      `${opts.inviterName} has given you access to the NIN Support Atlanta back office.`,
      `Your role: ${role[0]}. ${role[1]}`,
      "",
      "Accept your invite and choose your password (works once, expires in 24 hours):",
      opts.link,
      "",
      "Nobody will ever ask you for your password.",
      textFooter,
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
    subject: `${opts.name} is asking for back-office access`,
    html: layout({
      audience: "staff",
      preheader: `${opts.name} (${opts.email}) asked to join. Approve or decline in one tap.`,
      content: `
        ${eyebrow("Access request", "amber")}
        ${heading(`${opts.name} wants to join the back office`)}
        ${lead("Approve them as staff or as an owner, or decline. They'll only get access if you approve, and they'll choose their own password.")}
        ${details([
          ["Name", opts.name],
          ["Email", opts.email],
        ])}
        ${
          opts.note
            ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px"><tr>
                <td width="4" style="background:${C.green};border-radius:4px"></td>
                <td style="padding:4px 0 4px 16px;font:italic 400 16px/1.6 ${FONT};color:${C.ink}">“${e(opts.note)}”</td>
              </tr></table>`
            : ""
        }
        <div style="margin:28px 0 24px">${button(opts.teamUrl, "Review request")}</div>
        ${callout("<strong>Only approve people you know.</strong> If you don't recognise this person, decline the request.", "amber")}`,
    }),
    text: [
      `${opts.name} (${opts.email}) is asking for back-office access.`,
      opts.note ? `\n“${opts.note}”` : "",
      "",
      `Review it: ${opts.teamUrl}`,
      "",
      "Only approve people you know.",
    ].join("\n"),
  };
}

// ---------------------------------------------------------------------------
// Supabase Auth emails (password reset, sign-in link). These are pasted into
// Supabase -> Authentication -> Emails. Invite links use TokenHash so the
// visible button points at the back office instead of the Supabase auth host.
// ---------------------------------------------------------------------------

export function authEmail(kind: "recovery" | "magic_link" | "invite") {
  const link =
    kind === "invite"
      ? "{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next={{ .RedirectTo }}"
      : "{{ .ConfirmationURL }}";
  const copy = {
    recovery: {
      eyebrow: "Password reset",
      heading: "Reset your password",
      lead: "We received a request to reset the password for your NIN Support Atlanta back-office account. Choose a new one below.",
      cta: "Choose a new password",
      note: "Didn't ask for this? You can ignore this email; your password won't change.",
    },
    magic_link: {
      eyebrow: "Sign-in link",
      heading: "Your sign-in link",
      lead: "Tap the button below to sign in to the NIN Support Atlanta back office. No password needed.",
      cta: "Sign in to the back office",
      note: "Didn't try to sign in? You can safely ignore this email.",
    },
    invite: {
      eyebrow: "You're invited",
      heading: "Welcome to the team",
      lead: "You've been given access to the NIN Support Atlanta back office. Accept the invite and choose your password.",
      cta: "Accept invite & set password",
      note: "Weren't expecting this? You can safely ignore it.",
    },
  }[kind];

  return layout({
    audience: "staff",
    preheader: copy.lead,
    content: `
      ${eyebrow(copy.eyebrow)}
      ${heading(copy.heading)}
      ${lead(copy.lead)}
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 8px 8px 0"><tr>
        <td style="background:${C.green};border-radius:999px">
          <a href="${link}" target="_blank" style="display:inline-block;padding:14px 26px;font:700 15px/1 ${FONT};color:#ffffff;text-decoration:none;border-radius:999px">${copy.cta}</a>
        </td>
      </tr></table>
      <p style="margin:12px 0 28px;font:400 13px/1.6 ${FONT};color:${C.muted}">For your security this link works once and expires soon.</p>
      ${callout(`<strong>We'll never ask for your password.</strong> ${copy.note}`, "green")}
      <p style="margin:24px 0 6px;font:400 12px/1.6 ${FONT};color:${C.muted}">Button not working? Paste this link into your browser:</p>
      <p style="margin:0;font:400 12px/1.6 ${MONO};color:${C.muted};word-break:break-all">${link}</p>`,
  });
}
