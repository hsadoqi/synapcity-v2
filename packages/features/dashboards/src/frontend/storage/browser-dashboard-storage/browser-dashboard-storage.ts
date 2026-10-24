import { dashboardCompositionSchema } from '@synapcity/domain-dashboards';
import {
  prototypeRecordsSchema,
  type PrototypeRecords,
} from '@synapcity/domain-prototypes';
import type { z } from 'zod';

import type {
  DashboardStorage,
  DashboardStorageError,
} from '../../../contracts';

export type BrowserDashboardStorageOptions = {
  ownerId: string;
  /** Called for unreadable or unwritable storage and for saved data that fails validation. */
  onError?: (error: DashboardStorageError) => void;
  /** Defaults to `window.localStorage`. */
  storage?: Storage;
};

const compositionKey = (ownerId: string, dashboardId: string) =>
  `synapcity.dashboard.${ownerId}.${dashboardId}.v1`;
const recordsKey = (ownerId: string) => `synapcity.records.${ownerId}.v1`;

/** Thrown when saved data failed validation and could not be copied aside: it must not be overwritten. */
class UnsafeToOverwrite extends Error {
  constructor(key: string) {
    super(`Saved data at ${key} is invalid and could not be set aside.`);
  }
}

/**
 * Folds `mine` into what is already saved. A record keeps the copy with the
 * later `updatedAt`, and records only the saved copy has are kept, so a tab
 * holding an older copy cannot drop records another tab added.
 */
function mergeTable<T extends { id: string; updatedAt: string }>(
  saved: Record<string, T>,
  mine: Record<string, T>,
): Record<string, T> {
  const table = { ...saved };
  for (const record of Object.values(mine)) {
    const existing = table[record.id];
    if (
      !existing ||
      Date.parse(record.updatedAt) >= Date.parse(existing.updatedAt)
    ) {
      table[record.id] = record;
    }
  }
  return table;
}

function mergeRecords(
  saved: PrototypeRecords | null,
  mine: PrototypeRecords,
): PrototypeRecords {
  if (!saved) return mine;
  return {
    metric: mergeTable(saved.metric, mine.metric),
    goal: mergeTable(saved.goal, mine.goal),
    habit: mergeTable(saved.habit, mine.habit),
    project: mergeTable(saved.project, mine.project),
    task: mergeTable(saved.task, mine.task),
    event: mergeTable(saved.event, mine.event),
    activity: mergeTable(saved.activity, mine.activity),
    note: mergeTable(saved.note, mine.note),
    link: mergeTable(saved.link, mine.link),
    asset: mergeTable(saved.asset, mine.asset),
  };
}

/**
 * Saves dashboards in the browser, one copy per owner. Storage errors are
 * reported; failed writes reject so the scheduler can retry. Saved data is
 * validated on load, and a value that fails is copied to `<key>.invalid` only
 * when that backup slot is free; otherwise loading rejects without overwriting
 * either copy. Records merge by id on save (see `mergeRecords`).
 */
export function browserDashboardStorage({
  ownerId,
  onError = () => {},
  storage,
}: BrowserDashboardStorageOptions): DashboardStorage {
  const store = () => storage ?? window.localStorage;

  function write(key: string, value: string): void {
    try {
      store().setItem(key, value);
    } catch (cause) {
      onError({ kind: 'write', key, cause });
      throw cause;
    }
  }

  function read<T>(key: string, schema: z.ZodType<T>): T | null {
    let raw: string | null;
    try {
      raw = store().getItem(key);
    } catch (cause) {
      onError({ kind: 'read', key, cause });
      throw cause;
    }
    if (raw === null) return null;
    let cause: unknown;
    try {
      const parsed = schema.safeParse(JSON.parse(raw));
      if (parsed.success) return parsed.data;
      cause = parsed.error;
    } catch (error) {
      cause = error;
    }
    onError({ kind: 'invalid', key, cause });
    const invalidKey = `${key}.invalid`;
    let existingBackup: string | null;
    try {
      existingBackup = store().getItem(invalidKey);
    } catch (backupCause) {
      onError({ kind: 'read', key: invalidKey, cause: backupCause });
      throw new UnsafeToOverwrite(key);
    }
    if (existingBackup !== null) throw new UnsafeToOverwrite(key);
    try {
      write(invalidKey, raw);
    } catch {
      throw new UnsafeToOverwrite(key);
    }
    return null;
  }

  return {
    load: async (dashboardId) => ({
      composition: read(
        compositionKey(ownerId, dashboardId),
        dashboardCompositionSchema,
      ),
      records: read(recordsKey(ownerId), prototypeRecordsSchema),
    }),
    saveComposition: async (dashboardId, composition) => {
      write(compositionKey(ownerId, dashboardId), JSON.stringify(composition));
    },
    saveRecords: async (records) => {
      const saved = read(recordsKey(ownerId), prototypeRecordsSchema);
      write(recordsKey(ownerId), JSON.stringify(mergeRecords(saved, records)));
    },
  };
}
