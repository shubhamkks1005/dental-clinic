import { TOOTH_SURFACE_LABEL } from "@clinic/shared";
import { formatDate, formatMoney } from "../../ui/format";
import type { VisitSummary } from "./api";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="v1-final-row">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

/** A finalised visit as plain read-only text. Empty fields are left out. */
export function VisitFinalView({ visit }: { visit: VisitSummary }) {
  const has = (v: string | null) => (v && v.trim() ? v : null);
  const vitals = [
    visit.bpSystolic != null && visit.bpDiastolic != null
      ? `BP ${visit.bpSystolic}/${visit.bpDiastolic}`
      : null,
    visit.pulse != null ? `Pulse ${visit.pulse}` : null,
  ].filter(Boolean);
  const next = has(visit.nextVisitNote);
  return (
    <section className="card v1-final" aria-label="Visit record">
      <dl>
        {has(visit.chiefComplaint) && <Row label="Complaint">{visit.chiefComplaint}</Row>}
        {has(visit.historyNote) && <Row label="History">{visit.historyNote}</Row>}
        {has(visit.examNote) && <Row label="Findings">{visit.examNote}</Row>}
        {has(visit.gumCondition) && <Row label="Gums">{visit.gumCondition}</Row>}
        {vitals.length > 0 && <Row label="Vitals">{vitals.join(" · ")}</Row>}
        {visit.procedures.length > 0 && (
          <Row label="Procedures done">
            <ul>
              {visit.procedures.map((p) => (
                <li key={p.id}>
                  {p.label}
                  {p.toothFdi != null ? ` · tooth ${p.toothFdi}` : ""}
                  {p.surfaces.length > 0
                    ? ` ${p.surfaces.map((s) => TOOTH_SURFACE_LABEL[s]).join("")}`
                    : ""}
                  {p.defaultPaise != null ? ` · ${formatMoney(p.defaultPaise)}` : ""}
                  {p.note ? ` (${p.note})` : ""}
                </li>
              ))}
            </ul>
          </Row>
        )}
        {visit.diagnoses.length > 0 && (
          <Row label="Diagnosis">
            <ul>
              {visit.diagnoses.map((d) => (
                <li key={d.id}>
                  {d.label}
                  {d.toothFdi != null ? ` · tooth ${d.toothFdi}` : ""}
                </li>
              ))}
            </ul>
          </Row>
        )}
        {has(visit.advice) && <Row label="Advice">{visit.advice}</Row>}
        {next && (
          <Row label="Next visit">
            {/^On \d{4}-\d{2}-\d{2}$/.test(next) ? `On ${formatDate(next.slice(3))}` : next}
          </Row>
        )}
      </dl>
    </section>
  );
}
