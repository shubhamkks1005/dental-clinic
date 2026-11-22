import {
  addIstDays,
  displayMobile,
  formatDisplayDate,
  istDate,
  istLocalToUtc,
  istLongDate,
  toHhmm,
} from "@clinic/shared";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { ApiError } from "../../api/client";
import { PrintLayout, printTitle } from "../../ui/print";
import { listDayAppointments, type DayAppointment } from "../appointments";
import { SAMPLE_CLINIC } from "./sample-print-data";
import "./print-screen.css";
import "./day-list-print.css";

function validDate(raw: string | null): string | null {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  return raw;
}

/** A4 day list for downtime (2.4.4). Print in the evening for tomorrow while online. */
export function PrintDayListScreen() {
  const [params] = useSearchParams();
  const today = istDate(new Date());
  const dateLocal = validDate(params.get("date")) ?? addIstDays(today, 1);
  const [rows, setRows] = useState<DayAppointment[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const before = document.title;
    document.title = printTitle("Day list", dateLocal, formatDisplayDate(dateLocal));
    return () => {
      document.title = before;
    };
  }, [dateLocal]);

  useEffect(() => {
    listDayAppointments(dateLocal)
      .then((data) => {
        setRows(
          data.appointments
            .filter((a) => a.status !== "cancelled" && a.status !== "rescheduled")
            .sort((a, b) => a.startMin - b.startMin),
        );
        setError(null);
      })
      .catch((e) => {
        setRows(null);
        setError(
          e instanceof ApiError
            ? e.message
            : "Could not load the list. Check the connection, then try again.",
        );
      });
  }, [dateLocal]);

  return (
    <main className="print-screen">
      <div className="card print-toolbar">
        <div>
          <h1>Day list</h1>
          <p className="muted">
            A4 list for {formatDisplayDate(dateLocal)}. Print while online; keep the paper for
            downtime.
          </p>
        </div>
        <div className="print-actions">
          <button
            type="button"
            className="btn btn-primary"
            disabled={!rows}
            onClick={() => window.print()}
          >
            Print
          </button>
          <Link to="/app" className="btn">
            Back to Today
          </Link>
          <Link to={`/app/print/day?date=${encodeURIComponent(today)}`} className="btn">
            Today
          </Link>
          <Link
            to={`/app/print/day?date=${encodeURIComponent(addIstDays(today, 1))}`}
            className="btn"
          >
            Tomorrow
          </Link>
        </div>
      </div>

      {error ? <p className="field-error">{error}</p> : null}
      {!rows && !error ? <p className="muted">Loading…</p> : null}

      {rows ? (
        <PrintLayout size="A4" header="print" clinic={SAMPLE_CLINIC}>
          <div className="day-list-print">
            <h2 className="day-list-print-title">
              Appointments · {istLongDate(istLocalToUtc(dateLocal, 12 * 60))}
            </h2>
            <p className="day-list-print-sub muted">
              {formatDisplayDate(dateLocal)} · {rows.length} on the list
            </p>
            {rows.length === 0 ? (
              <p>No appointments on this day.</p>
            ) : (
              <table className="day-list-print-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Name</th>
                    <th>Visit</th>
                    <th>Mobile</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td>{toHhmm(r.startMin)}</td>
                      <td>
                        {r.patientName}
                        <span className="day-list-print-code"> {r.patientCode}</span>
                      </td>
                      <td>{r.visitTypeLabel}</td>
                      <td>{r.patientMobile ? displayMobile(r.patientMobile) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </PrintLayout>
      ) : null}
    </main>
  );
}
