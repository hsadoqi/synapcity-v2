import { FileText, LayoutDashboard } from 'lucide-react';

import type {
  CollectionEmptyCopy,
  CollectionGrouping,
  CollectionItem,
  CollectionKinds,
  CollectionLabels,
} from '../types';

/** Story-only sample data. Not part of the package's public interface. */

export const sampleNow = new Date('2026-10-20T12:00:00Z');
export const sampleNowIso = sampleNow.toISOString();

export const sampleItems: CollectionItem[] = [
  {
    id: 'd1',
    title: 'Launch plan',
    subtitle: 'Milestones and owners.',
    updatedAt: '2026-10-19T09:00:00Z',
    createdAt: '2026-10-01T09:00:00Z',
    group: 'Writing',
    kind: 'document',
    tags: ['planning', 'work'],
    pinned: true,
    icon: 'file-text',
    href: '/home/documents/d1',
    lastViewedAt: '2026-10-19T10:00:00Z',
    detail: '3 sections',
  },
  {
    id: 'd2',
    title: 'Reading notes',
    subtitle: 'Quotes and ideas from what I am reading.',
    updatedAt: '2026-10-18T08:00:00Z',
    createdAt: '2026-09-20T09:00:00Z',
    group: 'Learning',
    kind: 'document',
    tags: ['books'],
    pinned: false,
    icon: 'book-open',
    href: '/home/documents/d2',
    lastViewedAt: '2026-10-18T09:00:00Z',
  },
  {
    id: 'd3',
    title: 'Weekly review',
    subtitle: 'How the week went.',
    updatedAt: '2026-10-17T16:00:00Z',
    createdAt: '2026-08-01T09:00:00Z',
    group: 'Personal',
    kind: 'dashboard',
    tags: ['review'],
    pinned: true,
    icon: 'layout-dashboard',
    href: '/home/dashboards/d3',
  },
  {
    id: 'd4',
    title: 'Ideas',
    updatedAt: '2026-10-12T11:00:00Z',
    group: 'Writing',
    kind: 'document',
    tags: ['ideas', 'planning'],
    pinned: false,
    href: '/home/documents/d4',
  },
  {
    id: 'd5',
    title: 'Study plan',
    subtitle: 'What to learn next.',
    updatedAt: '2026-10-05T11:00:00Z',
    createdAt: '2026-10-01T11:00:00Z',
    group: 'Learning',
    kind: 'dashboard',
    tags: ['books', 'planning'],
    pinned: false,
    href: '/home/dashboards/d5',
  },
  {
    id: 'd6',
    title: 'Draft outline',
    updatedAt: '2026-09-28T11:00:00Z',
    group: 'Writing',
    kind: 'document',
    tags: ['ideas'],
    pinned: false,
    href: '/home/documents/d6',
  },
  {
    id: 'd7',
    title: 'Loose thought',
    updatedAt: '2026-09-02T11:00:00Z',
    kind: 'document',
    tags: [],
    pinned: false,
  },
];

export const sampleKinds: CollectionKinds = {
  document: { icon: FileText, label: 'Document' },
  dashboard: { icon: LayoutDashboard, label: 'Dashboard' },
};

export const sampleLabels: CollectionLabels = {
  singular: 'document',
  plural: 'Documents',
};

export const sampleEmptyCopy: CollectionEmptyCopy = {
  title: 'No documents yet',
  description: 'Create one to get started.',
};

export const sampleGrouping: CollectionGrouping = {
  label: 'Space',
  options: ['Writing', 'Learning', 'Personal'],
};

export const sampleTags = ['planning', 'books', 'ideas', 'review', 'work'];
