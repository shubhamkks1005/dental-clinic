import { plural } from "../../ui/format";
import { istDateTime } from "@clinic/shared";
import { useEffect, useState } from "react";
import { problemText } from "../../api/problem-text";
import { useMe } from "../auth";
import { getList } from "../lists";
import { getSetting, putSetting } from "./api";

type Review = {
  at: string;
  byUserId: string;
  byName: string;
  itemCount: number;
  note: string;
} | null;

/** 4.5.4: "I reviewed this list" record in Settings → Medicines. */
export function MedicinesListReview() {
  const me = useMe();
  const canWrite = me.permissions.includes("settings.write");
  const [review, setReview] = useState<Review>(null);
  const [version, setVersion] = useState(1);
  const [itemCount, setItemCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [setting, list] = await Promise.all([
          getSetting<Review>("medicines.list_reviewed"),
          getList("medicines"),
        ]);
        if (cancelled) return;
        setReview(setting.value);
        setVersion(setting.version);
        setItemCount(list.filter((i) => i.active).length);
      } catch (err) {
        if (!cancelled) setProblem(problemText(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const stale = review != null && review.itemCount !== itemCount;

  async function onRecord() {
    if (!canWrite || busy) return;
    setBusy(true);
    setProblem(null);
    setSaved(null);
    try {
      const next: NonNullable<Review> = {
        at: new Date().toISOString(),
        byUserId: me.id,
        byName: me.name,
        itemCount,
        note: "",
      };
      const row = await putSetting("medicines.list_reviewed", next, version);
      setReview(row.value as Review);
      setVersion(row.version);
      setSaved("Review recorded.");
    } catch (err) {
      setProblem(problemText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card settings-panel" aria-labelledby="meds-review-title">
      <h2 id="meds-review-title">Medicines list review</h2>
      <p className="muted">
        Record that you checked this list. After a big change (item count changes), review again.
      </p>
      {problem ? (
        <p className="notice notice-error" role="alert">
          {problem}
        </p>
      ) : null}
      {saved ? <p className="notice">{saved}</p> : null}
      {review ? (
        <p>
          Last review: <strong>{review.byName}</strong> on {istDateTime(new Date(review.at))} · list
          had {plural(review.itemCount, "active medicine")}.
        </p>
      ) : (
        <p className="muted">No review recorded yet.</p>
      )}
      <p className="muted">Current active medicines: {itemCount}.</p>
      {stale ? (
        <p className="notice" role="status">
          The list has changed since the last review. Please review again.
        </p>
      ) : null}
      {canWrite ? (
        <button
          type="button"
          className="btn btn-primary"
          disabled={busy}
          onClick={() => void onRecord()}
        >
          {busy ? "Saving…" : "I reviewed this list"}
        </button>
      ) : null}
    </section>
  );
}
