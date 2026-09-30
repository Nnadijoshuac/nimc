/**
 * Shared form journey plumbing: piece-by-piece draft capture, resume links,
 * and the final submission. All of it goes to Supabase edge functions with
 * plain fetch so the public bundle never loads the Supabase SDK.
 */

import { OFFICE_INFO } from "../data/websiteContent";

export type FormKind = "pre_enrollment" | "appointment";

const BASE = import.meta.env.VITE_SUPABASE_URL
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
  : null;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isBackendConfigured = Boolean(BASE && ANON_KEY);

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const isValidEmail = (v: string) => EMAIL_PATTERN.test(v.trim());
export const isValidPhone = (v: string) => {
  const digits = v.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
};

export class SubmissionError extends Error {
  constructor(
    message: string,
    public field?: string,
  ) {
    super(message);
  }
}

const FALLBACK = `We couldn't send your form. Please try again, or call us on ${OFFICE_INFO.primaryPhone}.`;

async function post<T>(
  fn: string,
  body: unknown,
): Promise<{ ok: boolean; status: number; data: T | null }> {
  const res = await fetch(`${BASE}/${fn}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON_KEY! },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => null)) as T | null;
  return { ok: res.ok, status: res.status, data };
}

// ---------------------------------------------------------------------------
// Drafts
// ---------------------------------------------------------------------------

export interface DraftSave {
  draftId: string;
  visitorId: string;
  sessionId: string;
  kind: FormKind;
  data: Record<string, string>;
  step: number;
  lastField?: string;
}

/** Fire-and-forget: a failed draft save must never interrupt the applicant. */
export async function saveDraft(payload: DraftSave): Promise<boolean> {
  if (!isBackendConfigured) return false;
  try {
    const res = await post<{ saved?: boolean }>("save-draft", {
      action: "save",
      ...payload,
    });
    return Boolean(res.data?.saved);
  } catch {
    return false;
  }
}

export async function loadDraft(
  draftId: string,
): Promise<{ kind: FormKind; data: Record<string, string> } | null> {
  if (!isBackendConfigured) return null;
  try {
    const res = await post<{ kind: FormKind; data: Record<string, string> }>(
      "save-draft",
      { action: "load", draftId },
    );
    return res.ok ? res.data : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Submission
// ---------------------------------------------------------------------------

export async function submitForm(
  kind: FormKind,
  data: Record<string, string>,
  journey: { draftId: string; visitorId: string; sessionId: string },
  honeypot: string,
): Promise<{ reference: string }> {
  if (!isBackendConfigured) {
    throw new SubmissionError(
      `Online submissions aren't available right now. Please call us on ${OFFICE_INFO.primaryPhone}.`,
    );
  }

  let res: Awaited<
    ReturnType<
      typeof post<{ reference?: string; error?: string; field?: string }>
    >
  >;
  try {
    res = await post("submit-form", {
      type: kind,
      data,
      company: honeypot,
      ...journey,
    });
  } catch {
    throw new SubmissionError(
      `We couldn't reach our server. Check your connection and try again, or call us on ${OFFICE_INFO.primaryPhone}.`,
    );
  }

  if (!res.ok)
    throw new SubmissionError(res.data?.error ?? FALLBACK, res.data?.field);
  if (!res.data?.reference) throw new SubmissionError(FALLBACK);
  return { reference: res.data.reference };
}

/** Today's date in Atlanta, as YYYY-MM-DD, for `min` on date inputs. */
export const todayInAtlanta = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
