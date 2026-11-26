// Clashes are allowed (owner 2026-11-26): bookings of one day that overlap are drawn side by side
// in equal lanes (HTML: two lanes 50/50). Pure, so the week and day grids place cards the same way.

export type LaneInput = { id: string; startMin: number; endMin: number; busy: boolean };

/**
 * lane: 0-based column; lanes: how many columns the group shares.
 * behind: a cancelled / missed / moved row under a busy one; drawn full width behind it.
 */
export type LanePlace = { id: string; lane: number; lanes: number; behind: boolean };

const overlaps = (a: LaneInput, b: LaneInput) => a.startMin < b.endMin && b.startMin < a.endMin;

/** Groups of rows that touch each other directly or through a chain, each given lanes. */
function placeGroups(rows: LaneInput[]): LanePlace[] {
  const sorted = [...rows].sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);
  const out: LanePlace[] = [];
  let group: { id: string; lane: number }[] = [];
  let laneEnds: number[] = [];
  let groupEnd = -1;

  const flush = () => {
    for (const g of group)
      out.push({ id: g.id, lane: g.lane, lanes: laneEnds.length, behind: false });
    group = [];
    laneEnds = [];
  };

  for (const r of sorted) {
    if (group.length > 0 && r.startMin >= groupEnd) flush();
    let lane = laneEnds.findIndex((end) => end <= r.startMin);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(r.endMin);
    } else {
      laneEnds[lane] = r.endMin;
    }
    group.push({ id: r.id, lane });
    groupEnd = group.length === 1 ? r.endMin : Math.max(groupEnd, r.endMin);
  }
  flush();
  return out;
}

export function clashLanes(rows: LaneInput[]): LanePlace[] {
  const busy = rows.filter((r) => r.busy);
  const gone = rows.filter((r) => !r.busy);
  const goneUnder = gone.filter((g) => busy.some((b) => overlaps(g, b)));
  const goneFree = gone.filter((g) => !goneUnder.includes(g));
  const placed = [
    ...placeGroups(busy),
    ...placeGroups(goneFree),
    ...goneUnder.map((g) => ({ id: g.id, lane: 0, lanes: 1, behind: true })),
  ];
  const byId = new Map(placed.map((p) => [p.id, p]));
  return rows.map((r) => byId.get(r.id)!);
}
