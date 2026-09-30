import React, { useCallback, useEffect, useState } from "react";
import { ChevronRight, RefreshCw } from "../components/icons";
import { useAdmin } from "./context";
import { Drawer, EmptyState, Pager, SectionTitle, StatusPill } from "./ui";
import { Journey, sourceLabel } from "./Journey";
import {
  atlantaStartOfDay,
  Draft,
  formatDateTime,
  formatDuration,
  FUNNEL_STAGES,
  KIND_LABEL,
  Session,
  Submission,
  timeAgo,
  titleCase,
  Visitor,
} from "./types";

const PAGE_SIZE = 30;

type Range = "live" | "today" | "7d" | "30d";

const rangeStart = (range: Range) => {
  if (range === "live") return new Date(Date.now() - 5 * 60 * 1000);
  if (range === "today") return atlantaStartOfDay();
  return atlantaStartOfDay(range === "7d" ? 6 : 29);
};

type SessionRow = Session & {
  visitors: Pick<
    Visitor,
    "email" | "full_name" | "phone" | "session_count"
  > | null;
};

export const VisitorsView: React.FC<{
  refreshKey: number;
  onOpenVisitor: (id: string) => void;
}> = ({ refreshKey, onOpenVisitor }) => {
  const { db } = useAdmin();
  const [range, setRange] = useState<Range>("today");
  const [minStage, setMinStage] = useState(0);
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<SessionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const from = page * PAGE_SIZE;
    let q = db
      .from("sessions")
      .select("*, visitors(email, full_name, phone, session_count)", {
        count: "exact",
      })
      .gte(
        range === "live" ? "last_seen_at" : "started_at",
        rangeStart(range).toISOString(),
      );
    if (minStage > 0) q = q.gte("funnel_stage", minStage);
    const { data, count } = await q
      .order(range === "live" ? "last_seen_at" : "started_at", {
        ascending: false,
      })
      .range(from, from + PAGE_SIZE - 1);
    setRows((data ?? []) as SessionRow[]);
    setTotal(count ?? 0);
    setLoading(false);
  }, [db, range, minStage, page]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);
  useEffect(() => setPage(0), [range, minStage]);
  // Live view refreshes itself.
  useEffect(() => {
    if (range !== "live") return;
    const t = setInterval(load, 15_000);
    return () => clearInterval(t);
  }, [range, load]);

  return (
    <div className="space-y-4">
      <section className="paper-panel flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              ["live", "On site now"],
              ["today", "Today"],
              ["7d", "7 days"],
              ["30d", "30 days"],
            ] as [Range, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setRange(value)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                range === value
                  ? "bg-stone-950 text-white"
                  : "text-stone-600 hover:bg-[#f5f5f7]"
              }`}
            >
              {value === "live" && (
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              )}
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={minStage}
            onChange={(e) => setMinStage(Number(e.target.value))}
            className="field-control w-auto px-3 py-1.5 text-xs"
            aria-label="Furthest step reached"
          >
            <option value={0}>Everyone</option>
            <option value={1}>Opened a form</option>
            <option value={2}>Started typing</option>
            <option value={3}>Left contact details</option>
            <option value={4}>Submitted</option>
          </select>
          <button
            onClick={load}
            className="rounded-full p-2 text-stone-600 hover:bg-[#f5f5f7]"
            aria-label="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </section>

      <section className="paper-panel overflow-hidden">
        {rows.length === 0 && !loading ? (
          <EmptyState
            title={
              range === "live"
                ? "Nobody on the site right now"
                : "No visits yet"
            }
            body="Visits are recorded as people browse the public site."
          />
        ) : (
          <>
            <table className="hidden w-full text-left text-sm md:table">
              <thead className="border-b border-[#eeeeef] bg-[#fbfbfd] text-[11px] uppercase tracking-[0.06em] text-stone-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Visitor</th>
                  <th className="px-4 py-3 font-semibold">Came from</th>
                  <th className="px-4 py-3 font-semibold">Landed on</th>
                  <th className="px-4 py-3 font-semibold">Activity</th>
                  <th className="px-4 py-3 font-semibold">Got to</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className={loading ? "opacity-60" : ""}>
                {rows.map((s) => {
                  const live =
                    Date.now() - new Date(s.last_seen_at).getTime() <
                    5 * 60 * 1000;
                  const known = s.visitors?.full_name || s.visitors?.email;
                  const duration =
                    (new Date(s.last_seen_at).getTime() -
                      new Date(s.started_at).getTime()) /
                    1000;
                  return (
                    <tr
                      key={s.id}
                      onClick={() => onOpenVisitor(s.visitor_id)}
                      className="cursor-pointer border-b border-[#f2f2f4] last:border-0 hover:bg-[#fafafa]"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 font-semibold">
                          {live && (
                            <span
                              className="h-2 w-2 animate-pulse rounded-full bg-emerald-500"
                              title="On the site now"
                            />
                          )}
                          {known
                            ? titleCase(s.visitors?.full_name) ||
                              s.visitors?.email
                            : "Anonymous visitor"}
                        </div>
                        <div className="text-[11px] text-stone-500">
                          {[s.device, s.browser, s.os]
                            .filter(Boolean)
                            .join(" · ")}
                          {s.visitors &&
                            s.visitors.session_count > 1 &&
                            ` · visit ${s.visitors.session_count}`}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <div className="text-stone-800">
                          {sourceLabel(s.source, s.medium)}
                        </div>
                        {s.campaign && (
                          <div className="text-stone-500">{s.campaign}</div>
                        )}
                      </td>
                      <td className="max-w-[12rem] truncate px-4 py-3 font-mono text-[11px] text-stone-600">
                        {s.landing_path ?? "/"}
                      </td>
                      <td className="px-4 py-3 text-xs text-stone-600">
                        <div>{formatDateTime(s.started_at)}</div>
                        <div className="text-stone-500">
                          {s.page_views} page{s.page_views === 1 ? "" : "s"} ·{" "}
                          {formatDuration(duration)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StagePill stage={s.funnel_stage} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ChevronRight className="inline h-4 w-4 text-stone-400" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <ul
              className={`divide-y divide-[#f2f2f4] md:hidden ${loading ? "opacity-60" : ""}`}
            >
              {rows.map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => onOpenVisitor(s.visitor_id)}
                    className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">
                        {titleCase(s.visitors?.full_name) ||
                          s.visitors?.email ||
                          "Anonymous visitor"}
                      </div>
                      <div className="text-[11px] text-stone-500">
                        {sourceLabel(s.source, s.medium)} ·{" "}
                        {timeAgo(s.started_at)}
                      </div>
                    </div>
                    <StagePill stage={s.funnel_stage} />
                  </button>
                </li>
              ))}
            </ul>
            <Pager
              page={page}
              pageSize={PAGE_SIZE}
              total={total}
              onPage={setPage}
            />
          </>
        )}
      </section>
    </div>
  );
};

