import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ApiError } from "../../api/client";
import {
  getHistorySummary,
  listHistoryFeed,
  type HistoryFeedEntry,
  type HistorySummary,
} from "./api";
import { HistoryFeedList } from "./HistoryFeedList";
import { HistoryFilterChips } from "./HistoryFilterChips";
import { HistorySummaryStrip } from "./HistorySummaryStrip";
import "./history.css";

type Props = { patientId: string };

/** 3.5.11–3.5.12: History tab with summary + merged feed (S04/S17). */
export function PatientHistoryTab({ patientId }: Props) {
  const [summary, setSummary] = useState<HistorySummary | null>(null);
  const [entries, setEntries] = useState<HistoryFeedEntry[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [feedReady, setFeedReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setFeedReady(false);
    Promise.all([getHistorySummary(patientId), listHistoryFeed(patientId)])
      .then(([s, page]) => {
        if (cancelled) return;
        setSummary(s);
        setEntries(page.entries);
        setNextCursor(page.nextCursor);
        setFeedReady(true);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setSummary(null);
          setEntries([]);
          setError(
            e instanceof ApiError
              ? e.message
              : "Could not load history. Check the connection, then try again.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [patientId]);

  async function onLoadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await listHistoryFeed(patientId, { cursor: nextCursor });
      setEntries((prev) => [...prev, ...page.entries]);
      setNextCursor(page.nextCursor);
    } catch (e: unknown) {
      setError(
        e instanceof ApiError
          ? e.message
          : "Could not load more history. Check the connection, then try again.",
      );
    } finally {
      setLoadingMore(false);
    }
  }

  if (error && !summary) {
    return (
      <p className="notice notice-error" role="alert">
        {error}
      </p>
    );
  }
  if (!summary || !feedReady) return <p className="muted">Loading…</p>;

  const empty = entries.length === 0;

  return (
    <div className="patient-history">
      <HistorySummaryStrip summary={summary} patientId={patientId} />
      <HistoryFilterChips />
      {error ? (
        <p className="notice notice-error" role="alert">
          {error}
        </p>
      ) : null}
      {empty ? (
        <div className="history-empty" role="status">
          <p>No history yet for this patient.</p>
          <Link
            className="btn btn-primary"
            to={`/app/appointments?patient=${encodeURIComponent(patientId)}`}
          >
            Add first appointment
          </Link>
        </div>
      ) : (
        <HistoryFeedList
          entries={entries}
          nextCursor={nextCursor}
          loadingMore={loadingMore}
          onLoadMore={() => void onLoadMore()}
        />
      )}
    </div>
  );
}
