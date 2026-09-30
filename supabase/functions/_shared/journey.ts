// Links form activity back to the visitor's journey: validates the tracking
// ids the browser sent, records server-side funnel events, bumps the session's
// furthest stage, and remembers the visitor's contact details.

import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { isUuid } from "./context.ts";

export interface JourneyIds {
  visitorId: string | null;
  sessionId: string | null;
}

/** Returns only ids that exist and belong together (tracking may be blocked). */
export async function resolveJourney(
  supabase: SupabaseClient,
  visitorId: unknown,
  sessionId: unknown,
): Promise<JourneyIds & { stage: number }> {
  if (!isUuid(visitorId)) return { visitorId: null, sessionId: null, stage: 0 };

  const [{ data: visitor }, { data: session }] = await Promise.all([
    supabase.from("visitors").select("id").eq("id", visitorId).maybeSingle(),
    isUuid(sessionId)
      ? supabase
          .from("sessions")
          .select("id, visitor_id, funnel_stage")
          .eq("id", sessionId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  if (!visitor) return { visitorId: null, sessionId: null, stage: 0 };
  const sessionOk = session && session.visitor_id === visitor.id;
  return {
    visitorId: visitor.id,
    sessionId: sessionOk ? session.id : null,
    stage: sessionOk ? session.funnel_stage : 0,
  };
}

export async function recordJourneyStep(
  supabase: SupabaseClient,
  ids: JourneyIds & { stage: number },
  step: {
    event: "contact_captured" | "form_submit";
    formKind: string;
    stage: 3 | 4;
    contact?: {
      email?: string | null;
      phone?: string | null;
      fullName?: string | null;
    };
    submitted?: boolean;
  },
) {
  if (!ids.visitorId) return;
  const work: PromiseLike<unknown>[] = [];

  if (ids.sessionId) {
    work.push(
      supabase.from("analytics_events").insert({
        visitor_id: ids.visitorId,
        session_id: ids.sessionId,
        name: step.event,
        form_kind: step.formKind,
      }),
    );
    if (ids.stage < step.stage) {
      work.push(
        supabase
          .from("sessions")
          .update({
            funnel_stage: step.stage,
            last_seen_at: new Date().toISOString(),
          })
          .eq("id", ids.sessionId),
      );
    }
  }

  const visitorPatch: Record<string, unknown> = {};
  if (step.contact?.email) visitorPatch.email = step.contact.email;
  if (step.contact?.phone) visitorPatch.phone = step.contact.phone;
  if (step.contact?.fullName) visitorPatch.full_name = step.contact.fullName;
  if (step.submitted) {
    const { data } = await supabase
      .from("visitors")
      .select("submission_count")
      .eq("id", ids.visitorId)
      .single();
    visitorPatch.submission_count = (data?.submission_count ?? 0) + 1;
  }
  if (Object.keys(visitorPatch).length) {
    work.push(
      supabase.from("visitors").update(visitorPatch).eq("id", ids.visitorId),
    );
  }

  await Promise.all(work);
}
