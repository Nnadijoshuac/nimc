import React, { useEffect, useState } from "react";
import { FunctionsHttpError } from "@supabase/supabase-js";
import {
  Calendar,
  Check,
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
// Small pieces
// ---------------------------------------------------------------------------

export const StatusPill: React.FC<{ status: string }> = ({ status }) => {
  const meta = statusMeta(status);
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${meta.pill}`}
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
  <div className={`bg-white px-3 py-2.5 ${wide ? "col-span-2" : ""}`}>
    <dt className="text-[10px] font-semibold uppercase tracking-[0.06em] text-stone-500">
      {label}
    </dt>
    <dd className="mt-0.5 break-words font-semibold text-stone-900">{value}</dd>
  </div>
);

export const FieldGrid: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[#eeeeef] bg-[#eeeeef] text-sm">
    {children}
  </dl>
);

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
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-40 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      <button
        className="absolute inset-0 bg-stone-950/30"
        onClick={onClose}
        aria-label="Close"
      />
      <aside
        className={`relative flex h-full w-full ${wide ? "max-w-2xl" : "max-w-xl"} flex-col bg-white shadow-2xl`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#eeeeef] px-5 py-4">
          <div className="min-w-0 flex-1">{header}</div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-stone-500 hover:bg-[#f5f5f7]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          {children}
        </div>
      </aside>
    </div>
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
  const btn =
    "btn-secondary flex-col gap-1 py-3 text-[11px] aria-disabled:pointer-events-none aria-disabled:opacity-40";
  return (
    <div className="grid grid-cols-4 gap-2">
      <a
        href={phone ? `tel:${phone}` : undefined}
        aria-disabled={!phone}
        className={btn}
        onClick={() => onContacted?.("call")}
      >
        <Phone className="h-4 w-4" />
        Call
      </a>
      <a
        href={phone ? whatsappLink(phone, chatMessage) : undefined}
        target="_blank"
        rel="noreferrer"
        aria-disabled={!phone}
        className={`${btn} ${whatsapp ? "ring-2 ring-emerald-400/60" : ""}`}
        title={whatsapp ? "They said this number is on WhatsApp" : undefined}
        onClick={() => onContacted?.("WhatsApp")}
      >
        <WhatsApp className="h-4 w-4" />
        WhatsApp
      </a>
      <a
        href={phone ? smsLink(phone, chatMessage) : undefined}
        aria-disabled={!phone}
        className={btn}
        onClick={() => onContacted?.("text message")}
      >
        <Note className="h-4 w-4" />
        Text
      </a>
      <button
        type="button"
        onClick={onEmail}
        disabled={!email}
        className={`${btn} disabled:opacity-40`}
      >
        <Mail className="h-4 w-4" />
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
                className="rounded-full border border-[#e5e5ea] px-2.5 py-1 text-[11px] font-semibold text-stone-600 hover:bg-[#f5f5f7]"
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
          <div className="rounded-lg border border-[#e5e5ea] bg-[#fbfbfd] px-3 pt-2 text-sm text-stone-500">
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
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-stone-500">
              To {email} · replies go to the office inbox
            </span>
            <button
              onClick={sendEmail}
              disabled={busy || !subject.trim() || !message.trim()}
              className="btn-primary px-4 py-2 text-xs disabled:opacity-50"
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
  const { admins, session } = useAdmin();
  return (
    <section>
      <SectionTitle>Status</SectionTitle>
      <div className="flex flex-wrap gap-1.5">
        {statuses.map((s) => (
          <button
            key={s.value}
            disabled={saving}
            onClick={() => onChange({ status: s.value })}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              status === s.value
                ? s.pill
                : "border-[#e5e5ea] text-stone-600 hover:bg-[#f5f5f7]"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
            {s.label}
          </button>
        ))}
      </div>
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
