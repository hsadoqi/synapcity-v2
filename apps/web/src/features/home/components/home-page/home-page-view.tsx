'use client';

import { LoadingRegion } from '@synapcity/frontend-ui/components/loading-region';

import { CollectionTabs } from '@/features/collection/components';

import { FIXTURE_NOW } from '../../lib/resources/fixture-clock';
import { FIXTURES, resourceTabs } from '../../lib/resources/resources';
import { SPACE_NAMES } from '../../lib/resources/spaces.fixtures';
import { fixtureDate } from '../../lib/fixtures';
import type { HomePageProps } from '../../lib/types';
import { EmptyPageLayout } from '../empty-page';
import { HomePageHeader } from './home-page-header';
import {
  HomePageSections,
  HomePageSectionsSkeleton,
} from './home-page-sections';
import { toast } from '@synapcity/frontend-ui/core/toast';

export function HomePageView({
  state,
  items = [],
  pinned = [],
  dateLabel = fixtureDate.label,
  dateTime = fixtureDate.dateTime,
}: HomePageProps) {
  const hasHistory = items.length > 0 || pinned.length > 0;
  if (state === 'empty' || (state === 'populated' && !hasHistory)) {
    return (
      <EmptyPageLayout
        onCreate={() => {
          toast.add({
            title: 'New space created',
            type: 'success',
          });
        }}
        singular="space"
      />
    );
  }

  return (
    <div className="mx-auto flex w-full flex-1 flex-col gap-10 px-4 py-8 sm:px-6 sm:py-12 max-w-6xl">
      <HomePageHeader dateLabel={dateLabel} dateTime={dateTime} />
      {state === 'loading' ? (
        <LoadingRegion label="Loading your recent work">
          <HomePageSectionsSkeleton />
        </LoadingRegion>
      ) : (
        <CollectionTabs
          tabs={resourceTabs(
            ['spaces', 'documents', 'dashboards'],
            { kind: 'global' },
            FIXTURES,
            SPACE_NAMES,
          )}
          now={FIXTURE_NOW}
        >
          <HomePageSections items={items} pinned={pinned} />
        </CollectionTabs>
      )}
    </div>
  );
}
