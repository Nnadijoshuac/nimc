import React, { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "../components/icons";
import { useAdmin } from "./context";
import { BarChart, FunnelChart, RankTable } from "./charts";
import {
  atlantaStartOfDay,
  fieldLabel,
  formatDuration,
  KIND_LABEL,
  SubmissionKind,
} from "./types";

type Range = "today" | "7d" | "30d" | "90d";

interface Overview {
  totals: {
    visitors: number;
    new_visitors: number;
    sessions: number;
    page_views: number;
    avg_session_s: number;
    leads: number;
    abandoned: number;
    recovered: number;
    submissions: number;
    completed: number;
    median_minutes_to_submit: number | null;
    live_now: number;
  };
  funnel: {
    visitors: number;
    opened: number;
    started: number;
    contact_given: number;
    submitted: number;
  };
  daily: {
    day: string;
    visitors: number;
    leads: number;
    submissions: number;
  }[];
  sources: {
    label: string;
    visitors: number;
    leads: number;
    submitted: number;
  }[];
  campaigns: { label: string; visitors: number; submitted: number }[];
  devices: { label: string; visitors: number; submitted: number }[];
  pages: { label: string; views: number; visitors: number }[];
  ctas: { label: string; clicks: number }[];
  dropoff: {
    kind: SubmissionKind;
    label: string;
    step: number;
    drafts: number;
  }[];
  errors: { label: string; errors: number }[];
  hours: { hour: number; submissions: number }[];
}

const RANGE_DAYS: Record<Range, number> = {
  today: 0,
  "7d": 6,
  "30d": 29,
  "90d": 89,
};

const pct = (a: number, b: number) =>
  b > 0 ? `${((a / b) * 100).toFixed(a / b < 0.1 ? 1 : 0)}%` : "–";

const shortDay = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

const hourLabel = (h: number) =>
  `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? "a" : "p"}`;

export const OverviewView: React.FC<{
  refreshKey: number;
  onGo: (tab: "leads" | "submissions" | "visitors") => void;
}> = ({ refreshKey, onGo }) => {
  const { db } = useAdmin();
  const [range, setRange] = useState<Range>("7d");
  const [kind, setKind] = useState<"all" | SubmissionKind>("all");
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await db.rpc("analytics_overview", {
      p_from: atlantaStartOfDay(RANGE_DAYS[range]).toISOString(),
      p_to: new Date().toISOString(),
      p_kind: kind === "all" ? null : kind,
    });
    if (error) setError(error.message);
    else {
      setError(null);
      setData(data as Overview);
    }
    setLoading(false);
  }, [db, range, kind]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);
  useEffect(() => {
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  const t = data?.totals;
  const f = data?.funnel;

  return (
    <div className="space-y-5">
      {/* Filters: one row above everything */}
      <section className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              ["today", "Today"],
              ["7d", "7 days"],
              ["30d", "30 days"],
              ["90d", "90 days"],
            ] as [Range, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setRange(value)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                range === value
                  ? "bg-stone-950 text-white"
                  : "bg-white text-stone-600 ring-1 ring-[#e5e5ea] hover:bg-[#f5f5f7]"
              }`}
            >
              {label}
            </button>
          ))}
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as typeof kind)}
            className="field-control ml-1 w-auto px-3 py-1.5 text-xs"
            aria-label="Form type"
          >
            <option value="all">All forms</option>
            <option value="pre_enrollment">Pre-enrolment</option>
            <option value="appointment">Appointment</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          {t && (
            <button
              onClick={() => onGo("visitors")}
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900 ring-1 ring-emerald-200"
            >
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              {t.live_now} on the site now
            </button>
          )}
          <button
            onClick={load}
            className="rounded-full p-2 text-stone-600 hover:bg-white"
            aria-label="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </section>

      {error && (
        <div className="rounded-lg bg-red-100 p-4 text-xs text-red-900">
          Couldn't load analytics: {error}
        </div>
      )}

      {t && f && data && (
        <>
          {/* Headline numbers */}
          <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <Tile
              label="Visitors"
              value={t.visitors}
              hint={`${t.new_visitors} new · ${t.sessions} visits`}
            />
            <Tile
              label="Page views"
              value={t.page_views}
              hint={`Avg visit ${formatDuration(t.avg_session_s)}`}
            />
            <Tile
              label="Left contact details"
              value={t.leads}
              hint={`${pct(t.leads, t.visitors)} of visitors`}
            />
            <Tile
              label="Need follow-up"
              value={t.abandoned}
              hint="Stopped part-way"
              tone={t.abandoned > 0 ? "amber" : undefined}
              onClick={() => onGo("leads")}
            />
            <Tile
              label="Submitted"
              value={t.submissions}
              hint={`${pct(t.submissions, t.visitors)} of visitors${
                t.median_minutes_to_submit !== null
                  ? ` · median ${formatDuration(t.median_minutes_to_submit * 60)} from first visit`
                  : ""
              }`}
              tone="green"
              onClick={() => onGo("submissions")}
            />
            <Tile
              label="Recovered by staff"
              value={t.recovered}
              hint="Submitted after staff followed up"
            />
          </section>

          <section className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
            <Card title="Funnel" subtitle="Unique people at each step">
              <FunnelChart
                steps={[
                  {
                    label: "Visited the site",
                    value: f.visitors,
                    hint: "Unique visitors in this period.",
                  },
                  {
                    label: "Opened a form",
                    value: f.opened,
                    hint: "Opened the pre-enrolment or appointment form.",
                  },
                  {
                    label: "Started typing",
                    value: f.started,
                    hint: "Typed into at least one field.",
                  },
                  {
                    label: "Left contact details",
                    value: f.contact_given,
                    hint: "Gave a valid email or phone number, so staff can follow up.",
                  },
                  {
                    label: "Submitted",
                    value: f.submitted,
                    hint: "Completed and submitted the form.",
                  },
                ]}
              />
            </Card>

            <Card title="Visitors per day">
              <BarChart
                ariaLabel="Visitors per day"
                data={data.daily.map((d) => ({
                  key: d.day,
                  label: shortDay(d.day),
                  value: d.visitors,
                  tooltip: (
                    <>
                      <div className="font-semibold">{shortDay(d.day)}</div>
                      <div>{d.visitors} visitors</div>
                      <div>{d.leads} left contact details</div>
                      <div>{d.submissions} submitted</div>
                    </>
                  ),
                }))}
              />
              <h4 className="mb-1 mt-4 text-xs font-semibold text-stone-700">
                Submissions per day
              </h4>
              <BarChart
                ariaLabel="Submissions per day"
                height={110}
                data={data.daily.map((d) => ({
                  key: d.day,
                  label: shortDay(d.day),
                  value: d.submissions,
                  tooltip: (
                    <>
                      <div className="font-semibold">{shortDay(d.day)}</div>
                      <div>{d.submissions} submitted</div>
                      <div>{d.leads} left contact details</div>
                    </>
                  ),
                }))}
              />
            </Card>
          </section>

          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <Card title="Where visitors come from">
              <RankTable
                valueLabel="Visitors"
                extraLabel="Submitted"
                rows={data.sources.map((s) => ({
                  label: s.label,
                  value: s.visitors,
                  extra: `${s.submitted} (${pct(s.submitted, s.visitors)})`,
                }))}
              />
            </Card>
            <Card
              title="Where people stop"
              subtitle="Last field touched on unfinished forms"
            >
              <RankTable
                valueLabel="People"
                extraLabel="Form"
                empty="Nobody has abandoned a form in this period"
                rows={data.dropoff.map((d) => ({
                  label: `${fieldLabel(d.label)} (step ${d.step})`,
                  value: d.drafts,
                  extra: KIND_LABEL[d.kind],
                }))}
              />
            </Card>
            <Card title="Devices">
              <RankTable
                valueLabel="Visitors"
                extraLabel="Submitted"
                rows={data.devices.map((d) => ({
                  label: d.label.charAt(0).toUpperCase() + d.label.slice(1),
                  value: d.visitors,
                  extra: `${d.submitted} (${pct(d.submitted, d.visitors)})`,
                }))}
              />
            </Card>
            <Card title="Most viewed pages">
              <RankTable
                mono
                valueLabel="Views"
                extraLabel="People"
                rows={data.pages.map((p) => ({
                  label: p.label,
                  value: p.views,
                  extra: p.visitors,
                }))}
              />
            </Card>
            <Card title="Buttons and links clicked">
              <RankTable
                valueLabel="Clicks"
                rows={data.ctas.map((c) => ({
                  label: c.label,
                  value: c.clicks,
                }))}
              />
            </Card>
            <Card title="Form errors" subtitle="Fields people struggle with">
              <RankTable
                valueLabel="Errors"
                empty="No form errors in this period"
                rows={data.errors.map((e) => ({
                  label: fieldLabel(e.label),
                  value: e.errors,
                }))}
              />
            </Card>
            {data.campaigns.length > 0 && (
              <Card title="Campaigns" subtitle="Links tagged with utm_campaign">
                <RankTable
                  valueLabel="Visitors"
                  extraLabel="Submitted"
                  rows={data.campaigns.map((c) => ({
                    label: c.label,
                    value: c.visitors,
                    extra: `${c.submitted} (${pct(c.submitted, c.visitors)})`,
                  }))}
                />
              </Card>
            )}
            <Card
              title="When people submit"
              subtitle="Hour of day, Atlanta time"
            >
              <BarChart
                ariaLabel="Submissions by hour of day"
                height={120}
                labelEvery={3}
                data={Array.from({ length: 24 }, (_, h) => {
                  const v =
                    data.hours.find((x) => x.hour === h)?.submissions ?? 0;
                  return {
                    key: String(h),
                    label: hourLabel(h),
                    value: v,
                    tooltip: `${hourLabel(h)}–${hourLabel((h + 1) % 24)}: ${v} submitted`,
                  };
                })}
              />
            </Card>
          </section>
        </>
      )}

      {!data && loading && (
        <p className="py-10 text-center text-sm text-stone-500">
          Loading analytics…
        </p>
      )}
    </div>
  );
};

const Tile: React.FC<{
  label: string;
  value: number;
  hint: string;
  tone?: "amber" | "green";
  onClick?: () => void;
}> = ({ label, value, hint, tone, onClick }) => {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={`paper-panel p-4 text-left ${onClick ? "transition hover:border-stone-300" : ""}`}
    >
      <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-stone-500">
        {label}
      </div>
      <div
        className={`mt-1 text-2xl font-extrabold tabular-nums ${
          tone === "amber"
            ? "text-amber-700"
            : tone === "green"
              ? "text-[#075f3c]"
              : "text-stone-950"
        }`}
      >
        {value.toLocaleString()}
      </div>
      <div className="mt-0.5 text-[11px] leading-4 text-stone-500">{hint}</div>
    </Tag>
  );
};

const Card: React.FC<{
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}> = ({ title, subtitle, children }) => (
  <div className="paper-panel p-4">
    <div className="mb-3">
      <h3 className="text-sm font-bold text-stone-950">{title}</h3>
      {subtitle && <p className="text-[11px] text-stone-500">{subtitle}</p>}
    </div>
    {children}
  </div>
);
