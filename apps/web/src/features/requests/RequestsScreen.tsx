import { PATIENT_REQUEST_TYPE_LABEL, formatDisplayDate } from "@clinic/shared";
import { useCallback, useEffect, useState } from "react";
import { problemText } from "../../api/problem-text";
import { useMe } from "../auth";
import { StatusBadge } from "../../ui/StatusBadge";
import { listRequests, type RequestRow, type RequestStatus } from "./api";
import { RequestDetailPanel } from "./RequestDetailPanel";
import "./requests.css";

const FILTERS: Array<{ value: RequestStatus | "all"; label: string }> = [
  { value: "open", label: "Open" },
  { value: "done", label: "Done" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

// 8.2.11 staff list. DRAFT: the 30 day due date and wording are to be confirmed (DECISIONS.md).
// The receptionist sees who asked and when; only the doctor opens the note or closes a request.
export function RequestsScreen() {
  const canManage = useMe().permissions.includes("requests.manage");
  const [filter, setFilter] = useState<RequestStatus | "all">("open");
  const [rows, setRows] = useState<RequestRow[] | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(() => {
    setRows(null);
    listRequests(filter)
      .then(setRows)
      .catch((err: unknown) => setProblem(problemText(err)));
  }, [filter]);
  useEffect(load, [load]);

  return (
    <div className="req">
      <h1>Patient requests</h1>
      <p className="muted">
        DRAFT: due date is 30 days from the request. The doctor confirms the final rule.
      </p>
      <div className="req-filters" role="group" aria-label="Show">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            className={`btn${filter === f.value ? " btn-primary" : ""}`}
            aria-pressed={filter === f.value}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>
      {problem && <p className="notice error">{problem}</p>}
      {!rows && !problem && <p className="muted">Loading...</p>}
      {rows?.length === 0 && <p>No requests here.</p>}
      <ul className="req-list">
        {rows?.map((r) => (
          <li key={r.id} className="card req-item">
            <div className="req-head">
              <strong>
                {r.patientName} <span className="muted">{r.patientCode}</span>
              </strong>
              <StatusBadge
                tone={r.overdue ? "emergency" : r.status === "open" ? "waiting" : "done"}
                label={r.overdue ? "Overdue" : r.status}
              />
            </div>
            <p>
              {PATIENT_REQUEST_TYPE_LABEL[r.type as keyof typeof PATIENT_REQUEST_TYPE_LABEL] ??
                r.type}{" "}
              · due {formatDisplayDate(r.dueOn)}
            </p>
            {canManage && openId !== r.id && (
              <button type="button" className="btn" onClick={() => setOpenId(r.id)}>
                Open
              </button>
            )}
            {canManage && openId === r.id && (
              <RequestDetailPanel
                id={r.id}
                onCancel={() => setOpenId(null)}
                onClosed={() => {
                  setOpenId(null);
                  load();
                }}
              />
            )}
          </li>
        ))}
      </ul>
      {!canManage && <p className="muted">Only the doctor can open and close requests.</p>}
    </div>
  );
}
