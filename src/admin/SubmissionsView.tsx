import React, { useCallback, useEffect, useState } from "react";
import { ChevronRight, Download, RefreshCw, Search } from "../components/icons";
import { useAdmin } from "./context";
import {
  cleanSearch,
  EmptyState,
  KindBadge,
  Pager,
  StatusPill,
  useDebounced,
} from "./ui";
import {
  formatDate,
  STATUSES,
  Submission,
  SubmissionKind,
  SubmissionStatus,
  timeAgo,
} from "./types";

const PAGE_SIZE = 25;
const OPEN_STATUSES: SubmissionStatus[] = ["new", "contacted", "in_progress"];

type KindFilter = "all" | SubmissionKind;
type StatusFilter = "all" | "open" | "today" | SubmissionStatus;

const todayInAtlanta = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });

export const SubmissionsView: React.FC<{
  refreshKey: number;
  onOpen: (id: string) => void;
  selectedId: string | null;
}> = ({ refreshKey, onOpen, selectedId }) => {
  const { db, adminName, toast } = useAdmin();
  const [kind, setKind] = useState<KindFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("open");
  const [searchInput, setSearchInput] = useState("");
  const search = cleanSearch(useDebounced(searchInput));
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<Submission[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const applyFilters = (query: any) => {
    let q = query;
    if (kind !== "all") q = q.eq("kind", kind);
    if (status === "open") q = q.in("status", OPEN_STATUSES);
    else if (status === "today")
      q = q.eq("appointment_date", todayInAtlanta()).neq("status", "cancelled");
    else if (status !== "all") q = q.eq("status", status);
    if (search) {
      const t = `%${search}%`;
      q = q.or(
        `full_name.ilike.${t},email.ilike.${t},phone.ilike.${t},reference.ilike.${t}`,
      );
    }
    return q;
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const from = page * PAGE_SIZE;
    const { data, error, count } = await applyFilters(
      db.from("submissions").select("*", { count: "exact" }),
    )
      .order(status === "today" ? "appointment_time" : "created_at", {
        ascending: status === "today",
      })
      .range(from, from + PAGE_SIZE - 1);
    if (error) setError(error.message);
    else {
      setRows((data ?? []) as Submission[]);
      setTotal(count ?? 0);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, kind, status, search, page]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);
  useEffect(() => setPage(0), [kind, status, search]);

  const exportCsv = async () => {
    setExporting(true);
    const { data, error } = await applyFilters(
      db.from("submissions").select("*"),
    )
      .order("created_at", { ascending: false })
      .limit(5000);
    setExporting(false);
    if (error || !data)
      return toast(`Export failed: ${error?.message ?? "no data"}`);

    const list = data as Submission[];
    const detailKeys = Array.from(
      new Set(list.flatMap((r) => Object.keys(r.details ?? {}))),
    );
    const header = [
      "reference",
      "kind",
      "status",
      "first_name",
      "full_name",
      "email",
      "phone",
      "whatsapp",
      "appointment_date",
      "appointment_time",
      ...detailKeys,
      "created_at",
    ];
    const escape = (v: unknown) => {
      const s = v == null ? "" : String(v);
      const safe = /^[=+\-@]/.test(s) ? `'${s}` : s; // spreadsheet formula injection
      return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
    };
    const lines = [
      header.join(","),
      ...list.map((r) =>
        [
          r.reference,
          r.kind,
          r.status,
          r.first_name,
          r.full_name,
          r.email,
          r.phone,
          r.whatsapp ? "yes" : "no",
          r.appointment_date,
          r.appointment_time,
          ...detailKeys.map((k) => r.details?.[k]),
          r.created_at,
        ]
          .map(escape)
          .join(","),
      ),
    ];
    const url = URL.createObjectURL(
      new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `nin-support-submissions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <section className="paper-panel flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              ["all", "All"],
              ["pre_enrollment", "Pre-enrolments"],
              ["appointment", "Appointments"],
            ] as [KindFilter, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setKind(value)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                kind === value
                  ? "bg-stone-950 text-white"
                  : "text-stone-600 hover:bg-[#f5f5f7]"
              }`}
            >
              {label}
            </button>
          ))}
          <span className="mx-1 hidden h-5 w-px bg-[#e5e5ea] sm:block" />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
            className="field-control w-auto px-3 py-1.5 text-xs"
            aria-label="Filter by status"
          >
            <option value="open">Open (not finished)</option>
            <option value="today">Visiting today</option>
            <option value="all">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="relative flex-1 lg:w-72 lg:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Name, email, phone or reference"
              className="field-control py-2 pl-9 pr-3 text-xs"
              aria-label="Search submissions"
            />
          </label>
          <button
            onClick={load}
            className="rounded-full p-2 text-stone-600 hover:bg-[#f5f5f7]"
            aria-label="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={exportCsv}
            disabled={exporting}
            className="btn-secondary px-3 py-2 text-xs"
            title="Export the current filter as CSV"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">
              {exporting ? "Exporting…" : "Export"}
            </span>
          </button>
        </div>
      </section>

      <section className="paper-panel overflow-hidden">
        {error ? (
          <div className="p-6 text-sm text-[#b4232a]">
            Couldn't load submissions: {error}
          </div>
        ) : rows.length === 0 && !loading ? (
          <EmptyState
            title="Nothing here"
            body={
              search || status !== "all" || kind !== "all"
                ? "No submissions match these filters."
                : "Completed forms from the website will appear here."
            }
          />
        ) : (
          <>
            <table className="hidden w-full text-left text-sm md:table">
              <thead className="border-b border-[#eeeeef] bg-[#fbfbfd] text-[11px] uppercase tracking-[0.06em] text-stone-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Applicant</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Contact</th>
                  <th className="px-4 py-3 font-semibold">Visit / received</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className={loading ? "opacity-60" : ""}>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => onOpen(row.id)}
                    className={`cursor-pointer border-b border-[#f2f2f4] last:border-0 hover:bg-[#fafafa] ${
                      selectedId === row.id ? "bg-emerald-50/50" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-semibold">{row.full_name}</div>
                      <div className="font-mono text-[11px] text-stone-500">
                        {row.reference}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <KindBadge kind={row.kind} />
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="text-stone-800">{row.email}</div>
                      <div className="text-stone-500">
                        {row.phone}
                        {row.whatsapp && (
                          <span className="ml-1 font-semibold text-emerald-700">
                            · WhatsApp
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {row.appointment_date && (
                        <div className="font-semibold text-stone-800">
                          {formatDate(row.appointment_date)} ·{" "}
                          {row.appointment_time}
                        </div>
                      )}
                      <div className="text-stone-500">
                        {timeAgo(row.created_at)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={row.status} />
                      {row.assigned_to && (
                        <div className="mt-1 text-[11px] text-stone-500">
                          {adminName(row.assigned_to)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ChevronRight className="inline h-4 w-4 text-stone-400" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <ul
              className={`divide-y divide-[#f2f2f4] md:hidden ${loading ? "opacity-60" : ""}`}
            >
              {rows.map((row) => (
                <li key={row.id}>
                  <button
                    onClick={() => onOpen(row.id)}
                    className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">
                        {row.full_name}
                      </div>
                      <div className="mt-0.5 text-[11px] text-stone-500">
                        <span className="font-mono">{row.reference}</span>
                      </div>
                      <div className="mt-0.5 text-[11px] text-stone-500">
                        {row.appointment_date
                          ? `${formatDate(row.appointment_date)} · ${row.appointment_time}`
                          : timeAgo(row.created_at)}
                      </div>
                    </div>
                    <StatusPill status={row.status} />
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
