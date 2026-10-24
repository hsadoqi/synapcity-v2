import type { CollectionItem } from '@synapcity/frontend-collection';

import { daysAgo } from '../fixture-clock';

export const SPACE_NAMES = [
  'Q4 planning',
  'Reading list',
  'Home',
  'Garden journal',
  'Studio',
  'Health',
  'Travel: Lisbon',
  'Weekly rituals',
];

export const spaceFixtures: CollectionItem[] = [
  {
    id: 'spc-q4',
    title: 'Q4 planning',
    subtitle: 'Goals, bets, and the small things that keep the quarter honest.',
    updatedAt: daysAgo(0),
    createdAt: daysAgo(64),
    tags: ['work', 'planning'],
    pinned: true,
  },
  {
    id: 'spc-reading',
    title: 'Reading list',
    subtitle:
      'Books in progress, highlights worth keeping, and the pile by the bed.',
    updatedAt: daysAgo(2),
    createdAt: daysAgo(310),
    tags: ['books'],
    pinned: true,
  },
  {
    id: 'spc-home',
    title: 'Home',
    subtitle:
      'Repairs, routines, and the running list of things to fix someday.',
    updatedAt: daysAgo(4),
    createdAt: daysAgo(400),
    tags: ['life'],
    pinned: false,
  },
  {
    id: 'spc-garden',
    title: 'Garden journal',
    subtitle:
      'Planting notes, frost dates, and what the tomatoes taught me this year.',
    updatedAt: daysAgo(9),
    createdAt: daysAgo(180),
    tags: ['outdoors', 'seasonal'],
    pinned: false,
  },
  {
    id: 'spc-studio',
    title: 'Studio',
    subtitle: 'Sketches, half-ideas, and references for the next print run.',
    updatedAt: daysAgo(12),
    createdAt: daysAgo(220),
    tags: ['creative'],
    pinned: false,
  },
  {
    id: 'spc-health',
    title: 'Health',
    subtitle: 'Sleep, movement, and appointments, gently tracked.',
    updatedAt: daysAgo(18),
    createdAt: daysAgo(500),
    tags: ['life', 'habits'],
    pinned: false,
  },
  {
    id: 'spc-lisbon',
    title: 'Travel: Lisbon',
    subtitle:
      'Itinerary, café shortlist, and a packing list that is mostly shoes.',
    updatedAt: daysAgo(33),
    createdAt: daysAgo(90),
    tags: ['travel'],
    pinned: false,
  },
  {
    id: 'spc-rituals',
    title: 'Weekly rituals',
    subtitle: 'Reviews, resets, and the Sunday checklist.',
    updatedAt: daysAgo(1),
    createdAt: daysAgo(260),
    tags: ['habits'],
    pinned: true,
  },
];
