import React, { useCallback, useEffect, useState } from "react";
import { ArrowRight, Phone, Search, WhatsApp, X } from "../components/icons";
import { useAdmin } from "./context";
import {
  draftChatMessage,
  submissionChatMessage,
  whatsappLink,
} from "./outreach";
import { useLogOutreach } from "./quick";
import { cleanSearch, StatusPill, useDebounced } from "./ui";
import {
  Draft,
  fieldLabel,
  formatDate,
  KIND_LABEL,
  Submission,
  timeAgo,
  titleCase,
} from "./types";

/**
 * Phone layout: the "on the move" queue. Only the people who need action,
 * as big cards with one-tap call / WhatsApp, and a tap to open the full sheet.
 */

const STEP = 20;
const IDLE_MS = 30 * 60 * 1000;

const todayInAtlanta = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Q = any;

interface Chip<K extends string> {
  key: K;
  label: string;
  apply: (q: Q) => Q;
}

function useQueue<T, K extends string>(
  table: "submissions" | "form_drafts",
  chips: Chip<K>[],
  initial: K,
  searchCols: string[],
  order: string,
  refreshKey: number,
) {
  const { db } = useAdmin();
  const [chip, setChip] = useState<K>(initial);
  const [searchInput, setSearchInput] = useState("");
  const search = cleanSearch(useDebounced(searchInput));
  const [limit, setLimit] = useState(STEP);
  const [rows, setRows] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<Partial<Record<K, number>>>({});
  const [loading, setLoading] = useState(true);

  const active = chips.find((c) => c.key === chip) ?? chips[0];

  const load = useCallback(async () => {
    setLoading(true);
    let q = active.apply(db.from(table).select("*", { count: "exact" }));
    if (search) {
      const t = `%${search}%`;
      q = q.or(searchCols.map((c) => `${c}.ilike.${t}`).join(","));
    }
    const { data, count } = await q
      .order(order, { ascending: false })
      .range(0, limit - 1);
    setRows((data ?? []) as T[]);
    setTotal(count ?? 0);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, table, chip, search, limit]);

  const loadCounts = useCallback(async () => {
    const entries = await Promise.all(
      chips.map(async (c) => {
        const { count } = await c.apply(
          db.from(table).select("id", { count: "exact", head: true }),
        );
        return [c.key, count ?? 0] as const;
      }),
    );
    setCounts(Object.fromEntries(entries) as Partial<Record<K, number>>);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, table]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);
  useEffect(() => {
    loadCounts();
  }, [loadCounts, refreshKey]);
  useEffect(() => setLimit(STEP), [chip, search]);

  return {
    chip,
    setChip,
    searchInput,
    setSearchInput,
    rows,
    total,
    counts,
    loading,
    more: () => setLimit((l) => l + STEP),
    reload: () => {
      load();
      loadCounts();
    },
  };
}

// ---------------------------------------------------------------------------
// Shared pieces
// ---------------------------------------------------------------------------

