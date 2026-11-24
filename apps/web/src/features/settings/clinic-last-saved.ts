import { api } from "../../api/client";
import { ALL_CLINIC_FIELDS } from "./clinic-fields";

type Entry = { at: string; byName: string };

/** Who changed any Clinic or Doctor field last, from the existing per-setting history. */
export async function clinicLastSaved(): Promise<Entry | null> {
  const lists = await Promise.all(
    ALL_CLINIC_FIELDS.map((f) =>
      api<{ history: Entry[] }>(`/api/staff/settings/${f.key}/history`)
        .then((r) => r.history)
        .catch(() => [] as Entry[]),
    ),
  );
  const all = lists.flat();
  return all.reduce<Entry | null>((best, e) => (!best || e.at > best.at ? e : best), null);
}
