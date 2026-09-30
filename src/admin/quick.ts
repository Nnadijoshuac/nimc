import { useCallback } from "react";
import { useAdmin } from "./context";

/**
 * Records that a staff member reached out (call / WhatsApp / text) on the
 * record's timeline, and moves a fresh record to "contacted".
 */
export function useLogOutreach() {
  const { db, session } = useAdmin();
  return useCallback(
    async (
      target:
        | { submissionId: string; status: string }
        | { draftId: string; status: string },
      channel: string,
    ) => {
      const isSubmission = "submissionId" in target;
      const id = isSubmission ? target.submissionId : target.draftId;
      await db.from("submission_events").insert({
        ...(isSubmission ? { submission_id: id } : { draft_id: id }),
        type: "note",
        body: `Reached out by ${channel}`,
        actor_id: session.user.id,
        actor_email: session.user.email,
      });
      const fresh = target.status === (isSubmission ? "new" : "open");
      if (fresh) {
        await db
          .from(isSubmission ? "submissions" : "form_drafts")
          .update({ status: "contacted" })
          .eq("id", id);
      }
    },
    [db, session],
  );
}
