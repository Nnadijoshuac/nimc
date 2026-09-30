import React, { useState } from "react";
import { ArrowRight, Trash } from "../components/icons";
import { useAdmin } from "./context";
import { Journey } from "./Journey";
import { submissionChatMessage, submissionEmailTemplates } from "./outreach";
import { useLogOutreach } from "./quick";
import {
  Composer,
  ComposerTab,
  ContactActions,
  CopyButton,
  Drawer,
  Field,
  FieldGrid,
  MoreSection,
  SectionTitle,
  Timeline,
  useIsMobile,
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
  timeAgo,
  titleCase,
} from "./types";

/** The single most likely next move for each status, for one-tap progress. */
const NEXT_STEP: Partial<
  Record<SubmissionStatus, { to: SubmissionStatus; label: string }>
> = {
  new: { to: "contacted", label: "Mark as contacted" },
  contacted: { to: "in_progress", label: "Start processing" },
  in_progress: { to: "completed", label: "Mark as completed" },
};

export const SubmissionPanel: React.FC<{
  submissionId: string;
  onClose: () => void;
  onChanged: () => void;
  onDeleted: () => void;
}> = ({ submissionId, onClose, onChanged, onDeleted }) => {
  const { myName } = useAdmin();
  const mobile = useIsMobile();
  const logOutreach = useLogOutreach();
  const {
    record: s,
    events,
    error,
    saving,
    load,
    update,
    remove,
  } = useRecord<Submission>("submissions", submissionId, onChanged);
  const [tab, setTab] = useState<ComposerTab>(mobile ? "email" : "note");

  const reach = async (channel: string) => {
    if (!s) return;
    await logOutreach({ submissionId: s.id, status: s.status }, channel);
    onChanged();
    load();
  };

  const header = s ? (
    <>
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-stone-500">
        {KIND_LABEL[s.kind]}
        <CopyButton value={s.reference} label={s.reference} />
      </div>
      <h2 className="mt-0.5 truncate text-xl font-bold md:text-lg">
        {mobile ? titleCase(s.full_name) : s.full_name}
      </h2>
      <div className="mt-1 text-xs text-stone-500">
        Submitted{" "}
        {mobile ? timeAgo(s.created_at) : formatDateTime(s.created_at)}
        {s.last_contacted_at &&
          ` · last emailed ${mobile ? timeAgo(s.last_contacted_at) : formatDateTime(s.last_contacted_at)}`}
      </div>
    </>
  ) : (
    <div className="text-sm text-stone-500">{error ?? "Loading…"}</div>
  );

  if (!s) {
    return (
      <Drawer label="Submission details" onClose={onClose} header={header}>
        {null}
      </Drawer>
    );
  }

  const next = NEXT_STEP[s.status];

  const contact = (
    <ContactActions
      phone={s.phone}
      email={s.email}
      whatsapp={s.whatsapp}
      chatMessage={submissionChatMessage(s, myName)}
      onEmail={() => setTab("email")}
      onContacted={reach}
    />
  );

  const workflow = (
    <Workflow<SubmissionStatus>
      statuses={STATUSES}
      status={s.status}
      assignedTo={s.assigned_to}
      saving={saving}
      onChange={update}
    />
  );

  const allDetails = (
    <FieldGrid>
      <Field label="Email" value={s.email} wide />
      <Field
        label="Phone"
        value={
          <>
            {s.phone}
            {s.whatsapp && (
              <span className="ml-1.5 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-900">
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
  );

  const composer = (
    <Composer
      target={{ submissionId: s.id }}
      email={s.email}
      greetingName={titleCase(s.first_name)}
      templates={submissionEmailTemplates(s)}
      tab={tab}
      setTab={setTab}
      onDone={load}
    />
  );

  // ---- Phone: act first, everything else behind "More" -------------------
  if (mobile) {
    const service = s.details?.service;
    return (
      <Drawer label="Submission details" onClose={onClose} header={header}>
        {contact}

        {next && (
          <button
            disabled={saving}
            onClick={() => update({ status: next.to })}
            className="flex w-full items-center justify-between rounded-xl bg-stone-950 px-4 py-3.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {next.label}
            <ArrowRight className="h-4 w-4" />
          </button>
        )}

        {workflow}

        <section>
          <SectionTitle>Key details</SectionTitle>
          <FieldGrid>
            {s.appointment_date && (
              <Field
                label="Visit"
                value={`${formatDate(s.appointment_date)} · ${s.appointment_time}`}
                wide
              />
            )}
            {service && <Field label="Service" value={service} wide />}
            <Field label="Phone" value={s.phone} wide />
            <Field label="Email" value={s.email} wide />
          </FieldGrid>
        </section>

        {composer}

        <MoreSection label="All details and activity">
          <section>
            <SectionTitle>Everything they submitted</SectionTitle>
            {allDetails}
          </section>
          <Timeline events={events} />
        </MoreSection>
      </Drawer>
    );
  }

  // ---- Desktop: the full picture -----------------------------------------
  return (
    <Drawer label="Submission details" onClose={onClose} header={header}>
      {contact}
      {workflow}
      <section>
        <SectionTitle>Details</SectionTitle>
        {allDetails}
      </section>
      {composer}
      <Journey visitorId={s.visitor_id} convertedAt={s.created_at} />
      <Timeline events={events} />
      <section className="pt-2">
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
    </Drawer>
  );
};
