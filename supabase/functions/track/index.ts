// First-party analytics collector.
//
// POST (text/plain JSON, so browsers skip the CORS preflight and keepalive
// requests survive page unload):
// {
//   visitorId, sessionId,
//   context: { referrer, landingPath, utm: { source, medium, campaign } },
//   events: [{ name, path?, formKind?, props?, at? }]
// }
// -> 204
//
// Upserts the visitor and session, appends the events, and bumps the
// session's furthest funnel stage.

import { corsHeaders } from "../_shared/cors.ts";
import {
  isBot,
  isUuid,
  OWN_HOSTS,
  parseUserAgent,
  serviceClient,
  trafficSource,
} from "../_shared/context.ts";

const supabase = serviceClient();

// contact_captured and form_submit are recorded server-side by save-draft and
// submit-form, where they can't be faked or lost to an unload.
const EVENT_NAMES = new Set([
  "page_view",
  "cta_click",
  "form_open",
  "form_start",
  "form_step",
  "form_error",
  "form_close",
  "form_resume",
]);
const FORM_KINDS = new Set(["pre_enrollment", "appointment"]);
const STAGE: Record<string, number> = {
  form_open: 1,
  form_resume: 1,
  form_start: 2,
  form_step: 2,
};

const str = (v: unknown, max = 300) =>
  typeof v === "string" && v ? v.slice(0, max) : null;

Deno.serve(async (req) => {
  const noContent = () =>
    new Response(null, { status: 204, headers: corsHeaders(req) });

  if (req.method === "OPTIONS") return noContent();
  if (req.method !== "POST") return noContent();

  const ua = req.headers.get("user-agent") ?? "";
  if (isBot(ua)) return noContent();

  // deno-lint-ignore no-explicit-any
  let body: any;
  try {
    body = JSON.parse(await req.text());
  } catch {
    return noContent();
  }

  const { visitorId, sessionId } = body ?? {};
  if (!isUuid(visitorId) || !isUuid(sessionId)) return noContent();

  const events = (Array.isArray(body.events) ? body.events : [])
    .slice(0, 50)
    // deno-lint-ignore no-explicit-any
    .filter((e: any) => e && EVENT_NAMES.has(e.name));
  if (events.length === 0) return noContent();

  const ctx = body.context ?? {};
  const utm = {
    source: str(ctx.utm?.source, 100) ?? undefined,
    medium: str(ctx.utm?.medium, 100) ?? undefined,
    campaign: str(ctx.utm?.campaign, 100) ?? undefined,
  };
  const { device, browser, os } = parseUserAgent(ua);
  const traffic = trafficSource(str(ctx.referrer), utm, OWN_HOSTS);
  const now = new Date().toISOString();

  // Visitor: insert on first sight, then only touch last_seen_at so the
  // first-touch attribution is preserved.
  const { data: existingVisitor } = await supabase
    .from("visitors")
    .select("id")
    .eq("id", visitorId)
    .maybeSingle();

  if (!existingVisitor) {
    await supabase.from("visitors").upsert(
      {
        id: visitorId,
        first_referrer: str(ctx.referrer),
        first_source: traffic.source,
        first_medium: traffic.medium,
        first_campaign: traffic.campaign,
        first_landing_path: str(ctx.landingPath, 200),
        device,
        browser,
        os,
      },
      { onConflict: "id", ignoreDuplicates: true },
    );
  }

  const { data: existingSession } = await supabase
    .from("sessions")
    .select("id, visitor_id, page_views, funnel_stage")
    .eq("id", sessionId)
    .maybeSingle();

  // A session id must stay with the visitor that created it.
  if (existingSession && existingSession.visitor_id !== visitorId) {
    return noContent();
  }

  const pageViews = events.filter(
    (e: { name: string }) => e.name === "page_view",
  ).length;
  const stage = Math.max(
    existingSession?.funnel_stage ?? 0,
    ...events.map((e: { name: string }) => STAGE[e.name] ?? 0),
  );

  if (!existingSession) {
    await supabase.from("sessions").insert({
      id: sessionId,
      visitor_id: visitorId,
      landing_path: str(ctx.landingPath, 200),
      referrer: str(ctx.referrer),
      source: traffic.source,
      medium: traffic.medium,
      campaign: traffic.campaign,
      device,
      browser,
      os,
      page_views: pageViews,
      funnel_stage: stage,
    });
    // session_count is a convenience counter; a lost race only undercounts.
    const { data: v } = await supabase
      .from("visitors")
      .select("session_count")
      .eq("id", visitorId)
      .single();
    await supabase
      .from("visitors")
      .update({ session_count: (v?.session_count ?? 0) + 1, last_seen_at: now })
      .eq("id", visitorId);
  } else {
    await Promise.all([
      supabase
        .from("sessions")
        .update({
          last_seen_at: now,
          page_views: existingSession.page_views + pageViews,
          funnel_stage: stage,
        })
        .eq("id", sessionId),
      supabase
        .from("visitors")
        .update({ last_seen_at: now })
        .eq("id", visitorId),
    ]);
  }

  await supabase.from("analytics_events").insert(
    // deno-lint-ignore no-explicit-any
    events.map((e: any) => ({
      visitor_id: visitorId,
      session_id: sessionId,
      name: e.name,
      path: str(e.path, 200),
      form_kind: FORM_KINDS.has(e.formKind) ? e.formKind : null,
      props:
        e.props &&
        typeof e.props === "object" &&
        !Array.isArray(e.props) &&
        JSON.stringify(e.props).length <= 2000
          ? e.props
          : {},
    })),
  );

  return noContent();
});
