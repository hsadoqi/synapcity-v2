import type { CollectionItem } from '@synapcity/frontend-collection';

import { daysAgo } from '../fixture-clock';

export const dashboardFixtures: CollectionItem[] = [
  {
    id: 'dash-q4-overview',
    title: 'Q4 overview',
    subtitle:
      'Bets, milestones, and a quiet count of days left in the quarter.',
    updatedAt: daysAgo(0),
    createdAt: daysAgo(38),
    group: 'Q4 planning',
    tags: ['work'],
    pinned: true,
  },
  {
    id: 'dash-reading-pace',
    title: 'Reading pace',
    subtitle: 'Pages per week and the shelf of books waiting their turn.',
    updatedAt: daysAgo(3),
    createdAt: daysAgo(200),
    group: 'Reading list',
    tags: ['books', 'stats'],
    pinned: false,
  },
  {
    id: 'dash-habits',
    title: 'Habit garden',
    subtitle: 'Streaks for sleep, walks, and water, without the guilt.',
    updatedAt: daysAgo(1),
    createdAt: daysAgo(140),
    group: 'Health',
    tags: ['habits'],
    pinned: true,
  },
  {
    id: 'dash-budget',
    title: 'Home budget',
    subtitle:
      'Monthly spend at a glance, grouped the way we actually think about it.',
    updatedAt: daysAgo(7),
    createdAt: daysAgo(365),
    group: 'Home',
    tags: ['money'],
    pinned: false,
  },
  {
    id: 'dash-hiring',
    title: 'Hiring pipeline',
    subtitle: 'Candidates by stage, with notes from each conversation.',
    updatedAt: daysAgo(4),
    createdAt: daysAgo(30),
    group: 'Q4 planning',
    tags: ['people'],
    pinned: false,
  },
  {
    id: 'dash-garden-weather',
    title: 'Garden weather',
    subtitle: 'Rainfall, frost risk, and when to finally plant the beans.',
    updatedAt: daysAgo(15),
    createdAt: daysAgo(100),
    group: 'Garden journal',
    tags: ['seasonal'],
    pinned: false,
  },
];
