import React, { useEffect, useState } from "react";
import { FunctionsHttpError } from "@supabase/supabase-js";
import {
  ArrowRight,
  Calendar,
  Check,
  ChevronDown,
  Copy,
  FileText,
  Mail,
  Note,
  Phone,
  Send,
  WhatsApp,
  X,
} from "../components/icons";
import { Spinner } from "../components/FormBits";
import { useAdmin } from "./context";
import { EmailTemplate, smsLink, whatsappLink } from "./outreach";
import {
  formatDateTime,
  KIND_LABEL,
  StatusMeta,
  statusMeta,
  SubmissionKind,
  TimelineEvent,
} from "./types";

// ---------------------------------------------------------------------------
// Layout mode
// ---------------------------------------------------------------------------

const MOBILE_QUERY = "(max-width: 767px)";

/** Phones get the "on the move" layout; tablets and desktops the full one. */
export function useIsMobile() {
  const [mobile, setMobile] = useState(
    () =>
      typeof window !== "undefined" && window.matchMedia(MOBILE_QUERY).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const on = () => setMobile(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return mobile;
}

// ---------------------------------------------------------------------------
// Small pieces
// ---------------------------------------------------------------------------

export const StatusPill: React.FC<{ status: string }> = ({ status }) => {
  const meta = statusMeta(status);
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.pill}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
};

export const KindBadge: React.FC<{ kind: SubmissionKind }> = ({ kind }) => (
  <span className="inline-flex items-center gap-1.5 text-xs text-stone-700">
    {kind === "appointment" ? (
      <Calendar className="h-3.5 w-3.5 text-stone-500" />
    ) : (
      <FileText className="h-3.5 w-3.5 text-stone-500" />
    )}
    {KIND_LABEL[kind]}
  </span>
);

export const SectionTitle: React.FC<{
  children: React.ReactNode;
  right?: React.ReactNode;
}> = ({ children, right }) => (
  <div className="mb-2 flex items-center justify-between gap-2">
    <h3 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-stone-500">
      {children}
    </h3>
    {right}
  </div>
);

export const Field: React.FC<{
  label: string;
  value: React.ReactNode;
  wide?: boolean;
}> = ({ label, value, wide }) => (
  <div
    className={`rounded-lg bg-[#eef0f4] px-3 py-2.5 ${wide ? "col-span-2" : ""}`}
  >
    <dt className="text-[10px] font-semibold uppercase tracking-[0.06em] text-stone-500">
      {label}
    </dt>
    <dd className="mt-0.5 break-words font-semibold text-stone-900">{value}</dd>
  </div>
);

export const FieldGrid: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <dl className="grid grid-cols-2 gap-2 text-sm">{children}</dl>;

export const EmptyState: React.FC<{ title: string; body: string }> = ({
  title,
  body,
}) => (
  <div className="p-10 text-center">
    <p className="text-sm font-bold">{title}</p>
    <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-stone-500">
      {body}
    </p>
  </div>
);

export const CopyButton: React.FC<{ value: string; label?: string }> = ({
  value,
  label,
}) => {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard?.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="inline-flex items-center gap-1 rounded px-1 text-stone-700 hover:bg-[#f5f5f7]"
      title={`Copy ${label ?? value}`}
    >
      {label && <span className="font-mono">{label}</span>}
      {copied ? (
        <Check className="h-3 w-3 text-[#0a7a4b]" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </button>
  );
};

// ---------------------------------------------------------------------------
// Drawer
// ---------------------------------------------------------------------------

export const Drawer: React.FC<{
  label: string;
  onClose: () => void;
  header: React.ReactNode;
  children: React.ReactNode;
  wide?: boolean;
}> = ({ label, onClose, header, children, wide }) => {
  const mobile = useIsMobile();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    // Keep the page behind from scrolling while the sheet is open.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-40 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      <button
        className="absolute inset-0 bg-stone-950/40"
        onClick={onClose}
        aria-label="Close"
      />
      <aside
        className={`relative flex h-full w-full ${wide ? "md:max-w-2xl" : "md:max-w-xl"} flex-col bg-white shadow-2xl`}
      >
        {mobile && (
          <div className="flex items-center bg-white px-2 pt-2">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-semibold text-[#075f3c]"
            >
              <ArrowRight className="h-4 w-4 rotate-180" />
              Back
            </button>
          </div>
        )}
        <div className="relative z-10 flex items-start justify-between gap-3 bg-white px-5 pb-4 pt-2 shadow-[0_8px_14px_-12px_rgba(16,24,40,0.35)] md:pt-4">
          <div className="min-w-0 flex-1">{header}</div>
          {!mobile && (
            <button
              onClick={onClose}
              className="rounded-full p-2 text-stone-500 hover:bg-[#f5f5f7]"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <div className="admin-safe-bottom flex-1 space-y-6 overflow-y-auto px-5 py-5">
          {children}
        </div>
      </aside>
    </div>
  );
};

/** On phones, secondary content sits behind a "Show more" toggle. */
export const MoreSection: React.FC<{
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}> = ({ label, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-xl bg-[#eef0f4] px-4 py-3 text-sm font-semibold text-stone-800"
      >
        {label}
        <ChevronDown
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="mt-4 space-y-6">{children}</div>}
    </section>
  );
};

// ---------------------------------------------------------------------------
// Contact actions
// ---------------------------------------------------------------------------

export const ContactActions: React.FC<{
  phone: string | null;
  email: string | null;
  whatsapp: boolean;
  chatMessage: string;
  onEmail: () => void;
  onContacted?: (channel: string) => void;
}> = ({ phone, email, whatsapp, chatMessage, onEmail, onContacted }) => {
  const base =
    "flex flex-col items-center justify-center gap-1 rounded-xl py-3 text-xs font-semibold transition aria-disabled:pointer-events-none aria-disabled:opacity-40 disabled:opacity-40 md:text-[11px]";
  const tonal = `${base} bg-[#eef0f4] text-stone-900 hover:bg-[#e2e6ec]`;
  const green = `${base} bg-[#075f3c] text-white hover:bg-[#064f32]`;
  // The channel they told us they use gets the solid green button.
  return (
    <div className="grid grid-cols-4 gap-2">
      <a
        href={phone ? `tel:${phone}` : undefined}
        aria-disabled={!phone}
        className={whatsapp ? tonal : green}
        onClick={() => onContacted?.("call")}
      >
        <Phone className="h-5 w-5 md:h-4 md:w-4" />
        Call
      </a>
      <a
        href={phone ? whatsappLink(phone, chatMessage) : undefined}
        target="_blank"
        rel="noreferrer"
        aria-disabled={!phone}
        className={whatsapp ? green : tonal}
        title={whatsapp ? "They said this number is on WhatsApp" : undefined}
        onClick={() => onContacted?.("WhatsApp")}
      >
        <WhatsApp className="h-5 w-5 md:h-4 md:w-4" />
        WhatsApp
      </a>
      <a
        href={phone ? smsLink(phone, chatMessage) : undefined}
        aria-disabled={!phone}
        className={tonal}
        onClick={() => onContacted?.("text message")}
      >
        <Note className="h-5 w-5 md:h-4 md:w-4" />
        Text
      </a>
      <button
        type="button"
        onClick={onEmail}
        disabled={!email}
        className={tonal}
      >
        <Mail className="h-5 w-5 md:h-4 md:w-4" />
        Email
      </button>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Composer: internal note or email to the applicant
// ---------------------------------------------------------------------------

export type ComposerTab = "note" | "email";

export const Composer: React.FC<{
  target: { submissionId: string } | { draftId: string };
  email: string | null;
  greetingName: string | null;
  templates: EmailTemplate[];
  tab: ComposerTab;
  setTab: (tab: ComposerTab) => void;
  onDone: () => void;
}> = ({ target, email, greetingName, templates, tab, setTab, onDone }) => {
  const { db, session, toast } = useAdmin();
  const [note, setNote] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const addNote = async () => {
    if (!note.trim()) return;
    setBusy(true);
    const { error } = await db.from("submission_events").insert({
      ...("submissionId" in target
        ? { submission_id: target.submissionId }
        : { draft_id: target.draftId }),
      type: "note",
      body: note.trim(),
      actor_id: session.user.id,
      actor_email: session.user.email,
    });
    setBusy(false);
    if (error) return toast(`Couldn't add note: ${error.message}`);
    setNote("");
    onDone();
  };

  const sendEmail = async () => {
    if (!subject.trim() || !message.trim()) return;
    setBusy(true);
    const { error } = await db.functions.invoke("admin-send-email", {
      body: { ...target, subject, message },
    });
    setBusy(false);
    if (error) {
      let detail = error.message;
      if (error instanceof FunctionsHttpError) {
        detail =
          (await error.context.json().catch(() => null))?.error ?? detail;
      }
      toast(detail);
      onDone();
      return;
    }
    toast(`Email sent to ${email}`);
    setSubject("");
    setMessage("");
    onDone();
  };

  return (
    <section>
      <div className="mb-2 flex gap-1">
        {(
          [
            ["note", "Add note", Note],
            ["email", "Email", Mail],
          ] as const
        ).map(([value, label, Icon]) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            disabled={value === "email" && !email}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold disabled:opacity-40 ${
              tab === value
                ? "bg-stone-950 text-white"
                : "text-stone-600 hover:bg-[#f5f5f7]"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {tab === "note" ? (
        <div className="space-y-2">
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Internal note, e.g. called, will visit Friday with passport. Only staff see this."
            className="field-control px-3 py-2 text-sm"
          />
          <div className="flex justify-end">
            <button
              onClick={addNote}
              disabled={busy || !note.trim()}
              className="btn-primary px-4 py-2 text-xs disabled:opacity-50"
            >
              Save note
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {templates.map((t) => (
              <button
                key={t.label}
                onClick={() => {
                  setSubject(t.subject);
                  setMessage(t.message);
                }}
                className="rounded-full bg-[#eef0f4] px-3 py-1.5 text-xs font-semibold text-stone-800 hover:bg-[#e2e6ec] md:px-2.5 md:py-1 md:text-[11px]"
              >
                {t.label}
              </button>
            ))}
          </div>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            maxLength={150}
            className="field-control px-3 py-2 text-sm"
          />
          <div className="rounded-lg bg-[#eef0f4] px-3 pt-2 text-sm text-stone-500">
            Hello {greetingName || "there"},
            <textarea
              rows={8}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Pick a template above or write your message. Your name and signature are added automatically."
              maxLength={5000}
              className="mt-1 block w-full resize-y border-0 bg-transparent p-0 pb-2 text-sm text-stone-900 outline-none"
            />
          </div>
          <div className="flex flex-col-reverse gap-2 md:flex-row md:items-center md:justify-between">
            <span className="text-[11px] text-stone-500">
              To {email} · replies go to the office inbox
            </span>
            <button
              onClick={sendEmail}
              disabled={busy || !subject.trim() || !message.trim()}
              className="btn-primary w-full whitespace-nowrap px-4 py-3 text-sm disabled:opacity-50 md:w-auto md:py-2 md:text-xs"
            >
              {busy ? <Spinner /> : <Send className="h-3.5 w-3.5" />}
              Send email
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

// ---------------------------------------------------------------------------
// Workflow: status + assignee
// ---------------------------------------------------------------------------

export function Workflow<T extends string>({
  statuses,
  status,
  assignedTo,
  onChange,
  saving,
}: {
  statuses: StatusMeta<T>[];
  status: T;
  assignedTo: string | null;
  onChange: (patch: { status?: T; assigned_to?: string | null }) => void;
  saving: boolean;
}) {
  const { admins, session, adminName } = useAdmin();
  const mobile = useIsMobile();
  const mine = assignedTo === session.user.id;
  return (
    <section>
      <SectionTitle>Status</SectionTitle>
      <div
        className={
          mobile
            ? "-mx-5 flex gap-2 overflow-x-auto px-5 pb-1"
            : "flex flex-wrap gap-1.5"
        }
      >
        {statuses.map((s) => (
          <button
            key={s.value}
            disabled={saving}
            onClick={() => onChange({ status: s.value })}
            aria-pressed={status === s.value}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition md:px-3 md:py-1.5 ${
              status === s.value
                ? `${s.pill} shadow-sm`
                : "bg-[#eef0f4] text-stone-700 hover:bg-[#e2e6ec]"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
            {s.label}
            {status === s.value && <Check className="h-3 w-3" />}
          </button>
        ))}
      </div>
      {mobile ? (
        <div className="mt-3 flex items-center justify-between gap-2 text-xs text-stone-600">
          <span>
            {assignedTo
              ? `Assigned to ${mine ? "you" : adminName(assignedTo)}`
              : "Unassigned"}
          </span>
          <button
            disabled={saving}
            onClick={() =>
              onChange({ assigned_to: mine ? null : session.user.id })
            }
            className="rounded-full bg-[#eef0f4] px-3 py-1.5 font-semibold text-stone-800"
          >
            {mine ? "Unassign me" : "Assign to me"}
          </button>
        </div>
      ) : (
        <label className="mt-3 flex items-center gap-2 text-xs text-stone-600">
          Assigned to
          <select
            value={assignedTo ?? ""}
            disabled={saving}
            onChange={(e) => onChange({ assigned_to: e.target.value || null })}
            className="field-control w-auto px-2 py-1 text-xs"
          >
            <option value="">Unassigned</option>
            {admins.map((a) => (
              <option key={a.user_id} value={a.user_id}>
                {a.full_name || a.email}
                {a.user_id === session.user.id ? " (me)" : ""}
              </option>
            ))}
          </select>
        </label>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Activity timeline
// ---------------------------------------------------------------------------

export const Timeline: React.FC<{ events: TimelineEvent[] }> = ({ events }) => (
  <section>
    <SectionTitle>Activity</SectionTitle>
    <ol className="space-y-3 border-l border-[#e5e5ea] pl-4">
      {events.map((ev) => (
        <TimelineItem key={ev.id} event={ev} />
      ))}
    </ol>
  </section>
);

const TimelineItem: React.FC<{ event: TimelineEvent }> = ({ event }) => {
  const who = event.actor_email ?? "System";
  let title: React.ReactNode;
  let body: React.ReactNode = null;

  switch (event.type) {
    case "created":
      title = event.body ?? "Created";
      break;
    case "system":
      title = event.body;
      break;
    case "status_change":
      title = (
        <span className="inline-flex flex-wrap items-center gap-1.5">
          {event.actor_email ? `${who} set status to` : "Status changed to"}{" "}
          <StatusPill status={String(event.meta.to)} />
        </span>
      );
      break;
    case "assigned":
      title = event.body
        ? `${who} assigned this to ${event.body}`
        : `${who} unassigned this`;
      break;
    case "note":
      title = `${who} added a note`;
      body = event.body;
      break;
    case "email_sent":
      title = event.meta.automatic
        ? event.body
        : `${who} emailed: “${String(event.meta.subject ?? "")}”`;
      body = event.meta.automatic ? null : event.body;
      break;
    case "email_failed":
      title = <span className="text-[#b4232a]">{event.body}</span>;
      break;
  }

  const dot =
    event.type === "status_change"
      ? statusMeta(String(event.meta.to)).dot
      : event.type === "email_failed"
        ? "bg-[#b4232a]"
        : event.type === "email_sent"
          ? "bg-sky-500"
          : event.type === "created"
            ? "bg-[#0a7a4b]"
            : "bg-stone-300";

  return (
    <li className="relative">
      <span
        className={`absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-white ${dot}`}
      />
      <div className="text-xs text-stone-800">{title}</div>
      {body && (
        <p className="mt-1 whitespace-pre-wrap rounded-lg bg-[#f5f5f7] px-3 py-2 text-xs leading-5 text-stone-700">
          {body}
        </p>
      )}
      <div className="mt-0.5 text-[11px] text-stone-400">
        {formatDateTime(event.created_at)}
      </div>
    </li>
  );
};

// ---------------------------------------------------------------------------
// Pagination footer
// ---------------------------------------------------------------------------

export const Pager: React.FC<{
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
}> = ({ page, pageSize, total, onPage }) => (
  <div className="flex items-center justify-between border-t border-[#eeeeef] px-4 py-3 text-xs text-stone-600">
    <span>
      {total === 0
        ? "0 results"
        : `${page * pageSize + 1}–${Math.min(total, (page + 1) * pageSize)} of ${total}`}
    </span>
    <div className="flex gap-1.5">
      <button
        disabled={page === 0}
        onClick={() => onPage(page - 1)}
        className="rounded-full px-3 py-1.5 font-semibold hover:bg-[#f5f5f7] disabled:opacity-40"
      >
        Previous
      </button>
      <button
        disabled={(page + 1) * pageSize >= total}
        onClick={() => onPage(page + 1)}
        className="rounded-full px-3 py-1.5 font-semibold hover:bg-[#f5f5f7] disabled:opacity-40"
      >
        Next
      </button>
    </div>
  </div>
);

/** PostgREST `or` filters are comma/paren delimited; strip those from input. */
export const cleanSearch = (value: string) =>
  value.replace(/[,()%*\\]/g, " ").trim();

export function useDebounced<T>(value: T, ms = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}
