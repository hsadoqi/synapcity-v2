import type { DashboardStorage } from '../contracts';
import { browserDashboardStorage } from '../frontend/storage';

/**
 * The browser adapter over an in-memory Storage, for tests and stories, so
 * they exercise the real validation and keys without touching saved data.
 */
export function memoryDashboardStorage(
  ownerId: string,
  seed: Record<string, string> = {},
): DashboardStorage & { raw: Map<string, string> } {
  const raw = new Map(Object.entries(seed));
  const storage = {
    getItem: (key: string) => raw.get(key) ?? null,
    setItem: (key: string, value: string) => void raw.set(key, value),
    removeItem: (key: string) => void raw.delete(key),
    clear: () => raw.clear(),
    key: (index: number) => [...raw.keys()][index] ?? null,
    get length() {
      return raw.size;
    },
  } satisfies Storage;
  return { ...browserDashboardStorage({ ownerId, storage }), raw };
}
