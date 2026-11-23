import { useEffect, useState } from "react";
import { Link } from "react-router";
import { formatDate } from "../../ui/format";
import type { TodoItem } from "../../ui/page/TodoRows";
import { listRequests } from "../requests/api";
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
      canSeeRequests ? listRequests("open").catch(() => []) : Promise.resolve([]),
    ]).then(([drafts, requests]) => {
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
