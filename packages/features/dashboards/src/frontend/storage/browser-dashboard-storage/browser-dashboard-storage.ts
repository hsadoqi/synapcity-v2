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
 * Saves dashboards in the browser, one copy per owner. Storage that throws
 * (private mode, quota, blocked) never throws into React; saved data is
 * validated on load, and a value that fails is copied to `<key>.invalid` and
 * treated as not saved. If that copy fails, loading rejects, so the only copy
 * is never overwritten. Records are merged by id on save (see `mergeRecords`).
 */
export function browserDashboardStorage({
  ownerId,
  onError = () => {},
  storage,
}: BrowserDashboardStorageOptions): DashboardStorage {
  const store = () => storage ?? window.localStorage;

  function write(key: string, value: string): boolean {
    try {
      store().setItem(key, value);
      return true;
    } catch (cause) {
      onError({ kind: 'write', key, cause });
      return false;
    }
  }

  function read<T>(key: string, schema: z.ZodType<T>): T | null {
    let raw: string | null;
    try {
      raw = store().getItem(key);
    } catch (cause) {
      onError({ kind: 'read', key, cause });
      return null;
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
    if (!write(`${key}.invalid`, raw)) throw new UnsafeToOverwrite(key);
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
      let saved: PrototypeRecords | null;
      try {
        saved = read(recordsKey(ownerId), prototypeRecordsSchema);
      } catch {
        return; // The saved records are invalid and could not be set aside: leave them.
      }
      write(recordsKey(ownerId), JSON.stringify(mergeRecords(saved, records)));
    },
  };
}
