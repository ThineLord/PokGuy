import packageInfo from "../../package.json" with { type: "json" };
import { EMPTY_STATS, migrateData, STORAGE_KEY } from "./storage";
import type { PersistedData } from "./types";

export interface Preferences {
  locale: "zh-CN" | "en";
  theme: "system" | "light" | "dark";
}
export interface Backup {
  format: "pokguy-backup";
  formatVersion: 1;
  appVersion: string;
  createdAt: string;
  data: PersistedData;
  preferences: Preferences;
}
export const MAX_BACKUP_BYTES = 10 * 1024 * 1024;
export function createBackup(
  data: PersistedData,
  preferences: Preferences,
): Backup {
  return {
    format: "pokguy-backup",
    formatVersion: 1,
    appVersion: packageInfo.version,
    createdAt: new Date().toISOString(),
    data,
    preferences,
  };
}
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}
export function parseBackup(
  text: string,
  current: PersistedData,
  preferences: Preferences,
): { backup: Backup; legacy: boolean } {
  if (new TextEncoder().encode(text).length > MAX_BACKUP_BYTES)
    throw new Error("backup-size");
  const raw = JSON.parse(text);
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    throw new Error("backup-format");
  if (raw.format === "pokguy-backup") {
    if (
      raw.formatVersion !== 1 ||
      typeof raw.appVersion !== "string" ||
      !Number.isFinite(Date.parse(raw.createdAt)) ||
      raw.data?.version !== 2
    )
      throw new Error("backup-version");
    if (
      !["zh-CN", "en"].includes(raw.preferences?.locale) ||
      !["system", "light", "dark"].includes(raw.preferences?.theme)
    )
      throw new Error("backup-preferences");
    if (
      raw.data.statsScope === undefined &&
      ["scenarioStats", "legacyStats", "legacyAiHabits"].some((key) =>
        Object.hasOwn(raw.data, key),
      )
    )
      throw new Error("backup-invalid-scope");
    const data = migrateData(raw.data);
    const expected =
      raw.data.statsScope === undefined
        ? {
            ...raw.data,
            statsScope: "cash-v1",
            stats: { ...EMPTY_STATS, byPosition: {} },
            aiHabits: {},
            scenarioStats: raw.data.scenarioStats ?? {
              ...EMPTY_STATS,
              byPosition: {},
            },
            legacyStats: raw.data.stats,
            legacyAiHabits: raw.data.aiHabits,
          }
        : raw.data;
    if (canonical(data) !== canonical(expected))
      throw new Error("backup-invalid-data");
    return { backup: { ...raw, data }, legacy: false };
  }
  // Older settings exports are recognized explicitly; hand arrays are not backups.
  if (
    ![1, 2].includes(raw.version) ||
    !raw.settings ||
    !Array.isArray(raw.aiProfiles) ||
    Object.keys(raw).some(
      (key) => !["version", "settings", "aiProfiles"].includes(key),
    )
  )
    throw new Error("backup-format");
  const candidate = {
    ...current,
    settings: { ...current.settings, ...raw.settings },
    aiProfiles: raw.aiProfiles,
  };
  const data = migrateData(candidate);
  if (canonical(data) !== canonical(candidate))
    throw new Error("backup-invalid-data");
  return { backup: createBackup(data, preferences), legacy: true };
}

export function prepareRestore(
  preview: ReturnType<typeof parseBackup>,
  current: PersistedData,
  preferences: Preferences,
): Backup {
  if (!preview.legacy) return preview.backup;
  return {
    ...preview.backup,
    preferences,
    data: {
      ...current,
      settings: preview.backup.data.settings,
      aiProfiles: preview.backup.data.aiProfiles,
    },
  };
}

// A failed restore must leave the previous on-disk dataset intact. Restore all
// snapshots if any write fails; a rollback failure is surfaced to the caller.
export function restoreBackup(
  backup: Backup,
  storage: Pick<Storage, "getItem" | "setItem" | "removeItem">,
): "saved" | "failed" | "rollback-failed" {
  const entries = [
    ["riverlab-locale", backup.preferences.locale],
    ["pokguy-theme", backup.preferences.theme],
    [STORAGE_KEY, JSON.stringify(backup.data)],
  ];
  let previous: (string | null)[];
  try {
    previous = entries.map(([key]) => storage.getItem(key));
  } catch {
    return "failed";
  }
  try {
    for (const [key, value] of entries) storage.setItem(key, value);
    return "saved";
  } catch {
    let failed = false;
    entries.forEach(([key], index) => {
      try {
        if (storage.getItem(key) === previous[index]) return;
        if (previous[index] === null) storage.removeItem(key);
        else storage.setItem(key, previous[index]!);
      } catch {
        failed = true;
      }
    });
    return failed ? "rollback-failed" : "failed";
  }
}
export function downloadJson(filename: string, value: unknown) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
