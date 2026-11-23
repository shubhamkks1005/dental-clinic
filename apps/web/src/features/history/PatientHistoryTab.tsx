import type { HistoryFilterChip } from "@clinic/shared";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ApiError } from "../../api/client";
import { useMe } from "../auth";
import {
  getHistorySummary,
  listHistoryFeed,
  type HistoryFeedEntry,
  type HistoryFeedQuery,
  type HistorySummary,
} from "./api";
import { AddPastRecordForm } from "./AddPastRecordForm";
import { HistoryFeedList } from "./HistoryFeedList";
import { HistoryFilterChips } from "./HistoryFilterChips";
import { HistoryFilterExtras } from "./HistoryFilterExtras";
import { HistorySummaryStrip } from "./HistorySummaryStrip";
import "./history.css";

type Props = { patientId: string };

function parseTooth(raw: string): number | undefined {
  const n = Number(raw.trim());
  if (!Number.isInteger(n)) return undefined;
  if ((n >= 11 && n <= 48) || (n >= 51 && n <= 85)) return n;
  return undefined;
}

/** 3.5.11–3.5.12 / 6.7.1: History tab with summary + filtered feed (S04/S17). */
export function PatientHistoryTab({ patientId }: Props) {
  const { permissions } = useMe();
  const canPrintSummary = permissions.includes("clinical.view");
  const canAddPast = permissions.includes("clinical.edit");
  const [summary, setSummary] = useState<HistorySummary | null>(null);
  const [feedTick, setFeedTick] = useState(0);
  const [entries, setEntries] = useState<HistoryFeedEntry[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [feedReady, setFeedReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [chip, setChip] = useState<HistoryFilterChip>("all");
  const [fromDraft, setFromDraft] = useState("");
  const [toDraft, setToDraft] = useState("");
  const [toothDraft, setToothDraft] = useState("");
  const [qDraft, setQDraft] = useState("");
  const [applied, setApplied] = useState<{
    from?: string;
    to?: string;
    tooth?: number;
    q?: string;
  }>({});

  function currentQuery(): HistoryFeedQuery {
    return {
      chip,
      from: applied.from,
      to: applied.to,
      tooth: applied.tooth,
      q: applied.q,
    };
  }

  useEffect(() => {
    let cancelled = false;
    setError(null);
    getHistorySummary(patientId)
      .then((s) => {
        if (!cancelled) setSummary(s);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setSummary(null);
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

  useEffect(() => {
    let cancelled = false;
    setFeedReady(false);
    setError(null);
    listHistoryFeed(patientId, {
      chip,
      from: applied.from,
      to: applied.to,
      tooth: applied.tooth,
      q: applied.q,
    })
      .then((page) => {
        if (cancelled) return;
        setEntries(page.entries);
        setNextCursor(page.nextCursor);
        setFeedReady(true);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setEntries([]);
          setFeedReady(true);
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
  }, [patientId, chip, applied.from, applied.to, applied.tooth, applied.q, feedTick]);

  async function onLoadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await listHistoryFeed(patientId, { ...currentQuery(), cursor: nextCursor });
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

  function onApplyExtras() {
    setApplied({
      from: fromDraft || undefined,
      to: toDraft || undefined,
      tooth: parseTooth(toothDraft),
      q: qDraft.trim() || undefined,
    });
  }

  if (error && !summary) {
    return (
      <p className="notice notice-error" role="alert">
        {error}
      </p>
    );
  }
  if (!summary) return <p className="muted">Loading…</p>;

  const empty = feedReady && entries.length === 0;

  return (
    <div className="patient-history">
      <HistorySummaryStrip summary={summary} patientId={patientId} />
      {(canPrintSummary || canAddPast) && (
        <div className="history-doctor-actions">
          {canPrintSummary ? (
            <Link
              className="btn btn-compact"
              to={`/app/print/history-summary/${encodeURIComponent(patientId)}`}
            >
              Print history summary
            </Link>
          ) : null}
          {canAddPast ? (
            <AddPastRecordForm patientId={patientId} onCreated={() => setFeedTick((n) => n + 1)} />
          ) : null}
        </div>
      )}
      <HistoryFilterChips chip={chip} onChip={setChip} />
      <HistoryFilterExtras
        from={fromDraft}
        to={toDraft}
        tooth={toothDraft}
        q={qDraft}
        onFrom={setFromDraft}
        onTo={setToDraft}
        onTooth={setToothDraft}
        onQ={setQDraft}
        onApply={onApplyExtras}
      />
      {error ? (
        <p className="notice notice-error" role="alert">
          {error}
        </p>
      ) : null}
      {!feedReady ? (
        <p className="muted">Loading…</p>
      ) : empty ? (
        <div className="history-empty" role="status">
          <p>No history matches these filters.</p>
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
