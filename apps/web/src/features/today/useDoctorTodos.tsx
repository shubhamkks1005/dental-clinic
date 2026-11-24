import { useEffect, useState } from "react";
import { Link } from "react-router";
import { formatDate } from "../../ui/format";
import type { TodoItem } from "../../ui/page/TodoRows";
import { listRequests } from "../requests/api";
import { listDraftPrescriptions } from "../prescriptions";
import { listDraftVisits } from "../visits/api";

/** Lines for "Waiting for you" that do not come from billing: unfinished visits, patient requests. */
export function useDoctorTodos(opts: { canSeeRequests: boolean; exceptPatientId?: string }) {
  const [items, setItems] = useState<TodoItem[]>([]);
  const { canSeeRequests, exceptPatientId } = opts;

  useEffect(() => {
    let cancelled = false;
    const open = (to: string, label: string) => (
      <Link className="btn btn-compact" to={to}>
        {label}
      </Link>
    );
    Promise.all([
      listDraftVisits().catch(() => []),
      listDraftPrescriptions().catch(() => []),
      canSeeRequests ? listRequests("open").catch(() => []) : Promise.resolve([]),
    ]).then(([drafts, rxDrafts, requests]) => {
      if (cancelled) return;
      setItems([
        ...drafts
          .filter((v) => v.patientId !== exceptPatientId)
          .map((v): TodoItem => ({
            key: `v-${v.id}`,
            kind: "UNFINISHED VISIT",
            tone: "danger",
            who: `${v.patientName} · ${formatDate(v.visitDateLocal)}`,
            note: "Not finalised yet",
            action: open(`/app/visits/${v.id}`, "Open"),
          })),
        ...rxDrafts
          .filter((r) => r.visitId && r.patientId !== exceptPatientId)
          // The unfinished visit line already covers a visit that is still a draft.
          .filter((r) => !drafts.some((v) => v.id === r.visitId))
          .map((r): TodoItem => ({
            key: `rx-${r.id}`,
            kind: "PRESCRIPTION NOT ISSUED",
            tone: "warning",
            who: r.visitDateLocal
              ? `${r.patientName} · ${formatDate(r.visitDateLocal)}`
              : r.patientName,
            note: "Written, not issued",
            action: open(`/app/visits/${r.visitId}`, "Open"),
          })),
        ...requests.map((r): TodoItem => ({
          key: `r-${r.id}`,
          kind: "PATIENT REQUEST",
          tone: "info",
          who: `${r.patientName} · ${r.type.replaceAll("_", " ")}`,
          note: `Due ${formatDate(r.dueOn)}`,
          action: open("/app/requests", "View"),
        })),
      ]);
    });
    return () => {
      cancelled = true;
    };
  }, [canSeeRequests, exceptPatientId]);

  return items;
}
