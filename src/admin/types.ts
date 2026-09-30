export type SubmissionKind = "pre_enrollment" | "appointment";

export type SubmissionStatus =
  "new" | "contacted" | "in_progress" | "completed" | "cancelled";

export type DraftStatus = "open" | "contacted" | "converted" | "dismissed";

export interface Submission {
  id: string;
  kind: SubmissionKind;
  reference: string;
  status: SubmissionStatus;
  first_name: string;
  full_name: string;
  email: string;
  phone: string;
  whatsapp: boolean;
  appointment_date: string | null;
  appointment_time: string | null;
  details: Record<string, string | null>;
  visitor_id: string | null;
  session_id: string | null;
  draft_id: string | null;
  assigned_to: string | null;
  last_contacted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Draft {
  id: string;
  kind: SubmissionKind;
  status: DraftStatus;
  visitor_id: string | null;
  session_id: string | null;
  first_name: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: boolean;
  data: Record<string, string>;
  step: number;
  last_field: string | null;
  fields_completed: number;
  fields_total: number;
  submission_id: string | null;
  converted_at: string | null;
  assigned_to: string | null;
  last_contacted_at: string | null;
  resume_count: number;
  created_at: string;
  updated_at: string;
}

export interface Visitor {
  id: string;
  first_seen_at: string;
  last_seen_at: string;
  session_count: number;
  first_referrer: string | null;
  first_source: string | null;
  first_medium: string | null;
  first_campaign: string | null;
  first_landing_path: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  email: string | null;
  phone: string | null;
  full_name: string | null;
  submission_count: number;
}

export interface Session {
  id: string;
  visitor_id: string;
  started_at: string;
  last_seen_at: string;
  landing_path: string | null;
  referrer: string | null;
  source: string | null;
  medium: string | null;
  campaign: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  page_views: number;
  funnel_stage: number;
}

export interface AnalyticsEvent {
  id: number;
  visitor_id: string;
  session_id: string;
  name: string;
  form_kind: SubmissionKind | null;
  path: string | null;
  props: Record<string, unknown>;
  created_at: string;
}

export interface TimelineEvent {
  id: string;
  submission_id: string | null;
  draft_id: string | null;
  type:
    | "created"
    | "note"
    | "status_change"
    | "email_sent"
    | "email_failed"
    | "assigned"
    | "system";
  body: string | null;
  meta: Record<string, unknown>;
  actor_id: string | null;
  actor_email: string | null;
  created_at: string;
}

export interface AdminUser {
  user_id: string;
  email: string;
  full_name: string | null;
  role?: "owner" | "staff";
}

// ---------------------------------------------------------------------------
// Status metadata
// ---------------------------------------------------------------------------

export interface StatusMeta<T extends string> {
  value: T;
  label: string;
  pill: string;
  dot: string;
}

export const STATUSES: StatusMeta<SubmissionStatus>[] = [
  {
    value: "new",
    label: "New",
    pill: "bg-amber-50 text-amber-900 border-amber-200",
    dot: "bg-amber-500",
  },
  {
    value: "contacted",
    label: "Contacted",
    pill: "bg-sky-50 text-sky-900 border-sky-200",
    dot: "bg-sky-500",
  },
  {
    value: "in_progress",
    label: "In progress",
    pill: "bg-violet-50 text-violet-900 border-violet-200",
    dot: "bg-violet-500",
  },
  {
    value: "completed",
    label: "Completed",
    pill: "bg-emerald-50 text-emerald-900 border-emerald-200",
    dot: "bg-emerald-600",
  },
  {
    value: "cancelled",
    label: "Cancelled",
    pill: "bg-stone-100 text-stone-600 border-stone-200",
    dot: "bg-stone-400",
  },
];

export const DRAFT_STATUSES: StatusMeta<DraftStatus>[] = [
  {
    value: "open",
    label: "Not contacted",
    pill: "bg-amber-50 text-amber-900 border-amber-200",
    dot: "bg-amber-500",
  },
  {
    value: "contacted",
    label: "Contacted",
    pill: "bg-sky-50 text-sky-900 border-sky-200",
    dot: "bg-sky-500",
  },
  {
    value: "converted",
    label: "Submitted",
    pill: "bg-emerald-50 text-emerald-900 border-emerald-200",
    dot: "bg-emerald-600",
  },
  {
    value: "dismissed",
    label: "Dismissed",
    pill: "bg-stone-100 text-stone-600 border-stone-200",
    dot: "bg-stone-400",
  },
];

export const statusMeta = (status: string): StatusMeta<string> =>
  STATUSES.find((s) => s.value === status) ??
  DRAFT_STATUSES.find((s) => s.value === status) ??
  STATUSES[0];

export const KIND_LABEL: Record<SubmissionKind, string> = {
  pre_enrollment: "Pre-enrolment",
  appointment: "Appointment",
};

export const FUNNEL_STAGES = [
  "Visited",
  "Opened a form",
  "Started typing",
  "Left contact details",
  "Submitted",
];

export const FIELD_LABELS: Record<string, string> = {
  firstName: "First name",
  surname: "Surname",
  middleName: "Middle name",
  email: "Email",
  phone: "Phone",
  whatsapp: "On WhatsApp",
  dateOfBirth: "Date of birth",
  gender: "Gender",
  stateOfOrigin: "State of origin",
  passportNumber: "Passport no.",
  service: "Service",
  date: "Preferred date",
  time: "Preferred time",
  notes: "Notes",
  // submission.details keys
  first_name: "First name",
  middle_name: "Middle name",
  date_of_birth: "Date of birth",
  state_of_origin: "State of origin",
  passport_number: "Passport no.",
  contact: "Contact details",
};

export const fieldLabel = (key: string) =>
  FIELD_LABELS[key] ?? key.replace(/_/g, " ");

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

const TZ = "America/New_York";

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: TZ,
  });

export const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    timeZone: TZ,
  });

export const formatDate = (isoDate: string) =>
  new Date(`${isoDate.slice(0, 10)}T12:00:00Z`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

export const timeAgo = (iso: string) => {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDateTime(iso);
};

export const formatDuration = (seconds: number) => {
  if (!seconds || seconds < 1) return "under 1s";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m ${Math.round(seconds % 60)}s`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m`;
  return `${Math.round(h / 24)}d`;
};

export const titleCase = (value: string | null | undefined) =>
  (value ?? "")
    .toLowerCase()
    .replace(/(^|[\s'-])\p{L}/gu, (m) => m.toUpperCase());

/** Midnight in Atlanta, `daysAgo` days back, as a real instant. */
export function atlantaStartOfDay(daysAgo = 0): Date {
  const day = new Date(Date.now() - daysAgo * 86_400_000).toLocaleDateString(
    "en-CA",
    { timeZone: TZ },
  );
  const label = new Date(`${day}T12:00:00Z`).toLocaleString("en-US", {
    timeZone: TZ,
    timeZoneName: "shortOffset",
  });
  const m = label.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  const offset = m
    ? `${m[1]}${m[2].padStart(2, "0")}:${m[3] ?? "00"}`
    : "-05:00";
  return new Date(`${day}T00:00:00${offset}`);
}
