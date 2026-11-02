import React, { useCallback, useEffect, useState } from "react";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { Check, Mail, RefreshCw, Trash, Users, X } from "../components/icons";
import { Spinner } from "../components/FormBits";
import { useAdmin } from "./context";
import { EmptyState, SectionTitle } from "./ui";
import { formatDateTime, timeAgo } from "./types";

type Role = "owner" | "staff";

interface Member {
  user_id: string;
  email: string;
  full_name: string | null;
  role: Role;
  created_at: string;
  last_sign_in_at: string | null;
  pending: boolean;
}

interface AccessRequest {
  id: string;
  email: string;
  full_name: string;
  note: string | null;
  created_at: string;
}

interface AuditRow {
  id: number;
  action: string;
  actor_email: string | null;
  target_email: string;
  detail: Record<string, unknown>;
  created_at: string;
}

interface TeamData {
  me: string;
  role: Role;
  members: Member[];
  requests?: AccessRequest[];
  audit?: AuditRow[];
}

const ROLE_HINT: Record<Role, string> = {
  owner: "Can invite, approve and remove people",
  staff: "Works submissions and unfinished forms",
};

function describeAudit(a: AuditRow) {
  const who = a.actor_email ?? "Someone";
  const to = a.target_email;
  switch (a.action) {
    case "invited":
      return `${who} invited ${to} as ${a.detail.role}`;
    case "request_received":
      return `${to} requested access`;
    case "request_approved":
      return `${who} approved ${to} as ${a.detail.role}`;
    case "request_declined":
      return `${who} declined ${to}`;
    case "role_changed":
      return `${who} changed ${to} from ${a.detail.from} to ${a.detail.to}`;
    case "removed":
      return `${who} removed ${to}`;
    case "joined":
      return `${to} accepted their invite and signed in`;
    default:
      return `${a.action}: ${to}`;
  }
}

