import { useCallback, useEffect, useRef, useState } from "react";
import {
  flushNow,
  getSessionId,
  getVisitorId,
  track,
  uuid,
} from "../../lib/analytics";
import {
  FormKind,
  isValidEmail,
  isValidPhone,
  saveDraft,
  submitForm,
} from "../../lib/forms";

export type FormValues = Record<string, string>;

export interface ResumeData {
  draftId: string;
  data: FormValues;
}

const SAVE_DEBOUNCE_MS = 1200;

/**
 * Everything that happens between opening a form and submitting it:
 * funnel events, the draft id, and piece-by-piece saving from the moment the
 * form holds a usable email or phone number.
 */
export function useFormJourney(
  kind: FormKind,
  isOpen: boolean,
  initialValues: FormValues,
  resume?: ResumeData | null,
) {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [step, setStep] = useState(1);
  const [draftSaved, setDraftSaved] = useState(false);

  const draftId = useRef<string>(uuid());
  const started = useRef(false);
  const submitted = useRef(false);
  const lastField = useRef<string | undefined>(undefined);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const latest = useRef({ values, step });
  latest.current = { values, step };

  // Open / resume / close.
  const wasOpen = useRef(false);
  useEffect(() => {
    if (isOpen && !wasOpen.current) {
      submitted.current = false;
      started.current = false;
      if (resume) {
        draftId.current = resume.draftId;
        const merged = { ...initialValues, ...resume.data };
        setValues(merged);
        const contactDone =
          merged.firstName &&
          merged.surname &&
          isValidEmail(merged.email ?? "") &&
          isValidPhone(merged.phone ?? "");
        setStep(contactDone ? 2 : 1);
        setDraftSaved(true);
        started.current = true;
        track("form_resume", {}, kind);
      } else {
        track("form_open", {}, kind);
      }
    }
    if (!isOpen && wasOpen.current && !submitted.current) {
      clearTimeout(saveTimer.current);
      persist(); // don't lose the last keystrokes
      track(
        "form_close",
        { step: latest.current.step, last_field: lastField.current ?? null },
        kind,
      );
      flushNow();
    }
    wasOpen.current = isOpen;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, resume?.draftId]);

  const persist = useCallback(async () => {
    const { values: v, step: s } = latest.current;
    if (!isValidEmail(v.email ?? "") && !isValidPhone(v.phone ?? "")) return;
    // Make sure the visitor/session exist server-side so the draft links to them.
    await flushNow();
    const ok = await saveDraft({
      draftId: draftId.current,
      visitorId: getVisitorId(),
      sessionId: getSessionId(),
      kind,
      data: v,
      step: s,
      lastField: lastField.current,
    });
    if (ok) setDraftSaved(true);
  }, [kind]);

  const scheduleSave = useCallback(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(persist, SAVE_DEBOUNCE_MS);
  }, [persist]);

  useEffect(() => () => clearTimeout(saveTimer.current), []);

  const setField = useCallback(
    (name: string, value: string) => {
      if (!started.current) {
        started.current = true;
        track("form_start", { field: name }, kind);
      }
      lastField.current = name;
      setValues((prev) => ({ ...prev, [name]: value }));
      scheduleSave();
    },
    [kind, scheduleSave],
  );

  /** Save straight away (on blur of a contact field, or moving between steps). */
  const saveNow = useCallback(() => {
    clearTimeout(saveTimer.current);
    return persist();
  }, [persist]);

  const goToStep = useCallback(
    (next: number) => {
      setStep(next);
      latest.current.step = next;
      track("form_step", { step: next }, kind);
      saveNow();
    },
    [kind, saveNow],
  );

  const reportError = useCallback(
    (field: string, message: string) => {
      track("form_error", { field, message: message.slice(0, 120) }, kind);
    },
    [kind],
  );

  const submit = useCallback(
    async (honeypot: string) => {
      clearTimeout(saveTimer.current);
      await flushNow();
      const result = await submitForm(
        kind,
        latest.current.values,
        {
          draftId: draftId.current,
          visitorId: getVisitorId(),
          sessionId: getSessionId(),
        },
        honeypot,
      );
      submitted.current = true;
      return result;
    },
    [kind],
  );

  /** Start a fresh form (new draft id) after a successful submission. */
  const reset = useCallback(() => {
    draftId.current = uuid();
    started.current = false;
    submitted.current = false;
    lastField.current = undefined;
    setValues(initialValues);
    setStep(1);
    setDraftSaved(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    values,
    setField,
    step,
    goToStep,
    saveNow,
    submit,
    reportError,
    reset,
    draftSaved,
  };
}
