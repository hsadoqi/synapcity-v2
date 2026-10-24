import type { SpaceSummary } from '@synapcity/domain-records';
import {
  CollectionPage,
  CollectionPageSkeleton,
} from '@synapcity/frontend-collection';

import type { SetSpacePinnedResult } from '../../../contracts';
import { SpacesIndex } from '../spaces-index';

/** The page's heading and intro; shared with its skeleton so loading never changes the words. */
const SPACES_TITLE = 'Spaces';
const SPACES_INTRO =
  'Each space keeps related documents and dashboards in one place. The one you used last comes first.';

interface SpacesCollectionProps {
  spaces: SpaceSummary[];
  /** The owner's home address; every Space link is built under it. */
  homePath: string;
  /** The host's pin action; the index shows a change at once and saves it through this. */
  setSpacePinned: (
    spaceId: string,
    pinned: boolean,
  ) => Promise<SetSpacePinnedResult>;
  /** Where to sign in again when a pin fails because the session ended. */
  signInHref?: string;
}

export function SpacesCollection({
  spaces,
  homePath,
  setSpacePinned,
  signInHref,
}: SpacesCollectionProps) {
  return (
    <CollectionPage title={SPACES_TITLE} intro={SPACES_INTRO}>
      {/* No create button until creating a space exists; one that does nothing is worse than none. */}
      <SpacesIndex
        spaces={spaces}
        homePath={homePath}
        now={new Date().toISOString()}
        setSpacePinned={setSpacePinned}
        signInHref={signInHref}
      />
    </CollectionPage>
  );
}

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
