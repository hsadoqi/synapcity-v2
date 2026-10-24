'use client';

import { useMemo } from 'react';
import { Shapes } from 'lucide-react';

import {
  CollectionIndex,
  type SetPinnedResult,
} from '@synapcity/frontend-collection';
import type {
  CollectionItem,
  CollectionItemAction,
} from '@synapcity/frontend-collection';

import type { SpaceSummary } from '@synapcity/domain-records';

import type { SetSpacePinnedResult } from '../../../contracts';
import { toCollectionItem } from '../../utils';
import { SpacePreview } from '../space-preview';

interface SpacesIndexProps {
  spaces: SpaceSummary[];
  userId: string;
  /** The moment the page was rendered, so server and browser label dates alike. */
  now: string;
  setSpacePinned: (
    spaceId: string,
    pinned: boolean,
  ) => Promise<SetSpacePinnedResult>;
}

const LABELS = { singular: 'space', plural: 'Spaces' };

/** Spaces have no rename, duplicate or delete flow yet; offering them would be offering nothing. */
const SPACE_ACTIONS: CollectionItemAction[] = ['open', 'toggle-pin'];

const EMPTY_STATE = {
  title: 'No spaces yet',
  description:
    'A space is a quiet room for one idea, project, or season. Start with whatever is on your mind today.',
};

/** The spaces index: the shared browse page, filled with spaces. */
export function SpacesIndex({
  spaces,
  userId,
  now,
  setSpacePinned,
}: SpacesIndexProps) {
  const items = useMemo<CollectionItem[]>(
    () => spaces.map((space) => toCollectionItem(space, userId)),
    [spaces, userId],
  );

  return (
    <CollectionIndex
      items={items}
      now={now}
      labels={LABELS}
      icon={Shapes}
      heading="All spaces"
      recentHeading="Recently used"
      pinnedHeading="Pinned"
      pinnedEmptyMessage="Pin a space from its menu to keep it here."
      emptyState={EMPTY_STATE}
      actions={SPACE_ACTIONS}
      renderPreview={(item) => <SpacePreview item={item} />}
      onSetPinned={async (id, pinned): Promise<SetPinnedResult> => {
        const result = await setSpacePinned(id, pinned);
        return result.ok ? { ok: true } : { ok: false, error: result.error };
      }}
    />
  );
}
