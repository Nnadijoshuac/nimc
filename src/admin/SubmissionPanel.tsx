import React, { useState } from "react";
import { Trash } from "../components/icons";
import { useAdmin } from "./context";
import { Journey } from "./Journey";
import { submissionChatMessage, submissionEmailTemplates } from "./outreach";
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
  fieldLabel,
  formatDate,
  formatDateTime,
  KIND_LABEL,
  STATUSES,
  Submission,
  SubmissionStatus,
  titleCase,
} from "./types";

export const SubmissionPanel: React.FC<{
  submissionId: string;
  onClose: () => void;
  onChanged: () => void;
  onDeleted: () => void;
}> = ({ submissionId, onClose, onChanged, onDeleted }) => {
  const { db, session, myName } = useAdmin();
  const {
    record: s,
    events,
    error,
    saving,
    load,
    update,
    remove,
  } = useRecord<Submission>("submissions", submissionId, onChanged);
  const [tab, setTab] = useState<ComposerTab>("note");

  const logOutreach = async (channel: string) => {
    if (!s) return;
    await db.from("submission_events").insert({
      submission_id: s.id,
      type: "note",
      body: `Reached out by ${channel}`,
      actor_id: session.user.id,
      actor_email: session.user.email,
    });
    if (s.status === "new") await update({ status: "contacted" });
    else load();
  };

  const header = s ? (
    <>
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-stone-500">
        {KIND_LABEL[s.kind]}
        <CopyButton value={s.reference} label={s.reference} />
      </div>
      <h2 className="mt-0.5 truncate text-lg font-bold">{s.full_name}</h2>
      <div className="mt-1 text-xs text-stone-500">
        Submitted {formatDateTime(s.created_at)}
        {s.last_contacted_at &&
          ` · last emailed ${formatDateTime(s.last_contacted_at)}`}
      </div>
    </>
  ) : (
    <div className="text-sm text-stone-500">{error ?? "Loading…"}</div>
  );

  return (
    <Drawer label="Submission details" onClose={onClose} header={header}>
      {s && (
        <>
          <ContactActions
            phone={s.phone}
            email={s.email}
            whatsapp={s.whatsapp}
            chatMessage={submissionChatMessage(s, myName)}
            onEmail={() => setTab("email")}
            onContacted={logOutreach}
          />

          <Workflow<SubmissionStatus>
            statuses={STATUSES}
            status={s.status}
            assignedTo={s.assigned_to}
            saving={saving}
            onChange={update}
          />

          <section>
            <SectionTitle>Details</SectionTitle>
            <FieldGrid>
              <Field label="Email" value={s.email} wide />
              <Field
                label="Phone"
                value={
                  <>
                    {s.phone}
                    {s.whatsapp && (
                      <span className="ml-1.5 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                        WhatsApp
                      </span>
                    )}
                  </>
                }
              />
              {s.appointment_date && (
                <Field
                  label="Requested visit"
                  value={`${formatDate(s.appointment_date)} · ${s.appointment_time}`}
                />
              )}
              {Object.entries(s.details ?? {})
                .filter(([, v]) => v)
                .map(([key, value]) => (
                  <Field
                    key={key}
                    label={fieldLabel(key)}
                    value={
                      key === "date_of_birth" && value
                        ? formatDate(value)
                        : String(value)
                    }
                    wide={key === "notes" || key === "service"}
                  />
                ))}
            </FieldGrid>
          </section>

          <Composer
            target={{ submissionId: s.id }}
            email={s.email}
            greetingName={titleCase(s.first_name)}
            templates={submissionEmailTemplates(s)}
            tab={tab}
            setTab={setTab}
            onDone={load}
          />

          <Journey visitorId={s.visitor_id} convertedAt={s.created_at} />

          <Timeline events={events} />

          <section className="border-t border-[#eeeeef] pt-4">
            <button
              onClick={async () => {
                const ok = window.confirm(
                  `Permanently delete ${s.reference} (${s.full_name})? This removes all of their data and cannot be undone.`,
                );
                if (ok && (await remove())) onDeleted();
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#b4232a] hover:underline"
            >
              <Trash className="h-3.5 w-3.5" />
              Delete record (data removal request)
            </button>
          </section>
        </>
      )}
    </Drawer>
  );
};
