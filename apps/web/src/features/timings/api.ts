import type { Holiday, Timings } from "@clinic/shared";
import { api } from "../../api/client";

export type Versioned<T> = { value: T; version: number };
type SettingRow = { key: string; value: unknown; version: number };

// Timings and holidays come from the settings store (1.5.1); each save sends the version seen.
export async function getTimingSettings(): Promise<{
  timings: Versioned<Timings>;
  holidays: Versioned<Holiday[]>;
}> {
  const { settings } = await api<{ settings: SettingRow[] }>("/api/staff/settings");
  const pick = <T>(key: string): Versioned<T> => {
    const row = settings.find((s) => s.key === key);
    if (!row) throw new Error(`Setting ${key} is missing`);
    return { value: row.value as T, version: row.version };
  };
  return { timings: pick<Timings>("clinic.timings"), holidays: pick<Holiday[]>("clinic.holidays") };
}

export const saveSetting = <T>(key: string, value: T, version: number) =>
  api<{ key: string; value: T; version: number }>(`/api/staff/settings/${key}`, {
    method: "PUT",
    body: { value, version },
  });
