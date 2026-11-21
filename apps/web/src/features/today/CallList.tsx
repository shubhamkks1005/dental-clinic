import { formatRupees } from "@clinic/shared";
import type { CallItem } from "./sample-data";

const noteOf = (item: CallItem) =>
  item.balancePaise === undefined
    ? (item.note ?? "")
    : `Balance due: ${formatRupees(item.balancePaise)}`;

export function CallList({ items }: { items: CallItem[] }) {
  return (
    <section className="card call-list" aria-labelledby="call-list-title">
      <div className="today-list-head">
        <h2 id="call-list-title">Call list</h2>
      </div>
      <ul>
        {items.map((item) => (
          <li key={item.name} className="call-row">
            <span className="call-avatar" aria-hidden="true">
              {item.initials}
            </span>
            <span>
              <span className="today-name">{item.name}</span>
              <span className="small muted">{noteOf(item)}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
