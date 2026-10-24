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

/**
 * One of the owner's Spaces with the documents and dashboards taking part in
 * it, or `null` when there is no such Space; the host decides what a missing
 * Space looks like (C4). A Space with none shows empty states; sample items
 * exist only in the host's fixture-mode source.
 */
export async function getSpace(
  source: SpaceSource,
  spaceId: string,
): Promise<Space | null> {
  const spaceEntity = await source.find(spaceId);
  if (!spaceEntity) return null;

  const [documentRecords, dashboardRecords] = await Promise.all([
    source.listDocuments(spaceId),
    source.listDashboards(spaceId),
  ]);
  const documents: DocumentItem[] = documentRecords.map((record) =>
    asItem(record, 'document'),
  );
  const dashboards: DashboardItem[] = dashboardRecords.map((record) =>
    asItem(record, 'dashboard'),
  );

  return {
    ...spaceEntity,
    kind: 'space',
    documents,
    dashboards,
    documentsTotal: documents.length,
    dashboardsTotal: dashboards.length,
  };
}
