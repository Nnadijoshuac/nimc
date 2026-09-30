/**
 * First-party visitor analytics. No cookies, no third parties: a random
 * visitor id in localStorage, a session id in sessionStorage (30 min idle
 * timeout), and events batched to the `track` edge function.
 *
 * Every storage access is guarded; if storage is blocked the ids live in
 * memory for the page's lifetime and tracking degrades gracefully.
 */

import type { FormKind } from "./forms";

const ENDPOINT = import.meta.env.VITE_SUPABASE_URL
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track`
  : null;

const VISITOR_KEY = "nsa_vid";
const SESSION_KEY = "nsa_sid";
const SESSION_SEEN_KEY = "nsa_sseen";
const SESSION_CTX_KEY = "nsa_sctx";
const SESSION_IDLE_MS = 30 * 60 * 1000;

type EventName =
  | "page_view"
  | "cta_click"
  | "form_open"
  | "form_start"
  | "form_step"
  | "form_error"
  | "form_close"
  | "form_resume";

interface QueuedEvent {
  name: EventName;
  path: string;
  formKind?: FormKind;
  props?: Record<string, unknown>;
}

const memory = new Map<string, string>();
const read = (store: "local" | "session", key: string) => {
  try {
    return (store === "local" ? localStorage : sessionStorage).getItem(key);
  } catch {
    return memory.get(`${store}:${key}`) ?? null;
  }
};
const write = (store: "local" | "session", key: string, value: string) => {
  try {
    (store === "local" ? localStorage : sessionStorage).setItem(key, value);
  } catch {
    memory.set(`${store}:${key}`, value);
  }
};

const uuid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
        (
          +c ^
          (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))
        ).toString(16),
      );

export { uuid };

// Honour Global Privacy Control for analytics. Forms still work normally.
const optedOut =
  typeof navigator !== "undefined" &&
  (navigator as Navigator & { globalPrivacyControl?: boolean })
    .globalPrivacyControl === true;

export function getVisitorId(): string {
  let id = read("local", VISITOR_KEY);
  if (!id) {
    id = uuid();
    write("local", VISITOR_KEY, id);
  }
  return id;
}

/** Current session id, rotating after 30 minutes of inactivity. */
export function getSessionId(): string {
  const now = Date.now();
  const lastSeen = Number(read("session", SESSION_SEEN_KEY) ?? 0);
  let id = read("session", SESSION_KEY);
  if (!id || now - lastSeen > SESSION_IDLE_MS) {
    id = uuid();
    write("session", SESSION_KEY, id);
    write("session", SESSION_CTX_KEY, JSON.stringify(captureContext()));
  }
  write("session", SESSION_SEEN_KEY, String(now));
  return id;
}

function captureContext() {
  const params = new URLSearchParams(window.location.search);
  return {
    referrer: document.referrer || null,
    landingPath: window.location.pathname + window.location.search,
    utm: {
      source: params.get("utm_source"),
      medium: params.get("utm_medium"),
      campaign: params.get("utm_campaign"),
    },
  };
}

function sessionContext() {
  try {
    return (
      JSON.parse(read("session", SESSION_CTX_KEY) ?? "null") ?? captureContext()
    );
  } catch {
    return captureContext();
  }
}

// ---------------------------------------------------------------------------
// Queue & flush
// ---------------------------------------------------------------------------

let queue: QueuedEvent[] = [];
let timer: ReturnType<typeof setTimeout> | undefined;
let inFlight: Promise<void> = Promise.resolve();
let currentPath = "/";

function flush() {
  clearTimeout(timer);
  timer = undefined;
  if (!ENDPOINT || queue.length === 0) return inFlight;

  const events = queue;
  queue = [];
  const payload = JSON.stringify({
    visitorId: getVisitorId(),
    sessionId: getSessionId(),
    context: sessionContext(),
    events,
  });

  // Serialise requests so the server always sees a session's first batch first.
  inFlight = inFlight.then(() =>
    fetch(ENDPOINT, {
      method: "POST",
      // text/plain keeps this a "simple" request: no CORS preflight, and
      // keepalive lets it finish while the page unloads.
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: payload,
      keepalive: payload.length < 60_000,
    })
      .then(() => undefined)
      .catch(() => undefined),
  );
  return inFlight;
}

export function track(
  name: EventName,
  props?: Record<string, unknown>,
  formKind?: FormKind,
) {
  if (optedOut || !ENDPOINT) return;
  queue.push({ name, path: currentPath, formKind, props });
  // Page views and form milestones go out quickly; everything else batches.
  const urgent = name !== "cta_click";
  clearTimeout(timer);
  timer = setTimeout(flush, urgent ? 300 : 2000);
}

/** Resolves once everything queued so far has been delivered (or failed). */
export const flushNow = () => flush();

let lastPageView = { path: "", at: 0 };

export function trackPageView(path: string) {
  currentPath = path;
  // Guard against double-firing effects (React StrictMode, fast re-renders).
  const now = Date.now();
  if (lastPageView.path === path && now - lastPageView.at < 1000) return;
  lastPageView = { path, at: now };
  track("page_view");
}

let installed = false;

/** Global listeners: flush on hide, record clicks on calls to action. */
export function installAnalytics() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
  window.addEventListener("pagehide", () => flush());

  // Calls to action: primary buttons, phone, email and map links.
  document.addEventListener(
    "click",
    (event) => {
      const el = (event.target as HTMLElement | null)?.closest<HTMLElement>(
        '.btn-primary, .btn-secondary, a[href^="tel:"], a[href^="mailto:"], a[href*="maps"], [data-track]',
      );
      if (!el || el.closest("[data-no-track]")) return;
      const href = el.getAttribute("href") ?? "";
      const label =
        el.dataset.track ??
        (href.startsWith("tel:")
          ? "Phone call"
          : href.startsWith("mailto:")
            ? "Email link"
            : href.includes("maps")
              ? "Directions"
              : (el.textContent ?? "")
                  .replace(/\s+/g, " ")
                  .trim()
                  .slice(0, 60));
      if (label) track("cta_click", { label });
    },
    { capture: true },
  );
}
