import type { SpaceSummary } from '@synapcity/domain-records';

import { getSpaceSource } from '../space-source';

/** The signed-in owner's spaces with their document and dashboard counts. */
export async function getSpaces(): Promise<SpaceSummary[]> {
  return (await getSpaceSource()).listSummaries();
}
