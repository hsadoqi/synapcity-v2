import { dashboardCompositionSchema } from '@synapcity/domain-dashboards';
import { prototypeRecordsSchema } from '@synapcity/domain-prototypes';
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

/**
 * Saves dashboards in the browser, one copy per owner. Storage that throws
 * (private mode, quota, blocked) never throws into React; saved data is
 * validated on load, and a value that fails is copied to `<key>.invalid` and
 * treated as not saved, so nothing is overwritten silently.
 */
export function browserDashboardStorage({
  ownerId,
  onError = () => {},
  storage,
}: BrowserDashboardStorageOptions): DashboardStorage {
  const store = () => storage ?? window.localStorage;

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
    write(`${key}.invalid`, raw);
    onError({ kind: 'invalid', key, cause });
    return null;
  }

  function write(key: string, value: string) {
    try {
      store().setItem(key, value);
    } catch (cause) {
      onError({ kind: 'write', key, cause });
    }
  }

  return {
    load: async (dashboardId) => ({
      composition: read(
        compositionKey(ownerId, dashboardId),
        dashboardCompositionSchema,
      ),
      records: read(recordsKey(ownerId), prototypeRecordsSchema),
    }),
    saveComposition: async (dashboardId, composition) =>
      write(compositionKey(ownerId, dashboardId), JSON.stringify(composition)),
    saveRecords: async (records) =>
      write(recordsKey(ownerId), JSON.stringify(records)),
  };
}
