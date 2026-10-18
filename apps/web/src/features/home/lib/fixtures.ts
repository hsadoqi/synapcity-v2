import type { CollectionItem } from '@/features/collection/shared';

/** The fixture clock: the overview's "2h ago" labels are measured from it. */
export const OVERVIEW_NOW = new Date('2026-10-10T10:45:00Z');

export const fixtureDate = {
  label: 'Saturday, October 10',
  dateTime: '2026-10-10',
};

const items: Omit<CollectionItem, 'tags' | 'pinned'>[] = [
  {
    id: 'doc-q4-narrative',
    title: 'Q4 planning: narrative draft',
    kind: 'document',
    group: 'Company',
    updatedAt: '2026-10-10T08:12:00Z',
  },
  {
    id: 'dash-fundraise',
    title: 'Fundraising pipeline',
    kind: 'dashboard',
    group: 'Fundraise',
    updatedAt: '2026-10-10T05:40:00Z',
  },
  {
    id: 'doc-interviews',
    title: 'Onboarding interviews: synthesis',
    kind: 'document',
    group: 'Research',
    updatedAt: '2026-10-09T16:20:00Z',
  },
  {
    id: 'dash-weekly-metrics',
    title: 'Weekly metrics',
    kind: 'dashboard',
    group: 'Operations',
    updatedAt: '2026-10-09T09:05:00Z',
  },
  {
    id: 'doc-pricing-rewrite',
    title: 'Pricing page rewrite',
    kind: 'document',
    group: 'Marketing',
    updatedAt: '2026-10-08T14:30:00Z',
  },
  {
    id: 'doc-hiring-plan',
    title: 'Hiring plan 2027',
    kind: 'document',
    group: 'Team',
    updatedAt: '2026-10-07T11:00:00Z',
  },
  {
    id: 'dash-runway',
    title: 'Runway and burn',
    kind: 'dashboard',
    group: 'Finance',
    updatedAt: '2026-10-06T17:45:00Z',
  },
  {
    id: 'doc-advisor-call',
    title: 'Notes from advisor call with Priya',
    kind: 'document',
    group: 'Company',
    updatedAt: '2026-10-02T15:10:00Z',
  },
];

const pinnedIds = [
  'dash-weekly-metrics',
  'dash-runway',
  'doc-hiring-plan',
  'dash-fundraise',
];

export const fixtureItems: CollectionItem[] = items.map((item) => ({
  ...item,
  tags: [],
  pinned: pinnedIds.includes(item.id),
}));

export const fixturePinned: CollectionItem[] = pinnedIds
  .map((id) => fixtureItems.find((item) => item.id === id))
  .filter((item): item is CollectionItem => Boolean(item));
