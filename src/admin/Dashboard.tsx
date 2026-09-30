import React, { useCallback, useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { NinSupportLogo } from "../components/logos/NinSupportLogo";
import { CheckCircle, FileText, LogOut, Users } from "../components/icons";
import { AdminProvider } from "./context";
import { OverviewView } from "./OverviewView";
import { LeadsView } from "./LeadsView";
import { SubmissionsView } from "./SubmissionsView";
import { VisitorPanel, VisitorsView } from "./VisitorsView";
import { SubmissionPanel } from "./SubmissionPanel";
import { DraftPanel } from "./DraftPanel";
import { TeamView } from "./TeamView";
import { MobileLeads, MobileSubmissions } from "./MobileQueue";
import { useIsMobile } from "./ui";
import { AdminUser, Draft, KIND_LABEL, Submission, titleCase } from "./types";

type Tab = "overview" | "leads" | "submissions" | "visitors" | "team";
type Panel =
  | { type: "submission"; id: string }
  | { type: "draft"; id: string }
  | { type: "visitor"; id: string }
  | null;

const TABS: [Tab, string][] = [
  ["overview", "Overview"],
  ["leads", "Unfinished forms"],
  ["submissions", "Submissions"],
  ["visitors", "Visitors"],
  ["team", "Team"],
];

const db = supabase!;

const readTab = (): Tab => {
  const t = new URLSearchParams(window.location.search).get("tab");
  return TABS.some(([v]) => v === t) ? (t as Tab) : "overview";
};

const MOBILE_TABS: Tab[] = ["submissions", "leads", "team"];

export const Dashboard: React.FC<{ session: Session }> = ({ session }) => {
  const mobile = useIsMobile();
  const [tabState, setTabState] = useState<Tab>(readTab);
  // On a phone, analytics views are hidden: the phone is for acting on people.
  const tab: Tab =
    mobile && !MOBILE_TABS.includes(tabState) ? "submissions" : tabState;
  // (Team stays reachable on phones only for owners; see the bottom bar.)
  const [panel, setPanel] = useState<Panel>(null);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [toasts, setToasts] = useState<{ id: number; text: string }[]>([]);
  const [badges, setBadges] = useState({
    followUp: 0,
    newSubs: 0,
    requests: 0,
  });
  const me = admins.find((a) => a.user_id === session.user.id);
  const isOwner = me?.role === "owner";

  const setTab = (next: Tab) => {
    setTabState(next);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", next);
    window.history.replaceState(null, "", url);
  };

  const toast = useCallback((text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  }, []);

  const loadBadges = useCallback(async () => {
    const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const [a, b, r] = await Promise.all([
      db
        .from("form_drafts")
        .select("id", { count: "exact", head: true })
        .eq("status", "open")
        .lt("updated_at", cutoff),
      db
        .from("submissions")
        .select("id", { count: "exact", head: true })
        .eq("status", "new"),
      // Only owners can read requests (RLS); for staff this is simply 0.
      db
        .from("access_requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
    ]);
    setBadges({
      followUp: a.count ?? 0,
      newSubs: b.count ?? 0,
      requests: r.count ?? 0,
    });
  }, []);

  useEffect(() => {
    db.from("admins")
      .select("user_id, email, full_name, role")
      .order("email")
      .then(({ data }) => setAdmins((data ?? []) as AdminUser[]));
    loadBadges();
    // Abandoned-after-30-min is time based, so re-check periodically.
    const t = setInterval(loadBadges, 60_000);
    return () => clearInterval(t);
  }, [loadBadges]);

  // Realtime: new leads and submissions appear everywhere without a refresh.
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  useEffect(() => {
    const bump = () => {
      clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(() => {
        setRefreshKey((k) => k + 1);
        loadBadges();
      }, 600);
    };
    const channel = db
      .channel("dashboard-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "submissions" },
        (p) => {
          const s = p.new as Submission;
          toast(
            `New ${KIND_LABEL[s.kind].toLowerCase()} from ${titleCase(s.full_name)}`,
          );
          bump();
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "form_drafts" },
        (p) => {
          const d = p.new as Draft;
          const who = titleCase(d.first_name) || d.email || d.phone;
          toast(
            `${who} just started a ${KIND_LABEL[d.kind].toLowerCase()} form`,
          );
          bump();
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "access_requests" },
        (p) => {
          const r = p.new as { full_name: string };
          toast(`${r.full_name} asked for back-office access`);
          bump();
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "submissions" },
        bump,
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "form_drafts" },
        bump,
      )
      .subscribe();
    return () => {
      clearTimeout(refreshTimer.current);
      db.removeChannel(channel);
    };
  }, [toast, loadBadges]);

  const changed = useCallback(() => {
    setRefreshKey((k) => k + 1);
    loadBadges();
  }, [loadBadges]);

  const badgeFor = (t: Tab) =>
    t === "leads"
      ? badges.followUp
      : t === "submissions"
        ? badges.newSubs
        : t === "team"
          ? badges.requests
          : 0;

  return (
    <AdminProvider session={session} admins={admins} toast={toast}>
      <div className="admin-app min-h-screen text-stone-950">
        <header className="sticky top-0 z-30 bg-white/95 shadow-[0_1px_0_rgba(16,24,40,0.06),0_6px_16px_-10px_rgba(16,24,40,0.25)] backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 md:h-auto md:pt-3">
            <div className="flex items-center gap-3">
              <NinSupportLogo variant="mark" className="h-10 w-10" />
              <div>
                <div className="text-sm font-bold">NIN Support back office</div>
                <div className="hidden text-xs text-stone-500 md:block">
                  Atlanta enrolment centre
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden text-xs text-stone-500 sm:inline">
                {session.user.email}
              </span>
              <button
                onClick={() => db.auth.signOut()}
                className="flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-stone-600 hover:bg-[#f5f5f7]"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>
          <nav
            className="admin-scroll-row mx-auto hidden max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6 md:flex"
            aria-label="Sections"
          >
            {TABS.map(([value, label]) => {
              const badge = badgeFor(value);
              return (
                <button
                  key={value}
                  onClick={() => setTab(value)}
                  aria-current={tab === value ? "page" : undefined}
                  className={`relative inline-flex shrink-0 items-center gap-1.5 px-3 py-3 text-xs font-semibold transition ${
                    tab === value
                      ? "text-stone-950"
                      : "text-stone-500 hover:text-stone-800"
                  }`}
                >
                  {label}
                  {badge > 0 && (
                    <span className="rounded-full bg-amber-100 px-1.5 text-[10px] tabular-nums text-amber-900">
                      {badge}
                    </span>
                  )}
                  {tab === value && (
                    <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[#0a7a4b]" />
                  )}
                </button>
              );
            })}
          </nav>
        </header>

        {mobile ? (
          <main className="px-4 pb-28">
            {tab === "submissions" && (
              <MobileSubmissions
                refreshKey={refreshKey}
                onOpen={(id) => setPanel({ type: "submission", id })}
              />
            )}
            {tab === "leads" && (
              <MobileLeads
                refreshKey={refreshKey}
                onOpen={(id) => setPanel({ type: "draft", id })}
              />
            )}
            {tab === "team" && (
              <TeamView refreshKey={refreshKey} onChanged={changed} />
            )}
          </main>
        ) : (
          <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
            {tab === "overview" && (
              <OverviewView refreshKey={refreshKey} onGo={setTab} />
            )}
            {tab === "leads" && (
              <LeadsView
                refreshKey={refreshKey}
                selectedId={panel?.type === "draft" ? panel.id : null}
                onOpen={(id) => setPanel({ type: "draft", id })}
              />
            )}
            {tab === "submissions" && (
              <SubmissionsView
                refreshKey={refreshKey}
                selectedId={panel?.type === "submission" ? panel.id : null}
                onOpen={(id) => setPanel({ type: "submission", id })}
              />
            )}
            {tab === "visitors" && (
              <VisitorsView
                refreshKey={refreshKey}
                onOpenVisitor={(id) => setPanel({ type: "visitor", id })}
              />
            )}
            {tab === "team" && (
              <TeamView refreshKey={refreshKey} onChanged={changed} />
            )}
          </main>
        )}

        {mobile && (
          <nav
            className={`admin-safe-bottom fixed inset-x-0 bottom-0 z-30 grid gap-1.5 bg-white px-2 pt-1.5 shadow-[0_-8px_20px_-12px_rgba(16,24,40,0.35)] ${
              isOwner ? "grid-cols-3" : "grid-cols-2"
            }`}
            aria-label="Sections"
          >
            {(
              [
                [
                  "submissions",
                  "Submitted",
                  CheckCircle,
                  badges.newSubs,
                  "new",
                ],
                ["leads", "Unfinished", FileText, badges.followUp, "to chase"],
                ...(isOwner
                  ? ([
                      ["team", "Team", Users, badges.requests, "waiting"],
                    ] as const)
                  : []),
              ] as const
            ).map(([value, label, Icon, count, hint]) => {
              const on = tab === value;
              return (
                <button
                  key={value}
                  onClick={() => setTab(value)}
                  aria-current={on ? "page" : undefined}
                  aria-label={count > 0 ? `${label}, ${count} ${hint}` : label}
                  className={`flex flex-col items-center justify-center gap-1 rounded-2xl py-2 text-xs font-bold transition ${
                    on ? "bg-[#075f3c] text-white" : "text-stone-700"
                  }`}
                >
                  <span className="relative">
                    <Icon className="h-6 w-6" />
                    {count > 0 && (
                      <span
                        className={`absolute -right-3 -top-1.5 min-w-[1.25rem] rounded-full px-1.5 text-center text-[11px] leading-5 tabular-nums ${
                          on
                            ? "bg-white text-[#075f3c]"
                            : "bg-amber-400 text-stone-950"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </span>
                  {label}
                </button>
              );
            })}
          </nav>
        )}

        {panel?.type === "submission" && (
          <SubmissionPanel
            key={panel.id}
            submissionId={panel.id}
            onClose={() => setPanel(null)}
            onChanged={changed}
            onDeleted={() => {
              setPanel(null);
              changed();
            }}
          />
        )}
        {panel?.type === "draft" && (
          <DraftPanel
            key={panel.id}
            draftId={panel.id}
            onClose={() => setPanel(null)}
            onChanged={changed}
            onDeleted={() => {
              setPanel(null);
              changed();
            }}
            onOpenSubmission={(id) => setPanel({ type: "submission", id })}
          />
        )}
        {panel?.type === "visitor" && (
          <VisitorPanel
            key={panel.id}
            visitorId={panel.id}
            onClose={() => setPanel(null)}
            onOpenDraft={(id) => setPanel({ type: "draft", id })}
            onOpenSubmission={(id) => setPanel({ type: "submission", id })}
          />
        )}

        <div
          className={`pointer-events-none fixed left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 flex-col items-center gap-2 ${
            mobile ? "bottom-24" : "bottom-4"
          }`}
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              role="status"
              className="rounded-2xl bg-stone-950 px-4 py-2.5 text-center text-xs font-semibold text-white shadow-lg"
            >
              {t.text}
            </div>
          ))}
        </div>
      </div>
    </AdminProvider>
  );
};