const STAGE_TONE = [
  "bg-stone-100 text-stone-600 border-stone-200",
  "bg-sky-50 text-sky-900 border-sky-200",
  "bg-violet-50 text-violet-900 border-violet-200",
  "bg-amber-50 text-amber-900 border-amber-200",
  "bg-emerald-50 text-emerald-900 border-emerald-200",
];

export const StagePill: React.FC<{ stage: number }> = ({ stage }) => (
  <span
    className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${STAGE_TONE[stage] ?? STAGE_TONE[0]}`}
  >
    {FUNNEL_STAGES[stage] ?? "Visited"}
  </span>
);

/** A single visitor: who they are (if known), their forms, and full journey. */
export const VisitorPanel: React.FC<{
  visitorId: string;
  onClose: () => void;
  onOpenDraft: (id: string) => void;
  onOpenSubmission: (id: string) => void;
}> = ({ visitorId, onClose, onOpenDraft, onOpenSubmission }) => {
  const { db } = useAdmin();
  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [subs, setSubs] = useState<Submission[]>([]);

  useEffect(() => {
    Promise.all([
      db.from("visitors").select("*").eq("id", visitorId).maybeSingle(),
      db
        .from("form_drafts")
        .select("*")
        .eq("visitor_id", visitorId)
        .order("created_at", { ascending: false }),
      db
        .from("submissions")
        .select("*")
        .eq("visitor_id", visitorId)
        .order("created_at", { ascending: false }),
    ]).then(([v, d, s]) => {
      setVisitor((v.data as Visitor) ?? null);
      setDrafts((d.data ?? []) as Draft[]);
      setSubs((s.data ?? []) as Submission[]);
    });
  }, [db, visitorId]);

  const name =
    titleCase(visitor?.full_name) || visitor?.email || "Anonymous visitor";

  return (
    <Drawer
      label="Visitor"
      onClose={onClose}
      wide
      header={
        <>
          <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-stone-500">
            Visitor
          </div>
          <h2 className="mt-0.5 truncate text-lg font-bold">{name}</h2>
          {visitor && (
            <div className="mt-1 text-xs text-stone-500">
              {[visitor.email, visitor.phone].filter(Boolean).join(" · ") ||
                "Hasn't shared contact details"}
            </div>
          )}
        </>
      }
    >
      {(subs.length > 0 || drafts.length > 0) && (
        <section>
          <SectionTitle>Forms</SectionTitle>
          <ul className="divide-y divide-[#f2f2f4] overflow-hidden rounded-lg border border-[#eeeeef]">
            {subs.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => onOpenSubmission(s.id)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-xs hover:bg-[#fafafa]"
                >
                  <span>
                    <span className="font-semibold">
                      Submitted {KIND_LABEL[s.kind].toLowerCase()}
                    </span>
                    <span className="text-stone-500">
                      {" "}
                      · {s.reference} · {timeAgo(s.created_at)}
                    </span>
                  </span>
                  <StatusPill status={s.status} />
                </button>
              </li>
            ))}
            {drafts
              .filter((d) => d.status !== "converted")
              .map((d) => (
                <li key={d.id}>
                  <button
                    onClick={() => onOpenDraft(d.id)}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-xs hover:bg-[#fafafa]"
                  >
                    <span>
                      <span className="font-semibold">
                        Unfinished {KIND_LABEL[d.kind].toLowerCase()}
                      </span>
                      <span className="text-stone-500">
                        {" "}
                        · {d.fields_completed}/{d.fields_total} fields ·{" "}
                        {timeAgo(d.updated_at)}
                      </span>
                    </span>
                    <StatusPill status={d.status} />
                  </button>
                </li>
              ))}
          </ul>
        </section>
      )}
      <Journey visitorId={visitorId} />
    </Drawer>
  );
};
