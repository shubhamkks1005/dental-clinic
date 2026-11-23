import { formatClockTime, istDate } from "@clinic/shared";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { formatDate, formatMoney } from "../../ui/format";
import { useToast } from "../../ui/Toast";
import { QuickBookDialog } from "../appointments";
import { listDues, type DuesRow } from "../billing";
import type { TodayModel } from "./buildTodayModel";

const MAX_DUES = 3;

type Missed = TodayModel["callList"][number];

/** "To follow up" (Main.dc.html): missed patients to rebook, and the biggest dues to collect. */
export function FollowUpList({
  items,
  onChanged,
}: {
  items: TodayModel["callList"];
  onChanged: () => void;
}) {
  const toast = useToast();
  const [dues, setDues] = useState<DuesRow[]>([]);
  const [rebook, setRebook] = useState<Missed | null>(null);

  useEffect(() => {
    listDues()
      .then((r) => setDues([...r.rows].sort((a, b) => b.duePaise - a.duePaise).slice(0, MAX_DUES)))
      .catch(() => setDues([]));
  }, []);

  const count = items.length + dues.length;
  return (
    <section className="card call-list" aria-labelledby="call-list-title">
      <div className="today-list-head">
        <h2 id="call-list-title">To follow up</h2>
        <span className="muted small">{count}</span>
      </div>
      {count === 0 ? (
        <p className="muted small follow-empty">Nobody to chase today.</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item.id} className="call-row">
              <span>
                <span className="today-name">{item.name}</span>
                <span className="small muted">{item.note}</span>
              </span>
              <button type="button" className="btn btn-compact" onClick={() => setRebook(item)}>
                Rebook
              </button>
            </li>
          ))}
          {dues.map((d) => (
            <li key={d.patientId} className="call-row">
              <span>
                <span className="today-name">{d.patientName}</span>
                <span className="small muted">Balance due {formatMoney(d.duePaise)}</span>
              </span>
              <Link className="btn btn-compact" to={`/app/patients/${d.patientId}?tab=billing`}>
                Collect
              </Link>
            </li>
          ))}
        </ul>
      )}
      {dues.length > 0 ? (
        <p className="follow-more">
          <Link to="/app/billing?tab=dues">All dues</Link>
        </p>
      ) : null}
      {rebook ? (
        <QuickBookDialog
          open
          prefill={{
            dateLocal: istDate(new Date()),
            patientId: rebook.patientId,
            visitTypeId: rebook.visitTypeId,
          }}
          onClose={() => setRebook(null)}
          onBooked={(slot) => {
            toast({
              text: `Booked for ${formatDate(slot.dateLocal)}, ${formatClockTime(slot.startMin)}`,
            });
            onChanged();
          }}
        />
      ) : null}
    </section>
  );
}
