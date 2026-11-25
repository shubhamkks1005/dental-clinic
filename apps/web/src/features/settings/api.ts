import type { SettingKey } from "@clinic/shared";
import { api } from "../../api/client";

export type VersionedSetting<T> = { value: T; version: number };

export async function getSetting<T>(key: SettingKey): Promise<VersionedSetting<T>> {
  const { settings } = await api<{ settings: { key: string; value: unknown; version: number }[] }>(
    "/api/staff/settings",
  );
  const row = settings.find((s) => s.key === key);
  if (!row) throw new Error(`Setting ${key} is missing`);
  return { value: row.value as T, version: row.version };
}

export function putSetting<T>(key: SettingKey, value: T, version: number) {
  return api<{ key: string; value: T; version: number }>(`/api/staff/settings/${key}`, {
    method: "PUT",
    body: { value, version },
  });
}

/** The doctor's QR picture (data URL) or null. Both roles may read it: they print the prescription. */
export function getQrImage() {
  return api<{ value: string | null; version: number }>("/api/staff/clinic/qr");
}
