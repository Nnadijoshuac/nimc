import React, { useCallback, useEffect, useState } from "react";
import { ChevronRight, RefreshCw, Search } from "../components/icons";
import { useAdmin } from "./context";
import {
  cleanSearch,
  EmptyState,
  KindBadge,
  Pager,
  StatusPill,
  useDebounced,
} from "./ui";
import { Draft, fieldLabel, SubmissionKind, timeAgo, titleCase } from "./types";

const PAGE_SIZE = 25;
const IDLE_MS = 30 * 60 * 1000;

export type LeadFilter =
  "follow_up" | "active" | "contacted" | "converted" | "dismissed" | "all";

const FILTERS: [LeadFilter, string, string][] = [
  [
    "follow_up",
    "Needs follow-up",
    "Stopped over 30 min ago, not contacted yet",
  ],
  ["active", "Filling in now", "Active in the last 30 minutes"],
  ["contacted", "Contacted", "You reached out, waiting on them"],
  ["converted", "Recovered", "Went on to submit"],
  ["dismissed", "Dismissed", ""],
  ["all", "All", ""],
];

export const LeadsView: React.FC<{
  refreshKey: number;
  onOpen: (id: string) => void;
  selectedId: string | null;
}> = ({ refreshKey, onOpen, selectedId }) => {
  const { db, adminName } = useAdmin();
  const [filter, setFilter] = useState<LeadFilter>("follow_up");
  const [kind, setKind] = useState<"all" | SubmissionKind>("all");
  const [searchInput, setSearchInput] = useState("");
  const search = cleanSearch(useDebounced(searchInput));
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<Draft[]>([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<Partial<Record<LeadFilter, number>>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const applyFilter = (q: any, f: LeadFilter) => {
    const cutoff = new Date(Date.now() - IDLE_MS).toISOString();
    switch (f) {
      case "follow_up":
        return q.eq("status", "open").lt("updated_at", cutoff);
      case "active":
        return q.eq("status", "open").gte("updated_at", cutoff);
      case "all":
        return q;
      default:
        return q.eq("status", f);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    let q = applyFilter(
      db.from("form_drafts").select("*", { count: "exact" }),
      filter,
    );
    if (kind !== "all") q = q.eq("kind", kind);
    if (search) {
      const t = `%${search}%`;
      q = q.or(`full_name.ilike.${t},email.ilike.${t},phone.ilike.${t}`);
    }
    const from = page * PAGE_SIZE;
    const { data, error, count } = await q
      .order("updated_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (error) setError(error.message);
    else {
      setRows((data ?? []) as Draft[]);
      setTotal(count ?? 0);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, filter, kind, search, page]);

  const loadCounts = useCallback(async () => {
    const results = await Promise.all(
      FILTERS.filter(([f]) => f !== "all").map(async ([f]) => {
        let q = applyFilter(
          db.from("form_drafts").select("id", { count: "exact", head: true }),
          f,
        );
        if (kind !== "all") q = q.eq("kind", kind);
        const { count } = await q;
        return [f, count ?? 0] as const;
      }),
    );
    setCounts(Object.fromEntries(results));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, kind]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);
  useEffect(() => {
    loadCounts();
  }, [loadCounts, refreshKey]);
  useEffect(() => setPage(0), [filter, kind, search]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs leading-5 text-amber-950">
        <strong>People who started a form and stopped.</strong> Their contact
        details were saved the moment they typed them. Reach out by name, and
        send their resume link so they can finish where they left off.
      </div>

      <section className="paper-panel flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {FILTERS.map(([value, label, hint]) => (
            <button
              key={value}
              title={hint}
              onClick={() => setFilter(value)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                filter === value
                  ? "bg-stone-950 text-white"
                  : "text-stone-600 hover:bg-[#f5f5f7]"
              }`}
            >
              {label}
              {counts[value] !== undefined && (
                <span
                  className={`rounded-full px-1.5 text-[10px] tabular-nums ${
                    filter === value
                      ? "bg-white/20"
                      : value === "follow_up" && counts[value]! > 0
                        ? "bg-amber-100 text-amber-900"
                        : "bg-[#eeeeef]"
                  }`}
                >
                  {counts[value]}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as typeof kind)}
            className="field-control w-auto px-3 py-1.5 text-xs"
            aria-label="Form type"
          >
            <option value="all">All forms</option>
            <option value="pre_enrollment">Pre-enrolment</option>
            <option value="appointment">Appointment</option>
          </select>
          <label className="relative flex-1 lg:w-64 lg:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Name, email or phone"
              className="field-control py-2 pl-9 pr-3 text-xs"
              aria-label="Search leads"
            />
          </label>
          <button
            onClick={() => {
              load();
              loadCounts();
            }}
            className="rounded-full p-2 text-stone-600 hover:bg-[#f5f5f7]"
            aria-label="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </section>

      <section className="paper-panel overflow-hidden">
        {error ? (
          <div className="p-6 text-sm text-[#b4232a]">
            Couldn't load leads: {error}
          </div>
        ) : rows.length === 0 && !loading ? (
          <EmptyState
            title={
              filter === "follow_up"
                ? "Nobody to chase right now"
                : "Nothing here"
            }
            body={
              filter === "follow_up"
                ? "Anyone who leaves a form part-way will appear here 30 minutes after they stop."
                : "No unfinished forms match these filters."
            }
          />
        ) : (
          <>
            <ul
              className={`divide-y divide-[#f2f2f4] ${loading ? "opacity-60" : ""}`}
            >
              {rows.map((d) => {
                const pct = Math.round(
                  (d.fields_completed / Math.max(1, d.fields_total)) * 100,
                );
                const activeNow =
                  d.status === "open" &&
                  Date.now() - new Date(d.updated_at).getTime() < 5 * 60 * 1000;
                const name =
                  d.full_name ||
                  [d.first_name, d.data?.surname].filter(Boolean).join(" ");
                return (
                  <li key={d.id}>
                    <button
                      onClick={() => onOpen(d.id)}
                      className={`grid w-full grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 text-left hover:bg-[#fafafa] md:grid-cols-[1.4fr_1fr_1.1fr_0.8fr_auto] ${
                        selectedId === d.id ? "bg-emerald-50/50" : ""
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 truncate text-sm font-semibold">
                          {activeNow && (
                            <span
                              className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-emerald-500"
                              title="Filling it in right now"
                            />
                          )}
                          {name ? titleCase(name) : (d.email ?? d.phone)}
                        </div>
                        <div className="truncate text-xs text-stone-500">
                          {d.email ?? "No email"}
                        </div>
                      </div>

                      <div className="hidden text-xs md:block">
                        <div className="text-stone-800">
                          {d.phone ?? "No phone"}
                        </div>
                        {d.whatsapp && (
                          <span className="text-[11px] font-semibold text-emerald-700">
                            On WhatsApp
                          </span>
                        )}
                      </div>

                      <div className="hidden md:block">
                        <KindBadge kind={d.kind} />
                        <div className="mt-1 flex items-center gap-2">
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[#eeeeef]">
                            <div
                              className="h-full rounded-full bg-[#0a7a4b]"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-stone-500">
                            {pct}%
                            {d.last_field
                              ? ` · ${fieldLabel(d.last_field)}`
                              : ""}
                          </span>
                        </div>
                      </div>

                      <div className="hidden text-xs text-stone-500 md:block">
                        {timeAgo(d.updated_at)}
                        {d.assigned_to && (
                          <div className="text-[11px]">
                            {adminName(d.assigned_to)}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <StatusPill status={d.status} />
                        <ChevronRight className="hidden h-4 w-4 text-stone-400 md:block" />
                      </div>
                    </button>
                  </li>
                );
              })}
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
