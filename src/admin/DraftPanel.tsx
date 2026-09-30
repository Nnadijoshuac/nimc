import React, { useState } from "react";
import { Trash } from "../components/icons";
import { useAdmin } from "./context";
import { Journey } from "./Journey";
import { draftChatMessage, draftEmailTemplates, resumeLink } from "./outreach";
import {
  Composer,
  ComposerTab,
  ContactActions,
  CopyButton,
  Drawer,
  Field,
  FieldGrid,
  SectionTitle,
  Timeline,
  Workflow,
} from "./ui";
import { useRecord } from "./useRecord";
import {
  Draft,
  DRAFT_STATUSES,
  DraftStatus,
  fieldLabel,
  formatDate,
  formatDateTime,
  KIND_LABEL,
  timeAgo,
  titleCase,
} from "./types";

// Field order as it appears in each form, for the "how far they got" view.
const FORM_FIELDS: Record<Draft["kind"], string[]> = {
  pre_enrollment: [
    "firstName",
    "surname",
    "email",
    "phone",
    "middleName",
    "dateOfBirth",
    "gender",
    "stateOfOrigin",
    "passportNumber",
  ],
  appointment: [
    "firstName",
    "surname",
    "email",
    "phone",
    "service",
    "date",
    "time",
    "notes",
  ],
};

const OPTIONAL = new Set(["middleName", "notes"]);

export const DraftPanel: React.FC<{
  draftId: string;
  onClose: () => void;
  onChanged: () => void;
  onDeleted: () => void;
  onOpenSubmission: (id: string) => void;
}> = ({ draftId, onClose, onChanged, onDeleted, onOpenSubmission }) => {
  const { db, session, myName } = useAdmin();
  const {
    record: d,
    events,
    error,
    saving,
    load,
    update,
    remove,
  } = useRecord<Draft>("form_drafts", draftId, onChanged);
  const [tab, setTab] = useState<ComposerTab>("email");

  const logOutreach = async (channel: string) => {
    if (!d) return;
    await db.from("submission_events").insert({
      draft_id: d.id,
      type: "note",
      body: `Reached out by ${channel}`,
      actor_id: session.user.id,
      actor_email: session.user.email,
    });
    if (d.status === "open") await update({ status: "contacted" });
    else load();
  };

  const name = d
    ? d.full_name || [d.first_name, d.data.surname].filter(Boolean).join(" ")
    : "";
  const activeNow =
    d && Date.now() - new Date(d.updated_at).getTime() < 5 * 60 * 1000;

  const header = d ? (
    <>
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-stone-500">
        Unfinished {KIND_LABEL[d.kind].toLowerCase()}
        {activeNow && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 normal-case tracking-normal text-emerald-800">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            Filling it in right now
          </span>
        )}
      </div>
      <h2 className="mt-0.5 truncate text-lg font-bold">
        {name || d.email || d.phone}
      </h2>
      <div className="mt-1 text-xs text-stone-500">
        Started {formatDateTime(d.created_at)} · last activity{" "}
        {timeAgo(d.updated_at)}
      </div>
    </>
  ) : (
    <div className="text-sm text-stone-500">{error ?? "Loading…"}</div>
  );

  const fields = d ? FORM_FIELDS[d.kind] : [];

  return (
    <Drawer label="Unfinished form" onClose={onClose} header={header}>
      {d && (
        <>
          {d.status === "converted" && d.submission_id && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
              <span>
                They finished and submitted
                {d.converted_at ? ` ${timeAgo(d.converted_at)}` : ""}
                {d.last_contacted_at ? ", after your follow-up" : ""}.
              </span>
              <button
                onClick={() => onOpenSubmission(d.submission_id!)}
                className="font-semibold underline"
              >
                Open submission
              </button>
            </div>
          )}

          <ContactActions
            phone={d.phone}
            email={d.email}
            whatsapp={d.whatsapp}
            chatMessage={draftChatMessage(d, myName)}
            onEmail={() => setTab("email")}
            onContacted={logOutreach}
          />

          <Workflow<DraftStatus>
            statuses={DRAFT_STATUSES}
            status={d.status}
            assignedTo={d.assigned_to}
            saving={saving}
            onChange={update}
          />

          {/* Progress */}
          <section>
            <SectionTitle
              right={
                <span className="text-[11px] font-semibold text-stone-600">
                  Step {d.step} of 2 · {d.fields_completed}/{d.fields_total}{" "}
                  fields
                </span>
              }
            >
              How far they got
            </SectionTitle>
            <div
              className="mb-3 h-2 overflow-hidden rounded-full bg-[#eeeeef]"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={d.fields_total}
              aria-valuenow={d.fields_completed}
            >
              <div
                className="h-full rounded-full bg-[#0a7a4b]"
                style={{
                  width: `${Math.round((d.fields_completed / Math.max(1, d.fields_total)) * 100)}%`,
                }}
              />
            </div>
            <FieldGrid>
              {fields.map((key) => {
                const value = d.data[key];
                const isLast = d.last_field === key;
                return (
                  <Field
                    key={key}
                    label={`${fieldLabel(key)}${isLast ? " · last touched" : ""}`}
                    wide={key === "notes" || key === "email"}
                    value={
                      value ? (
                        key === "dateOfBirth" || key === "date" ? (
                          formatDate(value)
                        ) : (
                          value
                        )
                      ) : (
                        <span className="font-normal text-stone-400">
                          {OPTIONAL.has(key)
                            ? "Skipped (optional)"
                            : "Not filled"}
                        </span>
                      )
                    }
                  />
                );
              })}
              <Field
                label="On WhatsApp"
                value={d.whatsapp ? "Yes" : "Not stated"}
              />
            </FieldGrid>
          </section>

          <section>
            <SectionTitle>Resume link</SectionTitle>
            <div className="flex items-center gap-2 rounded-lg bg-[#f5f5f7] px-3 py-2 text-xs">
              <span className="min-w-0 flex-1 truncate font-mono text-stone-700">
                {resumeLink(d.id)}
              </span>
              <CopyButton value={resumeLink(d.id)} />
            </div>
            <p className="mt-1 text-[11px] text-stone-500">
              Opens their form with everything they typed already filled in.
              Included in the email templates.
              {d.resume_count > 0 &&
                ` They have used it ${d.resume_count} time${d.resume_count === 1 ? "" : "s"}.`}
            </p>
          </section>

          <Composer
            target={{ draftId: d.id }}
            email={d.email}
            greetingName={d.first_name ? titleCase(d.first_name) : null}
            templates={draftEmailTemplates(d)}
            tab={d.email ? tab : "note"}
            setTab={setTab}
            onDone={load}
          />

          <Journey visitorId={d.visitor_id} convertedAt={d.created_at} />

          <Timeline events={events} />

          <section className="border-t border-[#eeeeef] pt-4">
            <button
              onClick={async () => {
                const ok = window.confirm(
                  `Permanently delete this unfinished form from ${name || d.email || d.phone}? This cannot be undone.`,
                );
                if (ok && (await remove())) onDeleted();
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#b4232a] hover:underline"
            >
              <Trash className="h-3.5 w-3.5" />
              Delete (data removal request)
            </button>
          </section>
        </>
      )}
    </Drawer>
  );
};
