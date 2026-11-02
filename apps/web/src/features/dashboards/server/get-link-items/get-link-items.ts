import type {
  DashboardComposition,
  LinkSourceKind,
} from '@synapcity/domain-dashboards';
import { neededLinkKinds } from '@synapcity/domain-dashboards';
import type { BaseRecord } from '@synapcity/domain-records';
import type { DashboardLinkItem } from '@synapcity/features-dashboards/contracts';

import { getDocuments } from '@/features/documents/server/get-documents';
import { logFailure } from '@/lib/log-failure';
import { getSpaceSource } from '@/lib/spaces';

import { toLinkItems } from '../../lib/link-items';
import { getDashboards } from '../get-dashboards';

type ItemKind = DashboardLinkItem['kind'];

/** One source's outcome: its records, or a recorded failure. Never an empty list standing in for one. */
type LinkSourceOutcome =
  { ok: true; items: readonly BaseRecord[] } | { ok: false };

const ITEM_KIND: Record<LinkSourceKind, ItemKind> = {
  spaces: 'space',
  documents: 'document',
  dashboards: 'dashboard',
};

const READERS: Record<LinkSourceKind, () => Promise<readonly BaseRecord[]>> = {
  spaces: () => getSpaceSource().then((source) => source.listSummaries()),
  documents: () => getDocuments(),
  dashboards: () => getDashboards(),
};

/** Reads one source; a rejection becomes `{ ok: false }` and is logged by code only. */
async function readSource(kind: LinkSourceKind): Promise<LinkSourceOutcome> {
  try {
    return { ok: true, items: await READERS[kind]() };
  } catch (error) {
    logFailure(
      `getDashboardLinkItems ${kind}`,
      error as { code?: string; status?: number },
    );
    return { ok: false };
  }
}

/**
 * What the Pinned, Last opened and Spaces widgets list, and which sources could
 * not be read. Only the kinds the composition's link widgets show are fetched
 * (a null composition, as in browser fixture mode, fetches all three). A failed
 * source is reported in `unavailableKinds`, so its widgets say so; the others
 * still render. The kinds not read at all are `unloadedKinds`.
 */
export async function getDashboardLinkItems(
  userId: string,
  composition: DashboardComposition | null,
): Promise<{
  items: DashboardLinkItem[];
  unavailableKinds: ItemKind[];
  unloadedKinds: ItemKind[];
}> {
  const needed: LinkSourceKind[] = composition
    ? [...neededLinkKinds(composition)]
    : ['spaces', 'documents', 'dashboards'];
  const outcomes = await Promise.all(needed.map(readSource));

  const records: Record<ItemKind, readonly BaseRecord[]> = {
    space: [],
    document: [],
    dashboard: [],
  };
  const unavailableKinds: ItemKind[] = [];
  needed.forEach((kind, index) => {
    const outcome = outcomes[index]!;
    if (outcome.ok) records[ITEM_KIND[kind]] = outcome.items;
    else unavailableKinds.push(ITEM_KIND[kind]);
  });
  // Kinds nothing on the dashboard lists yet. A widget added later that needs
  // one loads after the next save (the workspace asks for a re-read).
  const unloadedKinds = (Object.keys(ITEM_KIND) as LinkSourceKind[])
    .filter((kind) => !needed.includes(kind))
    .map((kind) => ITEM_KIND[kind]);
  return {
    items: toLinkItems(userId, records),
    unavailableKinds,
    unloadedKinds,
  };
}
