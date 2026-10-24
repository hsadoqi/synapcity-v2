import { CollectionPage } from '@/features/collection/components/collection-page';

import type { SpaceSummary } from '@synapcity/domain-records';
import { SPACES_INTRO, SPACES_TITLE } from './spaces-copy';
import { SpacesIndex } from './spaces-index';

interface SpacesCollectionProps {
  spaces: SpaceSummary[];
  userId: string;
}

export function SpacesCollection({ spaces, userId }: SpacesCollectionProps) {
  return (
    <CollectionPage title={SPACES_TITLE} intro={SPACES_INTRO}>
      {/* No create button until creating a space exists; one that does nothing is worse than none. */}
      <SpacesIndex
        spaces={spaces}
        userId={userId}
        now={new Date().toISOString()}
      />
    </CollectionPage>
  );
}
