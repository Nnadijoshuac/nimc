import React, { useState } from "react";
import { Check, Copy, Trash } from "../components/icons";
import { useAdmin } from "./context";
import { Journey } from "./Journey";
import { draftChatMessage, draftEmailTemplates, resumeLink } from "./outreach";
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
  const { myName } = useAdmin();
  const mobile = useIsMobile();
  const logOutreach = useLogOutreach();
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
  const [linkCopied, setLinkCopied] = useState(false);

  const reach = async (channel: string) => {
    if (!d) return;
    await logOutreach({ draftId: d.id, status: d.status }, channel);
    onChanged();
    load();
  };

  const name = d
    ? titleCase(
        d.full_name || [d.first_name, d.data.surname].filter(Boolean).join(" "),
      )
    : "";
  const activeNow =
    d && Date.now() - new Date(d.updated_at).getTime() < 5 * 60 * 1000;

  const header = d ? (
    <>
      <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-stone-500">
        Unfinished {KIND_LABEL[d.kind].toLowerCase()}
        {activeNow && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 normal-case tracking-normal text-emerald-900">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600" />
            Filling it in right now
          </span>
        )}
      </div>
      <h2 className="mt-0.5 truncate text-xl font-bold md:text-lg">
        {name || d.email || d.phone}
      </h2>
      <div className="mt-1 text-xs text-stone-500">
        Started {mobile ? timeAgo(d.created_at) : formatDateTime(d.created_at)}{" "}
        · last activity {timeAgo(d.updated_at)}
      </div>
    </>
  ) : (
    <div className="text-sm text-stone-500">{error ?? "Loading…"}</div>
  );

  if (!d) {
    return (
      <Drawer label="Unfinished form" onClose={onClose} header={header}>
        {null}
      </Drawer>
    );
  }

  const fields = FORM_FIELDS[d.kind];
  const pct = Math.round(
    (d.fields_completed / Math.max(1, d.fields_total)) * 100,
  );

  const converted = d.status === "converted" && d.submission_id && (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-emerald-100 p-3 text-sm text-emerald-950">
      <span>
        They finished and submitted
        {d.converted_at ? ` ${timeAgo(d.converted_at)}` : ""}
        {d.last_contacted_at ? ", after your follow-up" : ""}.
      </span>
      <button
        onClick={() => onOpenSubmission(d.submission_id!)}
        className="shrink-0 font-bold underline"
      >
        Open
      </button>
    </div>
  );

  const contact = (
    <ContactActions
      phone={d.phone}
      email={d.email}
      whatsapp={d.whatsapp}
      chatMessage={draftChatMessage(d, myName)}
      onEmail={() => setTab("email")}
      onContacted={reach}
    />
  );

  const workflow = (
    <Workflow<DraftStatus>
      statuses={DRAFT_STATUSES}
      status={d.status}
      assignedTo={d.assigned_to}
      saving={saving}
      onChange={update}
    />
  );

  const progressBar = (
    <div
      className="h-2.5 overflow-hidden rounded-full bg-[#e2e6ec]"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={d.fields_total}
      aria-valuenow={d.fields_completed}
    >
      <div
        className="h-full rounded-full bg-[#0a7a4b]"
        style={{ width: `${pct}%` }}
      />
    </div>
  );

  const everything = (
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
                <span className="font-normal text-stone-500">
                  {OPTIONAL.has(key) ? "Skipped (optional)" : "Not filled"}
                </span>
              )
            }
          />
        );
      })}
      <Field label="On WhatsApp" value={d.whatsapp ? "Yes" : "Not stated"} />
    </FieldGrid>
  );

  const composer = (
    <Composer
      target={{ draftId: d.id }}
      email={d.email}
      greetingName={d.first_name ? titleCase(d.first_name) : null}
      templates={draftEmailTemplates(d)}
      tab={d.email ? tab : "note"}
      setTab={setTab}
      onDone={load}
    />
  );

  // ---- Phone: who, how far, reach out ---------------------------------------
  if (mobile) {
    return (
      <Drawer label="Unfinished form" onClose={onClose} header={header}>
        {converted}
        {contact}

        <section className="rounded-xl bg-[#eef0f4] p-4">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-sm font-bold text-stone-900">
              {pct}% complete
            </span>
            <span className="text-xs font-semibold text-stone-600">
              Step {d.step} of 2
            </span>
          </div>
          {progressBar}
          <p className="mt-2 text-sm text-stone-700">
            {d.last_field
              ? `Stopped at ${fieldLabel(d.last_field)}.`
              : "Left their contact details."}
          </p>
          <dl className="mt-3 space-y-1 text-sm">
            {d.phone && (
              <div className="flex justify-between gap-3">
                <dt className="text-stone-600">Phone</dt>
                <dd className="font-semibold text-stone-900">{d.phone}</dd>
              </div>
            )}
            {d.email && (
              <div className="flex justify-between gap-3">
                <dt className="text-stone-600">Email</dt>
                <dd className="truncate font-semibold text-stone-900">
                  {d.email}
                </dd>
              </div>
            )}
          </dl>
        </section>

        <button
          onClick={async () => {
            await navigator.clipboard?.writeText(resumeLink(d.id));
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-950 py-3.5 text-sm font-bold text-white"
        >
          {linkCopied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          {linkCopied ? "Resume link copied" : "Copy their resume link"}
        </button>

        {workflow}
        {composer}

        <MoreSection label="Everything they typed and activity">
          <section>
            <SectionTitle>What they filled in</SectionTitle>
            {everything}
          </section>
          <Timeline events={events} />
        </MoreSection>
      </Drawer>
    );
  }

  // ---- Desktop ----------------------------------------------------------------
  return (
    <Drawer label="Unfinished form" onClose={onClose} header={header}>
      {converted}
      {contact}
      {workflow}

      <section>
        <SectionTitle
          right={
            <span className="text-[11px] font-semibold text-stone-600">
              Step {d.step} of 2 · {d.fields_completed}/{d.fields_total} fields
            </span>
          }
        >
          How far they got
        </SectionTitle>
        <div className="mb-3">{progressBar}</div>
        {everything}
      </section>

      <section>
        <SectionTitle>Resume link</SectionTitle>
        <div className="flex items-center gap-2 rounded-lg bg-[#eef0f4] px-3 py-2 text-xs">
          <span className="min-w-0 flex-1 truncate font-mono text-stone-800">
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

      {composer}
      <Journey visitorId={d.visitor_id} convertedAt={d.created_at} />
      <Timeline events={events} />

      <section className="pt-2">
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
    </Drawer>
  );
};
