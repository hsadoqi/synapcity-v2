import type { SpaceSummary } from '../../shared/types';
import { SpacesHeader } from './spaces-header';
import { SpacesIndex } from './spaces-index';

interface SpacesCollectionProps {
  spaces: SpaceSummary[];
  userId: string;
}

export function SpacesCollection({ spaces, userId }: SpacesCollectionProps) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-8 lg:py-12">
      <SpacesHeader />
      {/* No create button until creating a space exists; one that does nothing is worse than none. */}
      <SpacesIndex
        spaces={spaces}
        userId={userId}
        now={new Date().toISOString()}
      />
    </div>
  );
}
