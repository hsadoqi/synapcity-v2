'use client';

import { LoadingRegion } from '@synapcity/frontend-ui/components/loading-region';
import { toast } from '@synapcity/frontend-ui/core/toast';

import {
  CollectionTabs,
  CreateActions,
  FeaturedItems,
} from '@/features/collection/components';

import { FIXTURE_NOW } from '../../lib/fixture-clock';
import { fixtureDate } from '../../lib/overview.fixtures';
import { FIXTURES, resourceTabs } from '../../lib/resources/resources';
import { SPACE_NAMES } from '../../lib/resources/spaces.fixtures';
import type { HomePageProps } from '../../lib/types';
import { HomeEmptyState } from '../home-empty-state';
import { HomeOverview, HomeOverviewSkeleton } from './home-overview';
import { HomePageHeader } from './home-page-header';
import {
  CREATE_ACTIONS,
  ITEM_KINDS,
  OVERVIEW_SECTIONS,
} from '../../lib/overview';

/**
 * The home page: the empty state until there is history, then the header and
 * the overview, with the spaces, documents and dashboards as tabs beside it.
 */
export function HomePageView({
  state = 'populated',
  items = [],
  pinned = [],
  dateLabel = fixtureDate.label,
  dateTime = fixtureDate.dateTime,
  userId,
}: HomePageProps) {
  const hasHistory = items.length > 0 || pinned.length > 0;

  return (
    <div className="flex flex-1 flex-col">
      {state === 'empty' || (state === 'populated' && !hasHistory) ? (
        <HomeEmptyState
          singular="space"
          onCreate={() => {
            toast.add({ title: 'New space created', type: 'success' });
          }}
        />
      ) : (
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4 py-8 sm:px-6 sm:py-12">
          <HomePageHeader dateLabel={dateLabel} dateTime={dateTime} />
          {state === 'loading' ? (
            <LoadingRegion label="Loading your recent work">
              <HomeOverviewSkeleton />
            </LoadingRegion>
          ) : (
            <>
              <FeaturedItems
                {...OVERVIEW_SECTIONS.continue}
                items={items.slice(0, 3)}
                kinds={ITEM_KINDS}
                now={FIXTURE_NOW}
              />
              <CollectionTabs
                tabs={resourceTabs(
                  ['spaces', 'documents', 'dashboards'],
                  { kind: 'global' },
                  FIXTURES,
                  SPACE_NAMES,
                )}
                now={FIXTURE_NOW}
                userId={userId}
                barActions={
                  <CreateActions
                    {...OVERVIEW_SECTIONS.start}
                    actions={CREATE_ACTIONS}
                    onCreate={(kind) => {
                      toast.add({
                        type: 'success',
                        title: `Created new ${kind}`,
                      });
                    }}
                  />
                }
                onCreate={(tabId) => {
                  toast.add({ type: 'success', title: `Created new ${tabId}` });
                }}
              >
                <HomeOverview items={items} pinned={pinned} />
              </CollectionTabs>
            </>
          )}
        </div>
      )}
    </div>
  );
}
