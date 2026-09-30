import { useCallback, useEffect, useState } from "react";
import { useAdmin } from "./context";
import { TimelineEvent } from "./types";

/**
 * Loads a submission or draft plus its activity timeline, keeps both live via
 * realtime, and exposes a workflow update (status / assignee).
 */
export function useRecord<T extends { id: string }>(
  table: "submissions" | "form_drafts",
  id: string,
  onChanged: () => void,
) {
  const { db, toast } = useAdmin();
  const eventKey = table === "submissions" ? "submission_id" : "draft_id";
  const [record, setRecord] = useState<T | null>(null);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [rec, ev] = await Promise.all([
      db.from(table).select("*").eq("id", id).single(),
      db
        .from("submission_events")
        .select("*")
        .eq(eventKey, id)
        .order("created_at", { ascending: false }),
    ]);
    if (rec.error) {
      setError(rec.error.message);
      return;
    }
    setRecord(rec.data as T);
    setEvents((ev.data ?? []) as TimelineEvent[]);
  }, [db, table, eventKey, id]);

  useEffect(() => {
    setRecord(null);
    setError(null);
    load();
    const channel = db
      .channel(`${table}-${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "submission_events",
          filter: `${eventKey}=eq.${id}`,
        },
        () => load(),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table, filter: `id=eq.${id}` },
        () => load(),
      )
      .subscribe();
    return () => {
      db.removeChannel(channel);
    };
  }, [db, table, eventKey, id, load]);

  const update = useCallback(
    async (patch: Record<string, unknown>) => {
      setSaving(true);
      const { error } = await db.from(table).update(patch).eq("id", id);
      setSaving(false);
      if (error) {
        toast(`Couldn't save: ${error.message}`);
        return false;
      }
      setRecord((r) => (r ? { ...r, ...patch } : r));
      onChanged();
      load();
      return true;
    },
    [db, table, id, toast, onChanged, load],
  );

  const remove = useCallback(async () => {
    const { error } = await db.from(table).delete().eq("id", id);
    if (error) {
      toast(`Couldn't delete: ${error.message}`);
      return false;
    }
    return true;
  }, [db, table, id, toast]);

  return { record, events, error, saving, load, update, remove };
}
