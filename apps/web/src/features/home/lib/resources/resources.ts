import type {
  CollectionTabDefinition,
  CollectionViewConfig,
} from '@synapcity/frontend-collection';
import type { CollectionItem } from '@synapcity/frontend-collection';

import { DASHBOARDS } from './dashboards';
import { dashboardFixtures } from './dashboards.fixtures';
import { DOCUMENTS } from './documents';
import { documentFixtures } from './documents.fixtures';
import type { ResourceConfig } from './resource-config';
import { SPACES } from './spaces';
import { spaceFixtures } from './spaces.fixtures';

/**
 * The resources home shows, assembled from one config file per resource. Each
 * resource will move into its own feature once its name is decided; until
 * then they live here, because home is their only consumer.
 */
export type HomeResource = 'spaces' | 'documents' | 'dashboards';

/** Whether a collection is shown across everything or inside one space. */
export type HomeScope =
  { kind: 'global' } | { kind: 'space'; spaceName: string };

const RESOURCES: Record<HomeResource, ResourceConfig> = {
  spaces: SPACES,
  documents: DOCUMENTS,
  dashboards: DASHBOARDS,
};

export const FIXTURES: Record<HomeResource, CollectionItem[]> = {
  spaces: spaceFixtures,
  documents: documentFixtures,
  dashboards: dashboardFixtures,
};

/** The resource-specific CollectionView props for one resource in one scope. */
function resourceViewConfig(
  resource: HomeResource,
  scope: HomeScope,
  spaceNames: string[],
): CollectionViewConfig {
  const { labels, icon, emptyCopy } = RESOURCES[resource];

  return {
    labels,
    icon,
    context: scope.kind === 'space' ? scope.spaceName : undefined,
    // Filtering by space only makes sense across spaces, and never for spaces themselves.
    grouping:
      scope.kind === 'global' && resource !== 'spaces'
        ? { label: 'Space', options: spaceNames }
        : undefined,
    emptyState: {
      title: emptyCopy.title,
      description:
        scope.kind === 'space' && resource !== 'spaces'
          ? emptyCopy.space(scope.spaceName)
          : emptyCopy.global,
    },
  };
}

/** One collection tab per resource, described for the given scope. */
export function resourceTabs(
  resources: HomeResource[],
  scope: HomeScope,
  items: Partial<Record<HomeResource, CollectionItem[]>>,
  spaceNames: string[] = [],
): CollectionTabDefinition[] {
  return resources.map((resource) => ({
    id: resource,
    label: RESOURCES[resource].labels.plural,
    view: resourceViewConfig(resource, scope, spaceNames),
    items: items[resource] ?? [],
  }));
}
