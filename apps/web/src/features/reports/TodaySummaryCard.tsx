import { useEffect, useState } from "react";
import { formatRupees } from "@clinic/shared";
import { problemText } from "../../api/problem-text";
import { fetchTodaySummary } from "./api";

/** 6.3.8: receptionist today summary (arrived / remaining / collected). */
export function TodaySummaryCard() {
  const [data, setData] = useState<{
    dateLocal: string;
    arrived: number;
    remaining: number;
    collectedPaise: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchTodaySummary()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((err) => {
        if (!cancelled) setError(problemText(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <p className="notice error">{error}</p>;
  if (!data) return <p className="muted">Loading today&apos;s summary…</p>;

  return (
    <section className="dash-today-summary card">
      <h2>Today&apos;s summary</h2>
      <p className="muted">{data.dateLocal}</p>
      <dl className="dash-today-dl">
        <div>
          <dt>Arrived</dt>
          <dd>{data.arrived}</dd>
        </div>
        <div>
          <dt>Still on list</dt>
          <dd>{data.remaining}</dd>
        </div>
        <div>
          <dt>Collected</dt>
          <dd>{formatRupees(data.collectedPaise)}</dd>
        </div>
      </dl>
    </section>
  );
}
