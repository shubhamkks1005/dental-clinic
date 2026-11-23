import { useEffect, useState } from "react";
import { problemText } from "../../api/problem-text";
import { api } from "../../api/client";
import { getSetting } from "./api";

type CounterRow = { name: string; period: string; value: number };

const LABELS: Record<string, string> = {
  patient_code: "Patient code",
  prescription: "Prescription",
  bill: "Bill",
  receipt: "Receipt",
  refund: "Refund",
  certificate: "Certificate",
};

/** 6.5.1: view-only counters + patient code format. */
export function NumberSeriesSettings() {
  const [counters, setCounters] = useState<CounterRow[] | null>(null);
  const [prefix, setPrefix] = useState("P-");
  const [digits, setDigits] = useState(6);
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api<{ counters: CounterRow[] }>("/api/staff/counters"),
      getSetting<string>("patient_code.prefix"),
      getSetting<number>("patient_code.digits"),
    ])
      .then(([c, p, d]) => {
        setCounters(c.counters);
        setPrefix(p.value);
        setDigits(d.value);
        setProblem(null);
      })
      .catch((err: unknown) => setProblem(problemText(err)));
  }, []);

  if (problem) {
    return (
      <section className="card settings-panel">
        <p className="notice notice-error" role="alert">
          {problem}
        </p>
      </section>
    );
  }
  if (!counters) {
    return (
      <section className="card settings-panel">
        <p className="muted">Loading number series…</p>
      </section>
    );
  }

  const sample = `${prefix}${String(1).padStart(digits, "0")}`;

  return (
    <section className="card settings-panel">
      <h2>Number series</h2>
      <p className="muted">
        View only. Numbers are gap-free per financial year. Patient codes look like {sample}.
      </p>
      <p className="settings-meta">
        Prefix <strong>{prefix}</strong> · Digits <strong>{digits}</strong>
      </p>
      {counters.length === 0 ? (
        <p className="muted">No counters yet. They appear after the first patient, bill or Rx.</p>
      ) : (
        <ul className="settings-counter-list">
          {counters.map((row) => (
            <li key={`${row.name}-${row.period}`}>
              <span>{LABELS[row.name] ?? row.name}</span>
              <span className="muted">{row.period}</span>
              <strong>{row.value}</strong>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
