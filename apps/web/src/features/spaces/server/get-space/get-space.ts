import type { BaseRecord } from '@synapcity/domain-records';
import { notFound } from 'next/navigation';

import type { DashboardItem, DocumentItem, Space } from '../../shared/types';
import { getSpaceSource } from '../space-source';

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
 * it. A Space with none shows empty states; sample items exist only in the
 * fixture source.
 */
export async function getSpace(spaceId: string): Promise<Space> {
  const source = await getSpaceSource();
  const spaceEntity = await source.find(spaceId);
  if (!spaceEntity) notFound();

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
