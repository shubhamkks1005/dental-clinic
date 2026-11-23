import { formatMoney } from "../../ui/format";
import { StatCard } from "../../ui/StatCard";
import type { TodayModel } from "./buildTodayModel";

// A phone has room for one short word per card; tablet and laptop show the full label.
function Label({ long, short }: { long: string; short: string }) {
  return (
    <>
      <span className="stat-long">{long}</span>
      <span className="stat-short">{short}</span>
    </>
  );
}

/** Receptionist stat strip (Main.dc.html): Booked, Waiting, In chair, Ready to bill. */
export function TodayStats({ model }: { model: TodayModel }) {
  const ready = model.readyToBillCount;
  const collect =
    model.readyToBillPaise != null && model.readyToBillPaise > 0
      ? `${formatMoney(model.readyToBillPaise)} to collect`
      : "visit done, not paid";
  return (
    <div className="today-stats">
      <StatCard
        label={<Label long="Booked today" short="Booked" />}
        value={String(model.appointmentsCount)}
        note={`${model.openSlots} open slots`}
        good
      />
      <StatCard
        label="Waiting"
        value={String(model.waitingCount)}
        note={
          model.longestWaitMin === null ? "none waiting" : `longest ${model.longestWaitMin} min`
        }
      />
      <StatCard
        label="In chair"
        value={String(model.inChairCount)}
        note={model.inChairName ?? "nobody in the chair"}
      />
      <StatCard
        label={<Label long="Ready to bill" short="To bill" />}
        value={String(ready)}
        note={ready === 0 ? "nothing to collect" : collect}
        good={ready === 0}
        className={ready > 0 ? "stat-ready" : ""}
      />
    </div>
  );
}
