import {
  FileText,
  FilePlus,
  FolderPlus,
  LayoutDashboard,
  Pin,
} from 'lucide-react';

import type {
  CollectionKinds,
  CreateAction,
} from '@/features/collection/components';

/**
 * Home's configuration for the collection displays on its overview: the words,
 * the item kinds and what can be created. The displays themselves live in
 * `features/collection`.
 */

/** How the overview shows each kind of item. */
export const ITEM_KINDS: CollectionKinds = {
  document: { icon: FileText, label: 'Document' },
  dashboard: { icon: LayoutDashboard, label: 'Dashboard' },
};

export const CREATE_ACTIONS: CreateAction[] = [
  { id: 'document', label: 'New document', icon: FilePlus },
  { id: 'dashboard', label: 'New dashboard', icon: LayoutDashboard },
  { id: 'space', label: 'New space', icon: FolderPlus },
];

/** Headings and empty messages, shared by each section and its skeleton. */
export const OVERVIEW_SECTIONS = {
  start: { id: 'start-heading', heading: 'Start something' },
  continue: {
    id: 'continue-heading',
    heading: 'Pick up where you left off',
    emptyMessage:
      "Once you've opened something, you'll be able to step right back into it from here.",
  },
  pinned: {
    id: 'pinned-heading',
    heading: 'Pinned',
    headingIcon: Pin,
    emptyMessage: 'Nothing pinned yet. Pin a page to keep it within reach.',
  },
  recent: {
    id: 'recent-heading',
    heading: 'Recent',
    emptyMessage: 'Pages you open will quietly gather here.',
  },
} as const;
