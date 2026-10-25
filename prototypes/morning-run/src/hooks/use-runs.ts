import { useMemo } from 'react';

import { BUILT_IN_RUNS } from '@/lib/runs/catalog';
import type { Run } from '@/lib/runs/schema';
import { customRunsStore } from '@/lib/storage/stores';
import { useStore } from '@/lib/storage/persisted-store';

export const CUSTOM_GROUP = 'My runs';

/** Built-in runs followed by the ones you made. */
export function useAllRuns(): Run[] {
  const [custom] = useStore(customRunsStore);
  return useMemo(() => [...BUILT_IN_RUNS, ...custom], [custom]);
}

export function useRunById(id: string): Run | undefined {
  const runs = useAllRuns();
  return useMemo(() => runs.find((r) => r.id === id), [runs, id]);
}
