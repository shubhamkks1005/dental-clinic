import { useEffect, useState } from "react";
import { suggestSlots, type SuggestedSlot } from "./api";

/**
 * Free times for the book dialog: every time of the chosen day (so the desk can pick the exact
 * one the patient asked for), plus the next few free times on any day as a fallback.
 */
export function useBookSlots(open: boolean, visitTypeId: string, dateLocal: string) {
  const [daySlots, setDaySlots] = useState<SuggestedSlot[]>([]);
  const [nextSlots, setNextSlots] = useState<SuggestedSlot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !visitTypeId || !dateLocal) {
      setDaySlots([]);
      setNextSlots([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all([
      suggestSlots(visitTypeId, dateLocal, { dayOnly: true }),
      suggestSlots(visitTypeId, dateLocal),
    ])
      .then(([day, next]) => {
        if (cancelled) return;
        setDaySlots(day);
        setNextSlots(next);
      })
      .catch(() => {
        if (cancelled) return;
        setDaySlots([]);
        setNextSlots([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, visitTypeId, dateLocal]);

  return { daySlots, nextSlots, loading };
}
