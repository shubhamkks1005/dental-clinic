import { addIstDays, istDate } from "@clinic/shared";
import { Link } from "react-router";

type Props = { serverNow: Date; onWalkIn: () => void };

/** Walk-in (the one main button) and the day lists. Receptionist only. */
export function TodayActions({ serverNow, onWalkIn }: Props) {
  const today = istDate(serverNow);
  return (
    <div className="today-toolbar">
      <button type="button" className="btn btn-primary" onClick={onWalkIn}>
        Walk-in
      </button>
      <Link className="btn" to={`/app/print/day?date=${encodeURIComponent(today)}`}>
        Print today's list
      </Link>
      <Link className="btn" to={`/app/print/day?date=${encodeURIComponent(addIstDays(today, 1))}`}>
        Print tomorrow
      </Link>
    </div>
  );
}
