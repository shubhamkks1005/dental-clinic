import type { Repos, SettingRow, SettingValue } from "@clinic/db";

// Settings store (1.5.1). Permission, the rule per key, the version check and the audit row all
// live in the settings repository.
export const listSettings = (repos: Repos): Promise<SettingRow[]> => repos.settings.list();

export const updateSetting = (
  repos: Repos,
  key: string,
  value: unknown,
  version: number,
): Promise<SettingValue> => repos.settings.update(key, value, version);
