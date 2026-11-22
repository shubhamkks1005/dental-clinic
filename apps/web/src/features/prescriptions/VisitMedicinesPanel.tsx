import {
  estimateTabletCount,
  FREQUENCY_PRESETS,
  medicineSnapshot,
  parseMedicineSetItems,
  prescriptionSafetyWarnings,
  type ListItem,
  type PrescriptionItemInput,
} from "@clinic/shared";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { ApiError } from "../../api/client";
import { problemText } from "../../api/problem-text";
import { getList } from "../lists/api";
import { getMedicalHistory } from "../medical-history/api";
import {
  copyPreviousPrescription,
  createPrescription,
  issuePrescription,
  listVisitPrescriptions,
  patchPrescription,
  replaceItems,
  revisePrescription,
  type PrescriptionDto,
} from "./api";
import "./prescriptions.css";

type Props = {
  visitId: string;
  patientId: string;
  canWrite: boolean;
};

type DraftLine = PrescriptionItemInput & { key: string };

function toLines(rx: PrescriptionDto): DraftLine[] {
  return rx.items.map((item, i) => ({
    key: item.id || `k-${i}`,
    medicineId: item.medicineId,
    genericName: item.genericName,
    brand: item.brand,
    form: item.form,
    strength: item.strength,
    dose: item.dose,
    frequency: item.frequency,
    days: item.days,
    timing: item.timing,
    instruction: item.instruction,
    tags: item.tags,
  }));
}

function asItems(lines: DraftLine[]): PrescriptionItemInput[] {
  return lines.map((line) => ({
    medicineId: line.medicineId,
    genericName: line.genericName,
    brand: line.brand,
    form: line.form,
    strength: line.strength,
    dose: line.dose,
    frequency: line.frequency,
    days: line.days,
    timing: line.timing,
    instruction: line.instruction,
    tags: line.tags,
  }));
}

