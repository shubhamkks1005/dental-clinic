import type { Repos, SettingRow, SettingValue } from "@clinic/db";

// Settings store (1.5.1). Permission, the rule per key, the version check and the audit row all
// live in the settings repository.
/** The doctor's QR picture (data URL) or null; read on its own because it is big. */
export const getQrImage = (repos: Repos) => repos.settings.get("clinic.qr_image");

export const listSettings = (repos: Repos): Promise<SettingRow[]> => repos.settings.list();

export const updateSetting = (
  repos: Repos,
  key: string,
  value: unknown,
  version: number,
): Promise<SettingValue> => repos.settings.update(key, value, version);

/** 6.5.2 */
export const settingHistory = (repos: Repos, key: string) => repos.settingsHistory.history(key);

export const restoreSetting = (repos: Repos, key: string, auditId: string, version: number) =>
  repos.settingsHistory.restore(key, auditId, version);