function Toolbar<K extends string>({
  chips,
  chip,
  setChip,
  counts,
  searchInput,
  setSearchInput,
  placeholder,
}: {
  chips: Chip<K>[];
  chip: K;
  setChip: (k: K) => void;
  counts: Partial<Record<K, number>>;
  searchInput: string;
  setSearchInput: (v: string) => void;
  placeholder: string;
}) {
  const [searching, setSearching] = useState(false);
  return (
    <div className="sticky top-14 z-20 -mx-4 bg-[#e4e7ec]/95 px-4 pb-3 pt-3 backdrop-blur">
      {searching ? (
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
          <input
            autoFocus
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={placeholder}
            className="field-control bg-white py-3 pl-9 pr-11 text-base"
          />
          <button
            onClick={() => {
              setSearchInput("");
              setSearching(false);
            }}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-2 text-stone-600"
            aria-label="Close search"
          >
            <X className="h-4 w-4" />
          </button>
        </label>
      ) : (
        <div className="flex items-center gap-2">
          <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto rounded-full">
            {chips.map((c) => {
              const on = c.key === chip;
              const n = counts[c.key];
              return (
                <button
                  key={c.key}
                  onClick={() => setChip(c.key)}
                  aria-pressed={on}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold shadow-sm ${
                    on ? "bg-stone-950 text-white" : "bg-white text-stone-800"
                  }`}
                >
                  {c.label}
                  {n !== undefined && (
                    <span
                      className={`rounded-full px-1.5 text-[11px] tabular-nums ${
                        on ? "bg-white/20" : "bg-[#eef0f4]"
                      }`}
                    >
                      {n}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setSearching(true)}
            className="shrink-0 rounded-full bg-white p-2.5 text-stone-800 shadow-sm"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

const QuickButton: React.FC<{
  href: string;
  icon: React.ReactNode;
  label: string;
  primary?: boolean;
  external?: boolean;
  onClick: () => void;
}> = ({ href, icon, label, primary, external, onClick }) => (
  <a
    href={href}
    target={external ? "_blank" : undefined}
    rel={external ? "noreferrer" : undefined}
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold ${
      primary ? "bg-[#075f3c] text-white" : "bg-[#eef0f4] text-stone-900"
    }`}
  >
    {icon}
    {label}
  </a>
);

const Card: React.FC<{
  onOpen: () => void;
  children: React.ReactNode;
  actions?: React.ReactNode;
}> = ({ onOpen, children, actions }) => (
  <li className="paper-panel overflow-hidden">
    <button onClick={onOpen} className="block w-full px-4 pb-3 pt-4 text-left">
      {children}
    </button>
    {actions && <div className="flex gap-2 px-4 pb-4">{actions}</div>}
  </li>
);

const LoadMore: React.FC<{
  shown: number;
  total: number;
  loading: boolean;
  onMore: () => void;
}> = ({ shown, total, loading, onMore }) =>
  shown < total ? (
    <button
      onClick={onMore}
      disabled={loading}
      className="mt-3 w-full rounded-xl bg-white py-3 text-sm font-semibold text-stone-800 shadow-sm"
    >
      {loading ? "Loading…" : `Show more (${total - shown} left)`}
    </button>
  ) : null;

const Empty: React.FC<{ title: string; body: string }> = ({ title, body }) => (
  <div className="paper-panel px-6 py-10 text-center">
    <p className="text-base font-bold">{title}</p>
    <p className="mt-1 text-sm leading-6 text-stone-500">{body}</p>
  </div>
);

// ---------------------------------------------------------------------------
// Submitted forms
// ---------------------------------------------------------------------------

type SubChip = "new" | "open" | "today" | "all";

const SUB_CHIPS: Chip<SubChip>[] = [
  { key: "new", label: "New", apply: (q) => q.eq("status", "new") },
  {
    key: "open",
    label: "In progress",
    apply: (q) => q.in("status", ["contacted", "in_progress"]),
  },
  {
    key: "today",
    label: "Visiting today",
    apply: (q) =>
      q.eq("appointment_date", todayInAtlanta()).neq("status", "cancelled"),
  },
  { key: "all", label: "All", apply: (q) => q },
];

export const MobileSubmissions: React.FC<{
  refreshKey: number;
  onOpen: (id: string) => void;
}> = ({ refreshKey, onOpen }) => {
  const { myName } = useAdmin();
  const logOutreach = useLogOutreach();
  const q = useQueue<Submission, SubChip>(
    "submissions",
    SUB_CHIPS,
    "new",
    ["full_name", "email", "phone", "reference"],
    "created_at",
    refreshKey,
  );

  const reach = (s: Submission, channel: string) =>
    logOutreach({ submissionId: s.id, status: s.status }, channel).then(
      q.reload,
    );

  return (
    <div>
      <Toolbar
        {...q}
        chips={SUB_CHIPS}
        placeholder="Name, phone or reference"
      />
      {q.rows.length === 0 && !q.loading ? (
        <Empty
          title={q.chip === "new" ? "You're all caught up" : "Nothing here"}
          body={
            q.chip === "new"
              ? "New submissions will appear here the moment someone finishes a form."
              : "No submissions match this filter."
          }
        />
      ) : (
        <ul className={`space-y-3 ${q.loading ? "opacity-60" : ""}`}>
          {q.rows.map((s) => (
            <Card
              key={s.id}
              onOpen={() => onOpen(s.id)}
              actions={
                <>
                  <QuickButton
                    href={`tel:${s.phone}`}
                    icon={<Phone className="h-4 w-4" />}
                    label="Call"
                    primary={!s.whatsapp}
                    onClick={() => reach(s, "call")}
                  />
                  <QuickButton
                    href={whatsappLink(
                      s.phone,
                      submissionChatMessage(s, myName),
                    )}
                    icon={<WhatsApp className="h-4 w-4" />}
                    label="WhatsApp"
                    primary={s.whatsapp}
                    external
                    onClick={() => reach(s, "WhatsApp")}
                  />
                  <button
                    onClick={() => onOpen(s.id)}
                    className="inline-flex items-center justify-center rounded-xl bg-[#eef0f4] px-4 text-stone-900"
                    aria-label={`Open ${s.full_name}`}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </>
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-base font-bold text-stone-950">
                    {titleCase(s.full_name)}
                  </div>
                  <div className="mt-0.5 text-sm text-stone-600">
                    {KIND_LABEL[s.kind]} · {timeAgo(s.created_at)}
                  </div>
                </div>
                <StatusPill status={s.status} />
              </div>
              {s.appointment_date && (
                <div className="mt-2 inline-flex rounded-lg bg-sky-50 px-2.5 py-1 text-sm font-semibold text-sky-900">
                  Visit {formatDate(s.appointment_date)} · {s.appointment_time}
                </div>
              )}
              <div className="mt-2 text-sm text-stone-700">
                {s.phone}
                {s.whatsapp && (
                  <span className="ml-1.5 font-semibold text-emerald-700">
                    · WhatsApp
                  </span>
                )}
              </div>
            </Card>
          ))}
        </ul>
      )}
      <LoadMore
        shown={q.rows.length}
        total={q.total}
        loading={q.loading}
        onMore={q.more}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Unfinished forms
// ---------------------------------------------------------------------------

type LeadChip = "follow_up" | "active" | "contacted" | "recovered";

const LEAD_CHIPS: Chip<LeadChip>[] = [
  {
    key: "follow_up",
    label: "Need follow-up",
    apply: (q) =>
      q
        .eq("status", "open")
        .lt("updated_at", new Date(Date.now() - IDLE_MS).toISOString()),
  },
  {
    key: "active",
    label: "Filling in now",
    apply: (q) =>
      q
        .eq("status", "open")
        .gte("updated_at", new Date(Date.now() - IDLE_MS).toISOString()),
  },
  {
    key: "contacted",
    label: "Contacted",
    apply: (q) => q.eq("status", "contacted"),
  },
  {
    key: "recovered",
    label: "Recovered",
    apply: (q) => q.eq("status", "converted"),
  },
];

export const MobileLeads: React.FC<{
  refreshKey: number;
  onOpen: (id: string) => void;
}> = ({ refreshKey, onOpen }) => {
  const { myName } = useAdmin();
  const logOutreach = useLogOutreach();
  const q = useQueue<Draft, LeadChip>(
    "form_drafts",
    LEAD_CHIPS,
    "follow_up",
    ["full_name", "email", "phone"],
    "updated_at",
    refreshKey,
  );

  const reach = (d: Draft, channel: string) =>
    logOutreach({ draftId: d.id, status: d.status }, channel).then(q.reload);

  return (
    <div>
      <Toolbar {...q} chips={LEAD_CHIPS} placeholder="Name, email or phone" />
      {q.rows.length === 0 && !q.loading ? (
        <Empty
          title={
            q.chip === "follow_up"
              ? "Nobody to chase right now"
              : "Nothing here"
          }
          body={
            q.chip === "follow_up"
              ? "People who stop part-way through a form appear here 30 minutes later."
              : "No unfinished forms match this filter."
          }
        />
      ) : (
        <ul className={`space-y-3 ${q.loading ? "opacity-60" : ""}`}>
          {q.rows.map((d) => {
            const pct = Math.round(
              (d.fields_completed / Math.max(1, d.fields_total)) * 100,
            );
            const name =
              titleCase(
                d.full_name ||
                  [d.first_name, d.data?.surname].filter(Boolean).join(" "),
              ) ||
              d.email ||
              d.phone;
            return (
              <Card
                key={d.id}
                onOpen={() => onOpen(d.id)}
                actions={
                  d.phone ? (
                    <>
                      <QuickButton
                        href={`tel:${d.phone}`}
                        icon={<Phone className="h-4 w-4" />}
                        label="Call"
                        primary={!d.whatsapp}
                        onClick={() => reach(d, "call")}
                      />
                      <QuickButton
                        href={whatsappLink(
                          d.phone,
                          draftChatMessage(d, myName),
                        )}
                        icon={<WhatsApp className="h-4 w-4" />}
                        label="WhatsApp"
                        primary={d.whatsapp}
                        external
                        onClick={() => reach(d, "WhatsApp")}
                      />
                      <button
                        onClick={() => onOpen(d.id)}
                        className="inline-flex items-center justify-center rounded-xl bg-[#eef0f4] px-4 text-stone-900"
                        aria-label={`Open ${name}`}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => onOpen(d.id)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#075f3c] py-2.5 text-sm font-semibold text-white"
                    >
                      Email them
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-base font-bold text-stone-950">
                      {name}
                    </div>
                    <div className="mt-0.5 text-sm text-stone-600">
                      {KIND_LABEL[d.kind]} · {timeAgo(d.updated_at)}
                    </div>
                  </div>
                  <StatusPill status={d.status} />
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#e2e6ec]">
                    <div
                      className="h-full rounded-full bg-[#0a7a4b]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-stone-800">
                    {pct}%
                  </span>
                </div>
                <div className="mt-1.5 text-sm text-stone-600">
                  {d.last_field
                    ? `Stopped at ${fieldLabel(d.last_field)}`
                    : "Left contact details"}
                  {d.phone ? ` · ${d.phone}` : d.email ? ` · ${d.email}` : ""}
                </div>
              </Card>
            );
          })}
        </ul>
      )}
      <LoadMore
        shown={q.rows.length}
        total={q.total}
        loading={q.loading}
        onMore={q.more}
      />
    </div>
  );
};
