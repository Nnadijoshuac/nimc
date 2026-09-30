import React, { useEffect, useState } from "react";
import { useAdmin } from "./context";
import { SectionTitle } from "./ui";
import {
  AnalyticsEvent,
  fieldLabel,
  formatDateTime,
  formatDuration,
  formatTime,
  FUNNEL_STAGES,
  KIND_LABEL,
  Session,
  Visitor,
} from "./types";

export function describeEvent(e: AnalyticsEvent): string {
  const form = e.form_kind ? KIND_LABEL[e.form_kind].toLowerCase() : "form";
  const p = e.props ?? {};
  switch (e.name) {
    case "page_view":
      return `Viewed ${e.path ?? "/"}`;
    case "cta_click":
      return `Clicked “${String(p.label ?? "button")}”`;
    case "form_open":
      return `Opened the ${form} form`;
    case "form_resume":
      return `Reopened the ${form} form from a resume link`;
    case "form_start":
      return `Started typing (${fieldLabel(String(p.field ?? ""))})`;
    case "form_step":
      return `Moved to step ${String(p.step)} of the ${form} form`;
    case "contact_captured":
      return "Left contact details";
    case "form_error":
      return `Hit a problem on ${fieldLabel(String(p.field ?? "form"))}${p.message ? `: ${String(p.message)}` : ""}`;
    case "form_close":
      return `Closed the ${form} form at step ${String(p.step ?? 1)}${p.last_field ? `, last touched ${fieldLabel(String(p.last_field))}` : ""}`;
    case "form_submit":
      return `Submitted the ${form} form`;
    default:
      return e.name;
  }
}

const EVENT_TONE: Record<string, string> = {
  contact_captured: "bg-sky-500",
  form_submit: "bg-[#0a7a4b]",
  form_error: "bg-[#b4232a]",
  form_close: "bg-amber-500",
  cta_click: "bg-violet-500",
};

export const sourceLabel = (source: string | null, medium: string | null) =>
  [source ?? "direct", medium].filter(Boolean).join(" · ");

/** Where someone came from and everything they did, session by session. */
export const Journey: React.FC<{
  visitorId: string | null;
  /** When the lead or submission happened, to show "time to convert". */
  convertedAt?: string | null;
}> = ({ visitorId, convertedAt }) => {
  const { db } = useAdmin();
  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    if (!visitorId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      db.from("visitors").select("*").eq("id", visitorId).maybeSingle(),
      db
        .from("sessions")
        .select("*")
        .eq("visitor_id", visitorId)
        .order("started_at", { ascending: false })
        .limit(20),
      db
        .from("analytics_events")
        .select("*")
        .eq("visitor_id", visitorId)
        .order("created_at", { ascending: true })
        .limit(500),
    ]).then(([v, s, e]) => {
      setVisitor((v.data as Visitor) ?? null);
      const list = (s.data ?? []) as Session[];
      setSessions(list);
      setEvents((e.data ?? []) as AnalyticsEvent[]);
      setOpen(list[0]?.id ?? null);
      setLoading(false);
    });
  }, [visitorId, db]);

  if (!visitorId) {
    return (
      <section>
        <SectionTitle>Journey</SectionTitle>
        <p className="rounded-lg bg-[#f5f5f7] p-3 text-xs text-stone-500">
          No browsing history for this person (tracking blocked by their browser
          or privacy settings).
        </p>
      </section>
    );
  }
  if (loading) {
    return (
      <section>
        <SectionTitle>Journey</SectionTitle>
        <p className="text-xs text-stone-500">Loading journey…</p>
      </section>
    );
  }
  if (!visitor) return null;

  const minutesToConvert = convertedAt
    ? (new Date(convertedAt).getTime() -
        new Date(visitor.first_seen_at).getTime()) /
      1000
    : null;

  return (
    <section>
      <SectionTitle>Journey</SectionTitle>
      <dl className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
        <Stat
          label="First visit"
          value={formatDateTime(visitor.first_seen_at)}
        />
        <Stat
          label="Came from"
          value={sourceLabel(visitor.first_source, visitor.first_medium)}
        />
        <Stat label="Campaign" value={visitor.first_campaign ?? "None"} />
        <Stat label="Landed on" value={visitor.first_landing_path ?? "/"} />
        <Stat
          label="Device"
          value={[visitor.device, visitor.browser, visitor.os]
            .filter(Boolean)
            .join(" · ")}
        />
        <Stat
          label="Visits"
          value={`${visitor.session_count} session${visitor.session_count === 1 ? "" : "s"}`}
        />
        {minutesToConvert !== null && minutesToConvert >= 0 && (
          <Stat
            label="First visit → this"
            value={formatDuration(minutesToConvert)}
          />
        )}
        <Stat label="Last seen" value={formatDateTime(visitor.last_seen_at)} />
        {visitor.submission_count > 0 && (
          <Stat label="Submissions" value={String(visitor.submission_count)} />
        )}
      </dl>

      <ol className="mt-3 space-y-2">
        {sessions.map((s) => {
          const sessionEvents = events.filter((e) => e.session_id === s.id);
          const expanded = open === s.id;
          const duration =
            (new Date(s.last_seen_at).getTime() -
              new Date(s.started_at).getTime()) /
            1000;
          return (
            <li key={s.id} className="overflow-hidden rounded-lg bg-[#eef0f4]">
              <button
                onClick={() => setOpen(expanded ? null : s.id)}
                className="flex w-full items-center justify-between gap-3 bg-[#fbfbfd] px-3 py-2 text-left text-xs hover:bg-[#f5f5f7]"
                aria-expanded={expanded}
              >
                <span className="min-w-0">
                  <span className="font-semibold text-stone-900">
                    {formatDateTime(s.started_at)}
                  </span>
                  <span className="text-stone-500">
                    {" "}
                    · {sourceLabel(s.source, s.medium)} · {s.page_views} page
                    {s.page_views === 1 ? "" : "s"} · {formatDuration(duration)}
                  </span>
                </span>
                <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-stone-700 shadow-sm">
                  {FUNNEL_STAGES[s.funnel_stage] ?? "Visited"}
                </span>
              </button>
              {expanded && (
                <ol className="space-y-1.5 bg-white px-3 py-2.5">
                  {sessionEvents.length === 0 && (
                    <li className="text-[11px] text-stone-400">
                      No events recorded.
                    </li>
                  )}
                  {sessionEvents.map((e) => (
                    <li key={e.id} className="flex items-start gap-2 text-xs">
                      <span className="w-20 shrink-0 font-mono text-[10px] leading-5 text-stone-400">
                        {formatTime(e.created_at)}
                      </span>
                      <span
                        className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${EVENT_TONE[e.name] ?? "bg-stone-300"}`}
                      />
                      <span className="text-stone-700">{describeEvent(e)}</span>
                    </li>
                  ))}
                </ol>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
};

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-lg bg-[#eef0f4] px-3 py-2">
    <dt className="text-[10px] font-semibold uppercase tracking-[0.06em] text-stone-500">
      {label}
    </dt>
    <dd className="mt-0.5 truncate font-semibold text-stone-900" title={value}>
      {value}
    </dd>
  </div>
);
