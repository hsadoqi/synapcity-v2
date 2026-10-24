import { CollectionPageSkeleton } from '@synapcity/frontend-collection';

import { SPACES_INTRO, SPACES_TITLE } from './spaces-copy';

/** The spaces page while its spaces load. */
export function SpacesCollectionSkeleton() {
  return (
    <CollectionPageSkeleton
      title={SPACES_TITLE}
      intro={SPACES_INTRO}
      loadingLabel="Loading spaces"
    />
  );
}
