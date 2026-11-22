type Props = {
  title: string;
  note: string;
};

/** Placeholder until Plan / History / Files tasks land. */
export function VisitStubPanel({ title, note }: Props) {
  return (
    <div className="visit-stub">
      <h2 className="visit-stub-title">{title}</h2>
      <p className="muted">{note}</p>
    </div>
  );
}
