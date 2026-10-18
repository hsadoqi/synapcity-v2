import { notFound } from 'next/navigation';

import { spaceItem as sampleSpace } from '../../lib/fixtures';
import type { Space } from '../../shared/types';
import { findSpace } from '../space-repository';

export async function getSpace(spaceId: string): Promise<Space> {
  const spaceEntity = await findSpace(spaceId);
  if (!spaceEntity) notFound();

  // Placeholder until documents and dashboards are persisted (ADR-0013).
  const documents = sampleSpace.documents;
  const dashboards = sampleSpace.dashboards;

  return {
    ...spaceEntity,
    kind: 'space',
    documents: documents.map((doc) => ({ ...doc, kind: 'document' as const })),
    dashboards: dashboards.map((dash) => ({
      ...dash,
      kind: 'dashboard' as const,
    })),
    documentsTotal: documents.length,
    dashboardsTotal: dashboards.length,
  };
}
