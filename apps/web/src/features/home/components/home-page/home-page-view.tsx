'use client';

import { LoadingRegion } from '@synapcity/frontend-blocks';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@synapcity/frontend-ui/core/alert';

import {
  CollectionTabs,
  CreateActions,
  FeaturedItems,
} from '@synapcity/frontend-collection';

import type { CollectionKind } from '../../../../components/collections';
import { useQuickCreate } from '../../../../components/quick-create';

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

const KINDS: Record<string, CollectionKind> = {
  space: 'space',
  spaces: 'space',
  document: 'document',
  documents: 'document',
  dashboard: 'dashboard',
  dashboards: 'dashboard',
};

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
  sample = false,
}: HomePageProps) {
  const hasHistory = items.length > 0 || pinned.length > 0;
  const openCreate = useQuickCreate();
  // Create actions and tabs pass ids such as "document" or "spaces"; each
  // opens the shell's quick-create dialog, which says creating is not built yet.
  const create = (id: string) => {
    const kind = KINDS[id];
    if (kind) openCreate(kind);
  };

  return (
    // data-fill-viewport lets RootContent shrink to the space below the header,
    // so only this view scrolls, not <main>. Same pattern as the settings page.
    <div
      data-fill-viewport
      // A scroller is not a tab stop in every browser (Safari); this makes it
      // one, so the keyboard can scroll. The ring sits inside: overflow clips it.
      tabIndex={0}
      className="scroll-fade-y flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto outline-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:-outline-offset-2 focus-visible:outline-ring"
    >
      {state === 'empty' || (state === 'populated' && !hasHistory) ? (
        <HomeEmptyState singular="space" onCreate={() => openCreate('space')} />
      ) : (
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4 py-8 sm:px-6 sm:py-12">
          <HomePageHeader dateLabel={dateLabel} dateTime={dateTime} />
          {sample && (
            <Alert>
              <AlertTitle>This is sample content</AlertTitle>
              <AlertDescription>
                Home does not read your own work yet. The items below show how
                it will look; your spaces are in the sidebar.
              </AlertDescription>
            </Alert>
          )}
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
                    onCreate={create}
                  />
                }
                onCreate={create}
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
