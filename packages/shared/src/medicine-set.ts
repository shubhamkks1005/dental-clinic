import type { ListItem, ListItemData } from "./lists";
import { parseMedicineSetItems } from "./medicines";

// Library Q6 / Q12 (2026-11-26): a medicine set holds the ids of Library medicines (item_ids)
// plus their names (items) for older readers. A set whose medicine is hidden or gone is not
// offered in visits until the doctor fixes it. Names are split by parseMedicineSetItems
// (medicines.ts), the one splitter.

type SetLike = { data: ListItemData };
type MedicineLike = Pick<ListItem, "id" | "label" | "active">;

export function parseSetItemIds(raw: string | number | undefined | null): string[] {
  return parseMedicineSetItems(typeof raw === "string" ? raw : "");
}

export type SetMedicineProblem = "ok" | "hidden" | "missing";

export type ResolvedSetMedicine<M extends MedicineLike> = {
  name: string;
  medicine: M | null;
  problem: SetMedicineProblem;
};

const text = (v: string | number | undefined) => (typeof v === "string" ? v : "");

/**
 * The medicines of a set. With ids: matched by id (the CURRENT name is shown, so a rename shows
 * at once; inactive = "hidden"; not found = "missing"). Without ids (older sets): matched by
 * name, case-insensitive, among ACTIVE medicines only.
 */
export function resolveSetMedicines<M extends MedicineLike>(
  set: SetLike,
  medicines: readonly M[],
): ResolvedSetMedicine<M>[] {
  const ids = parseSetItemIds(set.data.item_ids);
  const names = parseMedicineSetItems(text(set.data.items));
  if (ids.length > 0) {
    const byId = new Map(medicines.map((m) => [m.id, m]));
    return ids.map((id, i) => {
      const medicine = byId.get(id) ?? null;
      if (!medicine) return { name: names[i] ?? id, medicine: null, problem: "missing" };
      return { name: medicine.label, medicine, problem: medicine.active ? "ok" : "hidden" };
    });
  }
  return names.map((name) => {
    const want = name.toLowerCase();
    const medicine = medicines.find((m) => m.active && m.label.toLowerCase() === want) ?? null;
    return { name, medicine, problem: medicine ? "ok" : "missing" };
  });
}

/** Offered in visits only when it has at least one medicine and every one is usable. */
export function isSetUsable(set: SetLike, medicines: readonly MedicineLike[]): boolean {
  const resolved = resolveSetMedicines(set, medicines);
  return resolved.length > 0 && resolved.every((r) => r.problem === "ok");
}

/** Active sets that hold this medicine (by id, or by name for sets without ids). */
export function setsUsingMedicine<S extends SetLike & { active: boolean }>(
  medicine: { id: string; label: string },
  sets: readonly S[],
): S[] {
  const want = medicine.label.trim().toLowerCase();
  return sets.filter((s) => {
    if (!s.active) return false;
    const ids = parseSetItemIds(s.data.item_ids);
    if (ids.length > 0) return ids.includes(medicine.id);
    return parseMedicineSetItems(text(s.data.items)).some((n) => n.toLowerCase() === want);
  });
}

/** The set's data with this medicine taken out of both lists, others kept in order. */
export function withoutMedicine(
  setData: ListItemData,
  medicine: { id: string; label: string },
): ListItemData {
  const ids = parseSetItemIds(setData.item_ids);
  const names = parseMedicineSetItems(text(setData.items));
  const want = medicine.label.trim().toLowerCase();
  if (ids.length > 0) {
    const keep = ids
      .map((id, i) => ({ id, name: names[i] ?? "" }))
      .filter((e) => e.id !== medicine.id);
    return {
      ...setData,
      item_ids: keep.map((e) => e.id).join("|"),
      items: keep.map((e) => e.name).join("|"),
    };
  }
  return { ...setData, items: names.filter((n) => n.toLowerCase() !== want).join("|") };
}

/** The data a set saves from picked medicines: ids and their current names, same order. */
export function setDataFrom(medicines: readonly { id: string; label: string }[]): ListItemData {
  return {
    items: medicines.map((m) => m.label).join("|"),
    item_ids: medicines.map((m) => m.id).join("|"),
  };
}