export const TeamView: React.FC<{
  refreshKey: number;
  onChanged: () => void;
}> = ({ refreshKey, onChanged }) => {
  const { db, toast } = useAdmin();
  const [data, setData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const call = useCallback(
    async (body: Record<string, unknown>) => {
      const { data, error } = await db.functions.invoke("team", { body });
      if (error) {
        let message = error.message;
        if (error instanceof FunctionsHttpError) {
          message =
            (await error.context.json().catch(() => null))?.error ?? message;
        }
        throw new Error(message);
      }
      return data;
    },
    [db],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData((await call({ action: "list" })) as TeamData);
    } catch (e) {
      toast((e as Error).message);
    }
    setLoading(false);
  }, [call, toast]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const act = async (
    key: string,
    body: Record<string, unknown>,
    success: string,
  ) => {
    setBusy(key);
    try {
      await call(body);
      toast(success);
      await load();
      onChanged();
    } catch (e) {
      toast((e as Error).message);
    }
    setBusy(null);
  };

  if (!data) {
    return (
      <p className="py-10 text-center text-sm text-stone-500">
        {loading ? "Loading team…" : "Couldn't load the team."}
      </p>
    );
  }

  const owner = data.role === "owner";
  const owners = data.members.filter((m) => m.role === "owner").length;

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-6">
      <div className="flex items-center justify-between gap-3 pt-3 md:pt-0">
        <div>
          <h1 className="text-lg font-bold text-stone-950">Team</h1>
          <p className="text-sm text-stone-600">
            {owner
              ? "Approve requests, invite people and manage access. Nobody is ever sent a password."
              : "People with access to the back office."}
          </p>
        </div>
        <button
          onClick={load}
          className="shrink-0 rounded-full bg-white p-2.5 text-stone-700 shadow-sm"
          aria-label="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Requests waiting for a decision */}
      {owner && (
        <section className="paper-panel p-4 md:p-5">
          <SectionTitle>
            Access requests
            {data.requests && data.requests.length > 0 && (
              <span className="ml-2 rounded-full bg-amber-400 px-2 py-0.5 text-[11px] text-stone-950">
                {data.requests.length}
              </span>
            )}
          </SectionTitle>
          {!data.requests?.length ? (
            <p className="text-sm text-stone-600">
              No one is waiting. New staff can tap{" "}
              <strong>Request access</strong> on the sign-in page, and you'll
              get an email.
            </p>
          ) : (
            <ul className="space-y-3">
              {data.requests.map((r) => (
                <RequestCard
                  key={r.id}
                  request={r}
                  busy={busy}
                  onApprove={(role) =>
                    act(
                      `approve-${r.id}`,
                      { action: "approve", requestId: r.id, role },
                      `${r.full_name} approved. Their invite is on its way.`,
                    )
                  }
                  onDecline={() =>
                    act(
                      `decline-${r.id}`,
                      { action: "decline", requestId: r.id },
                      `Declined ${r.full_name}.`,
                    )
                  }
                />
              ))}
            </ul>
          )}
        </section>
      )}

      {owner && (
        <section className="paper-panel p-4 md:p-5">
          <SectionTitle>Invite someone</SectionTitle>
          <p className="text-sm text-stone-600">
            Invitations are disabled in this build.
          </p>
        </section>
      )}

      {/* Members */}
      <section className="paper-panel p-4 md:p-5">
        <SectionTitle>Members · {data.members.length}</SectionTitle>
        {data.members.length === 0 ? (
          <EmptyState
            title="No members"
            body="Invite someone to get started."
          />
        ) : (
          <ul className="divide-y divide-[#f2f2f4]">
            {data.members.map((m) => {
              const isMe = m.user_id === data.me;
              const lastOwner = m.role === "owner" && owners <= 1;
              return (
                <li
                  key={m.user_id}
                  className="flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-bold text-stone-950">
                        {m.full_name || m.email}
                      </span>
                      {isMe && (
                        <span className="rounded-full bg-[#eef0f4] px-2 py-0.5 text-[11px] font-semibold text-stone-700">
                          You
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          m.role === "owner"
                            ? "bg-violet-100 text-violet-900"
                            : "bg-sky-100 text-sky-900"
                        }`}
                      >
                        {m.role === "owner" ? "Owner" : "Staff"}
                      </span>
                      {m.pending && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
                          Invite not accepted yet
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-stone-600">
                      {m.email} ·{" "}
                      {m.last_sign_in_at
                        ? `last signed in ${timeAgo(m.last_sign_in_at)}`
                        : `added ${timeAgo(m.created_at)}`}
                    </div>
                  </div>

                  {owner && !isMe && (
                    <div className="flex shrink-0 items-center gap-2">
                      <div className="rounded-full bg-[#eef0f4] px-3 py-1.5 text-[11px] font-semibold text-stone-700">
                        {m.role === "owner" ? "Owner" : "Staff"}
                      </div>
                      <button
                        disabled={busy !== null || lastOwner}
                        onClick={() => {
                          if (
                            window.confirm(
                              `Remove ${m.full_name || m.email}? They lose access immediately and their login is deleted. You can invite them again later.`,
                            )
                          ) {
                            act(
                              `remove-${m.user_id}`,
                              { action: "remove", userId: m.user_id },
                              `${m.full_name || m.email} was removed.`,
                            );
                          }
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-2 text-xs font-semibold text-[#b4232a] hover:bg-red-100 disabled:opacity-40"
                      >
                        {busy === `remove-${m.user_id}` ? (
                          <Spinner />
                        ) : (
                          <Trash className="h-3.5 w-3.5" />
                        )}
                        Remove
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-3 text-[11px] leading-5 text-stone-500">
          Owner: {ROLE_HINT.owner.toLowerCase()}. Staff:{" "}
          {ROLE_HINT.staff.toLowerCase()}. There is always at least one owner.
        </p>
      </section>

      {/* Audit log */}
      {owner && data.audit && data.audit.length > 0 && (
        <section className="paper-panel p-4 md:p-5">
          <SectionTitle>Recent team activity</SectionTitle>
          <ol className="space-y-2.5">
            {data.audit.map((a) => (
              <li key={a.id} className="text-sm">
                <div className="text-stone-800">{describeAudit(a)}</div>
                <div className="text-[11px] text-stone-500">
                  {formatDateTime(a.created_at)}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
};

const RequestCard: React.FC<{
  request: AccessRequest;
  busy: string | null;
  onApprove: (role: Role) => void;
  onDecline: () => void;
}> = ({ request: r, busy, onApprove, onDecline }) => {
  const [role, setRole] = useState<Role>("staff");
  const working = busy === `approve-${r.id}` || busy === `decline-${r.id}`;
  return (
    <li className="rounded-xl bg-[#eef0f4] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-base font-bold text-stone-950">
            {r.full_name}
          </div>
          <div className="truncate text-sm text-stone-700">{r.email}</div>
        </div>
        <span className="shrink-0 text-xs text-stone-600">
          {timeAgo(r.created_at)}
        </span>
      </div>
      {r.note && (
        <p className="mt-2 rounded-lg bg-white px-3 py-2 text-sm text-stone-800">
          “{r.note}”
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-stone-700">
          As {role}
        </div>
        <button
          disabled={busy !== null}
          onClick={() => onApprove(role)}
          className="btn-primary flex-1 px-4 py-2.5 text-sm disabled:opacity-60 md:flex-none"
        >
          {busy === `approve-${r.id}` ? (
            <Spinner />
          ) : (
            <Check className="h-4 w-4" />
          )}
          Approve
        </button>
        <button
          disabled={busy !== null}
          onClick={onDecline}
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 disabled:opacity-60"
        >
          {busy === `decline-${r.id}` ? <Spinner /> : <X className="h-4 w-4" />}
          Decline
        </button>
      </div>
      {working && <p className="mt-2 text-xs text-stone-600">Working on it…</p>}
    </li>
  );
};

const InviteForm: React.FC = () => (
  <section className="paper-panel p-4 md:p-5">
    <SectionTitle>Invite someone</SectionTitle>
    <p className="text-sm text-stone-600">Invitation fields have been removed.</p>
  </section>
);
