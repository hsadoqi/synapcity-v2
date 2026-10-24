import type { SpaceSummary } from '@synapcity/domain-records';
import { listSpaceSummaries } from '../space-repository';

/** The signed-in owner's spaces with their document and dashboard counts. */
export async function getSpaces(): Promise<SpaceSummary[]> {
  return listSpaceSummaries();
}
