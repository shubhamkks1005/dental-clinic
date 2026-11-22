import type { TodayModel } from "./buildTodayModel";

export function CallList({ items }: { items: TodayModel["callList"] }) {
  return (
    <section className="card call-list" aria-labelledby="call-list-title">
      <div className="today-list-head">
        <h2 id="call-list-title">Call list</h2>
      </div>
      {items.length === 0 ? (
        <p className="muted small">No no-shows to call back today.</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item.id} className="call-row">
              <span className="call-avatar" aria-hidden="true">
                {item.initials}
              </span>
              <span>
                <span className="today-name">{item.name}</span>
                <span className="small muted">
                  {item.note}
                  {item.mobile ? ` · ${item.mobile}` : " · No mobile"}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