/** 4.2.2–4.2.7 Medicines tab on the visit (S05). Keyboard-first add from the doctor list. */
export function VisitMedicinesPanel({ visitId, patientId, canWrite }: Props) {
  const [rx, setRx] = useState<PrescriptionDto | null>(null);
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [medicines, setMedicines] = useState<ListItem[]>([]);
  const [sets, setSets] = useState<ListItem[]>([]);
  const [query, setQuery] = useState("");
  const [advice, setAdvice] = useState("");
  const [followUpOn, setFollowUpOn] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [allergyTags, setAllergyTags] = useState<Array<{ tag: string; label: string }>>([]);
  const [pregnant, setPregnant] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [list, meds, setList, mh] = await Promise.all([
      listVisitPrescriptions(visitId),
      getList("medicines"),
      getList("medicine_sets"),
      getMedicalHistory(patientId).catch(() => ({ alerts: [] as Array<{ label: string }> })),
    ]);
    setMedicines(meds.filter((m) => m.active));
    setSets(setList.filter((s) => s.active));
    const alerts = mh.alerts ?? [];
    const allergenList = await getList("allergens").catch(() => [] as ListItem[]);
    const tags: Array<{ tag: string; label: string }> = [];
    for (const a of allergenList) {
      const tag = typeof a.data.tag === "string" ? a.data.tag : "";
      if (!tag) continue;
      if (alerts.some((al) => al.label.toLowerCase().includes(a.label.toLowerCase().slice(0, 8)))) {
        tags.push({ tag, label: a.label });
      }
    }
    setAllergyTags(tags);
    setPregnant(alerts.some((a) => /pregnan/i.test(a.label)));
    const current = list[0] ?? null;
    setRx(current);
    setLines(current ? toLines(current) : []);
    setAdvice(current?.advice ?? "");
    setFollowUpOn(current?.followUpOn ?? "");
    setWeightKg(current?.weightKg != null ? String(current.weightKg) : "");
  }, [visitId, patientId]);

  useEffect(() => {
    load().catch((err: unknown) => setProblem(problemText(err)));
  }, [load]);

  const locked = rx != null && rx.status !== "draft";
  const warnings = prescriptionSafetyWarnings(lines, { allergyTags, pregnant });

  const filtered = medicines.filter((m) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const brand = typeof m.data.brand === "string" ? m.data.brand : "";
    return m.label.toLowerCase().includes(q) || brand.toLowerCase().includes(q);
  });

  async function ensureDraft(): Promise<PrescriptionDto> {
    if (rx && rx.status === "draft") return rx;
    const created = await createPrescription({ patientId, visitId, items: [] });
    setRx(created);
    return created;
  }

  async function addMedicine(item: ListItem) {
    if (!canWrite || locked || busy) return;
    setBusy(true);
    setProblem(null);
    try {
      const draft = await ensureDraft();
      const snap = medicineSnapshot(item);
      const next: DraftLine[] = [
        ...lines,
        {
          key: `new-${Date.now()}`,
          medicineId: snap.medicineId,
          genericName: snap.genericName,
          brand: snap.brand,
          form: snap.form,
          strength: snap.strength,
          dose: snap.dose,
          frequency: snap.frequency,
          days: snap.days,
          timing: snap.timing,
          instruction: snap.instruction,
          tags: snap.tags,
        },
      ];
      const saved = await replaceItems(draft.id, draft.version, asItems(next));
      setRx(saved);
      setLines(toLines(saved));
      setQuery("");
    } catch (err) {
      setProblem(problemText(err));
    } finally {
      setBusy(false);
    }
  }

  async function applySet(setItem: ListItem) {
    const names = parseMedicineSetItems(String(setItem.data.items ?? ""));
    for (const name of names) {
      const med = medicines.find((m) => m.label.toLowerCase() === name.toLowerCase());
      if (med) await addMedicine(med);
    }
  }

  async function saveLines(next: DraftLine[]) {
    if (!rx || locked) return;
    setBusy(true);
    try {
      const saved = await replaceItems(rx.id, rx.version, asItems(next));
      setRx(saved);
      setLines(toLines(saved));
    } catch (err) {
      setProblem(problemText(err));
      if (err instanceof ApiError && err.status === 409) await load();
    } finally {
      setBusy(false);
    }
  }

  async function saveMeta() {
    if (!rx || locked) return;
    setBusy(true);
    try {
      const saved = await patchPrescription(rx.id, {
        version: rx.version,
        advice,
        followUpOn: followUpOn || null,
        weightKg: weightKg ? Number.parseInt(weightKg, 10) : null,
      });
      setRx(saved);
    } catch (err) {
      setProblem(problemText(err));
    } finally {
      setBusy(false);
    }
  }

  async function onIssue() {
    if (!rx || locked) return;
    setBusy(true);
    try {
      await saveMeta();
      const issued = await issuePrescription(rx.id, rx.version);
      setRx(issued);
      setLines(toLines(issued));
    } catch (err) {
      setProblem(problemText(err));
    } finally {
      setBusy(false);
    }
  }

  if (!canWrite) {
    return (
      <p className="muted">
        Only the doctor can write prescriptions. Receptionist can print issued ones from History.
      </p>
    );
  }

  return (
    <section className="rx-panel" aria-label="Medicines">
      {problem && (
        <p className="notice notice-error" role="alert">
          {problem}
        </p>
      )}
      {warnings.map((w) => (
        <p key={w} className="notice notice-warn" role="status">
          {w}
        </p>
      ))}

      <div className="rx-toolbar">
        <label className="rx-search">
          <span className="visually-hidden">Search medicines</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && filtered[0]) {
                e.preventDefault();
                void addMedicine(filtered[0]);
              }
            }}
            placeholder="Search medicine (Enter to add)"
            disabled={locked || busy}
          />
        </label>
        <button
          type="button"
          className="btn"
          disabled={locked || busy}
          onClick={() => void copyPreviousPrescription(patientId, visitId).then(load)}
        >
          Copy previous
        </button>
        {locked ? (
          <button
            type="button"
            className="btn"
            disabled={busy}
            onClick={() => void revisePrescription(rx!.id).then(load)}
          >
            Revise
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy || lines.length === 0}
            onClick={() => void onIssue()}
          >
            Issue
          </button>
        )}
        {rx && (rx.status === "issued" || rx.status === "revised") && (
          <Link className="btn" to={`/app/print/prescription/${rx.id}`}>
            Print
          </Link>
        )}
      </div>

      {!locked && (
        <ul className="rx-suggest">
          {filtered.slice(0, 8).map((m) => (
            <li key={m.id}>
              <button type="button" className="btn btn-quiet" onClick={() => void addMedicine(m)}>
                <strong>{m.label}</strong>
                <span className="muted small">
                  {String(m.data.strength ?? "")} · {String(m.data.default_frequency ?? "")}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {!locked && sets.length > 0 && (
        <div className="rx-sets">
          {sets.map((s) => (
            <button
              key={s.id}
              type="button"
              className="btn"
              disabled={busy}
              onClick={() => void applySet(s)}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      <div className="rx-table-wrap">
        <table className="rx-table">
          <thead>
            <tr>
              <th>Medicine</th>
              <th>Dose</th>
              <th>Freq</th>
              <th>Days</th>
              <th>Total</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => (
              <tr key={line.key}>
                <td>
                  <strong>{line.genericName}</strong>
                  <div className="muted small">
                    {line.strength} · {line.form}
                  </div>
                </td>
                <td>
                  <input
                    value={line.dose}
                    disabled={locked || busy}
                    onChange={(e) => {
                      const next = lines.map((l, i) =>
                        i === index ? { ...l, dose: e.target.value } : l,
                      );
                      setLines(next);
                    }}
                    onBlur={() => void saveLines(lines)}
                  />
                </td>
                <td>
                  <select
                    value={line.frequency}
                    disabled={locked || busy}
                    onChange={(e) => {
                      const next = lines.map((l, i) =>
                        i === index ? { ...l, frequency: e.target.value } : l,
                      );
                      setLines(next);
                      void saveLines(next);
                    }}
                  >
                    {FREQUENCY_PRESETS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                    {!FREQUENCY_PRESETS.includes(
                      line.frequency as (typeof FREQUENCY_PRESETS)[number],
                    ) && <option value={line.frequency}>{line.frequency}</option>}
                  </select>
                </td>
                <td>
                  <input
                    value={line.days}
                    disabled={locked || busy}
                    inputMode="numeric"
                    onChange={(e) => {
                      const next = lines.map((l, i) =>
                        i === index ? { ...l, days: e.target.value } : l,
                      );
                      setLines(next);
                    }}
                    onBlur={() => void saveLines(lines)}
                  />
                </td>
                <td className="muted">
                  {estimateTabletCount(line.dose, line.frequency, line.days) ?? "—"}
                </td>
                <td>
                  {!locked && (
                    <button
                      type="button"
                      className="btn btn-quiet"
                      onClick={() => void saveLines(lines.filter((_, i) => i !== index))}
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {lines.length === 0 && (
          <p className="muted">No medicines yet. Search and press Enter to add.</p>
        )}
      </div>

      <div className="rx-meta">
        <label>
          Advice
          <textarea
            value={advice}
            disabled={locked || busy}
            rows={2}
            onChange={(e) => setAdvice(e.target.value)}
            onBlur={() => void saveMeta()}
          />
        </label>
        <label>
          Follow-up date
          <input
            type="date"
            value={followUpOn}
            disabled={locked || busy}
            onChange={(e) => setFollowUpOn(e.target.value)}
            onBlur={() => void saveMeta()}
          />
        </label>
        <label>
          Weight (kg)
          <input
            inputMode="numeric"
            value={weightKg}
            disabled={locked || busy}
            onChange={(e) => setWeightKg(e.target.value)}
            onBlur={() => void saveMeta()}
          />
        </label>
      </div>

      {rx && (
        <p className="muted small">
          Status: {rx.status}
          {rx.rxNo ? ` · ${rx.rxNo}` : ""}
        </p>
      )}
    </section>
  );
}
