import type { BaseRecord } from '@synapcity/domain-records';

import type { DashboardItem, DocumentItem, Space } from '../../contracts';
import type { SpaceSource } from '../types';

/** A participating record as the detail page lists it. */
function asItem<Kind extends 'document' | 'dashboard'>(
  record: BaseRecord,
  kind: Kind,
) {
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    updatedAt: record.updatedAt,
    createdAt: record.createdAt,
    icon: record.icon,
    kind,
  };
}

type ItemRecords = {
  documents: BaseRecord[];
  dashboards: BaseRecord[];
  failed: boolean;
};

/** What takes part in the Space; a failed read gives empty lists and `failed`. */
async function readItems(
  source: SpaceSource,
  spaceId: string,
  onItemsError: (error: unknown) => void,
): Promise<ItemRecords> {
  try {
    const [documents, dashboards] = await Promise.all([
      source.listDocuments(spaceId),
      source.listDashboards(spaceId),
    ]);
    return { documents, dashboards, failed: false };
  } catch (error) {
    onItemsError(error);
    return { documents: [], dashboards: [], failed: true };
  }
}

export type GetSpaceOptions = {
  /**
   * Told when what takes part in the Space could not be read; the Space is
   * still returned, marked `itemsUnavailable`. The host logs it, as packages
   * never log.
   */
  onItemsError?: (error: unknown) => void;
};

/**
 * One of the owner's Spaces with the documents and dashboards taking part in
 * it, or `null` when there is no such Space; the host decides what a missing
 * Space looks like (C4). The Space and its items are read at once: for a
 * missing Space the item reads find nothing (row-level security, or no
 * participation rows) and their result is discarded. A failure to read the
 * Space itself propagates; a failure to read its items does not hide the
 * Space. Sample items exist only in the host's fixture-mode source.
 */
export async function getSpace(
  source: SpaceSource,
  spaceId: string,
  { onItemsError = () => {} }: GetSpaceOptions = {},
): Promise<Space | null> {
  const [spaceEntity, items] = await Promise.all([
    source.find(spaceId),
    readItems(source, spaceId, onItemsError),
  ]);
  if (!spaceEntity) return null;

  const documents: DocumentItem[] = items.documents.map((record) =>
    asItem(record, 'document'),
  );
  const dashboards: DashboardItem[] = items.dashboards.map((record) =>
    asItem(record, 'dashboard'),
  );

  return {
    ...spaceEntity,
    kind: 'space',
    documents,
    dashboards,
    documentsTotal: documents.length,
    dashboardsTotal: dashboards.length,
    ...(items.failed ? { itemsUnavailable: true as const } : {}),
  };
}
