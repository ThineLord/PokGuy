import {
  defaultData,
  migrateData,
  normalizeSettings,
  STORAGE_KEY,
} from "./storage";
import type { PersistedData } from "./types";

// Ordinary saves compare the caller's edit with the snapshot this tab last
// loaded or wrote. They are not a cross-tab lock and do not sync a live hand.
// A confirmed restore still replaces storage through restoreBackup.

const ATOMIC_FIELDS = [
  "aiProfiles",
  "aiHabits",
  "statsScope",
  "stats",
  "scenarioStats",
  "legacyStats",
  "legacyAiHabits",
  "recentHands",
  "trainingRecords",
] as const satisfies readonly (keyof PersistedData)[];

export type LocalWriteResolution =
  | { status: "ready"; data: PersistedData; observed: string | null }
  | { status: "conflict"; data: PersistedData }
  | { status: "failed"; data: PersistedData };

export type LocalWriteResult =
  | { status: "saved"; data: PersistedData; raw: string }
  | { status: "conflict"; data: PersistedData }
  | { status: "failed"; data: PersistedData };

function stamp(data: PersistedData): PersistedData {
  return { ...data, version: 2 };
}

function canonical(value: unknown): string {
  if (value === undefined) return "undefined";
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

function same(left: unknown, right: unknown): boolean {
  return canonical(left) === canonical(right);
}

// Two tabs can each submit a legal settings field and still produce an illegal
// combination, such as a small blind that is no longer below the saved big
// blind. Refuse that write so the already saved pair stays in place.
function legalSettings(settings: PersistedData["settings"]): boolean {
  return same(
    settings,
    normalizeSettings(settings, settings, new Set(settings.selectedAiIds)),
  );
}

function pick<T>(
  base: T,
  stored: T,
  next: T,
): { ok: true; value: T } | { ok: false } {
  if (same(next, base)) return { ok: true, value: stored };
  if (same(stored, base) || same(stored, next))
    return { ok: true, value: next };
  return { ok: false };
}

function mergeRecord<T extends object>(base: T, stored: T, next: T): T | null {
  const keys = new Set([
    ...Object.keys(base),
    ...Object.keys(stored),
    ...Object.keys(next),
  ]);
  const merged: Record<string, unknown> = {
    ...(stored as Record<string, unknown>),
  };
  for (const key of keys) {
    const chosen = pick(
      (base as Record<string, unknown>)[key],
      (stored as Record<string, unknown>)[key],
      (next as Record<string, unknown>)[key],
    );
    if (!chosen.ok) return null;
    if (chosen.value === undefined) delete merged[key];
    else merged[key] = chosen.value;
  }
  return merged as T;
}

function mergeFromAcknowledged(
  acknowledged: PersistedData,
  stored: PersistedData,
  next: PersistedData,
): PersistedData | null {
  const merged = stamp(stored);
  for (const field of ATOMIC_FIELDS) {
    const chosen = pick(acknowledged[field], stored[field], next[field]);
    if (!chosen.ok) return null;
    merged[field] = chosen.value as never;
  }
  const settings = mergeRecord(
    acknowledged.settings,
    stored.settings,
    next.settings,
  );
  if (!settings || !legalSettings(settings)) return null;
  const playerNotes = mergeRecord(
    acknowledged.playerNotes,
    stored.playerNotes,
    next.playerNotes,
  );
  if (!playerNotes) return null;
  return { ...merged, settings, playerNotes };
}

function acknowledgedData(raw: string | null): PersistedData | null {
  if (raw === null) return defaultData();
  try {
    return migrateData(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

export function resolveLocalWrite(
  next: PersistedData,
  acknowledgedRaw: string | null,
  storage: Pick<Storage, "getItem">,
): LocalWriteResolution {
  const stamped = stamp(next);
  let current: string | null;
  try {
    current = storage.getItem(STORAGE_KEY);
  } catch {
    return { status: "failed", data: stamped };
  }
  if (current === acknowledgedRaw)
    return { status: "ready", data: stamped, observed: current };
  // Storage disappeared after this tab had a snapshot. Refuse rather than
  // publish a partial copy; the in-memory edit stays available to export.
  if (current === null) return { status: "conflict", data: stamped };
  let stored: PersistedData;
  try {
    stored = migrateData(JSON.parse(current) as unknown);
  } catch {
    return { status: "conflict", data: stamped };
  }
  const acknowledged = acknowledgedData(acknowledgedRaw);
  if (!acknowledged) return { status: "conflict", data: stamped };
  const merged = mergeFromAcknowledged(acknowledged, stored, stamped);
  if (!merged) return { status: "conflict", data: stamped };
  return { status: "ready", data: merged, observed: current };
}

export function commitLocalData(
  next: PersistedData,
  acknowledgedRaw: string | null,
  storage: Pick<Storage, "getItem" | "setItem">,
): LocalWriteResult {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const resolved = resolveLocalWrite(next, acknowledgedRaw, storage);
    if (resolved.status !== "ready")
      return { status: resolved.status, data: next };
    try {
      if (storage.getItem(STORAGE_KEY) !== resolved.observed) continue;
      const raw = JSON.stringify(resolved.data);
      storage.setItem(STORAGE_KEY, raw);
      return { status: "saved", data: resolved.data, raw };
    } catch {
      return { status: "failed", data: next };
    }
  }
  return { status: "conflict", data: next };
}
