type Props = { label: string; value: string; note: string; good?: boolean; className?: string };

export function StatCard({ label, value, note, good = false, className = "" }: Props) {
  return (
    <section className={`card stat ${className}`}>
      <p className="muted">{label}</p>
      <p className="stat-value">{value}</p>
      <p className={good ? "small stat-note-good" : "small muted"}>{note}</p>
    </section>
  );
}
