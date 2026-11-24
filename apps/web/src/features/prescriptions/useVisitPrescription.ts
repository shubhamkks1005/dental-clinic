import {
  medicineSnapshot,
  parseMedicineSetItems,
  prescriptionSafetyWarnings,
  type ListItem,
} from "@clinic/shared";
import { useCallback, useEffect, useState } from "react";
import { ApiError } from "../../api/client";
import { problemText } from "../../api/problem-text";
import { getList } from "../lists/api";
import { getMedicalHistory } from "../medical-history/api";
import {
  createPrescription,
  issuePrescription,
  listVisitPrescriptions,
  patchPrescription,
  replaceItems,
  type PrescriptionDto,
} from "./api";
import { asItems, toLines, type DraftLine } from "./rx-lines";

/** State and actions of the one prescription that belongs to a visit (4.2.2 to 4.2.7). */
export function useVisitPrescription(visitId: string, patientId: string, canWrite: boolean) {
  const [rx, setRx] = useState<PrescriptionDto | null>(null);
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [medicines, setMedicines] = useState<ListItem[]>([]);
  const [sets, setSets] = useState<ListItem[]>([]);
  const [advice, setAdvice] = useState("");
  const [followUpOn, setFollowUpOn] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [allergyTags, setAllergyTags] = useState<Array<{ tag: string; label: string }>>([]);
  const [pregnant, setPregnant] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [list, meds, setList, mh, allergenList] = await Promise.all([
      listVisitPrescriptions(visitId),
      getList("medicines"),
      getList("medicine_sets"),
      getMedicalHistory(patientId).catch(() => ({ alerts: [] as Array<{ label: string }> })),
      getList("allergens").catch(() => [] as ListItem[]),
    ]);
    setMedicines(meds.filter((m) => m.active));
    setSets(setList.filter((s) => s.active));
    const alerts = mh.alerts ?? [];
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
    if (!canWrite) return;
    load().catch((err: unknown) => setProblem(problemText(err)));
  }, [load, canWrite]);

  const locked = rx != null && rx.status !== "draft";
  const warnings = prescriptionSafetyWarnings(lines, { allergyTags, pregnant });

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
      const added: DraftLine = {
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
      };
      const saved = await replaceItems(draft.id, draft.version, asItems([...lines, added]));
      setRx(saved);
      setLines(toLines(saved));
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

  // Returns the saved prescription (new version) or null when nothing was saved.
  async function saveMeta(): Promise<PrescriptionDto | null> {
    if (!rx || locked) return null;
    setBusy(true);
    try {
      const saved = await patchPrescription(rx.id, {
        version: rx.version,
        advice,
        followUpOn: followUpOn || null,
        weightKg: weightKg ? Number.parseInt(weightKg, 10) : null,
      });
      setRx(saved);
      return saved;
    } catch (err) {
      setProblem(problemText(err));
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function onIssue() {
    if (!rx || locked) return;
    setBusy(true);
    try {
      // Saving raises the version: issue with the saved one, not the stale rx (C3).
      const saved = await saveMeta();
      if (!saved) return;
      const issued = await issuePrescription(saved.id, saved.version);
      setRx(issued);
      setLines(toLines(issued));
    } catch (err) {
      setProblem(problemText(err));
    } finally {
      setBusy(false);
    }
  }

  return {
    rx,
    lines,
    setLines,
    medicines,
    sets,
    advice,
    setAdvice,
    followUpOn,
    setFollowUpOn,
    weightKg,
    setWeightKg,
    problem,
    busy,
    locked,
    warnings,
    load,
    addMedicine,
    applySet,
    saveLines,
    saveMeta,
    onIssue,
  };
}
