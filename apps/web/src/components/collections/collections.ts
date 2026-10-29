import { FileText, Layers, LayoutDashboard } from 'lucide-react';

import { COLLECTION_LABELS } from './collection-labels';
import type { SidebarRecords } from '../../lib/sidebar-records';
import {
  dashboardPathFor,
  dashboardsPathFor,
  documentPathFor,
  documentsPathFor,
  spacePathFor,
  spacesPathFor,
} from '../../lib/routing/user-paths';

/** A kind of record someone can create and browse. */
export type CollectionKind = 'space' | 'document' | 'dashboard';

/** One collection as the sidebar, palette and quick-create dialog describe it. */
export type Collection = {
  kind: CollectionKind;
  records: keyof SidebarRecords;
  /** The collection's name, such as "Spaces". */
  label: string;
  /** One of it, lower case, such as "space". */
  singular: string;
  icon: typeof FileText;
  indexHref: (userId: string) => string;
  /** One record's page, or null while that page is not built. */
  itemHref: ((userId: string, id: string) => string) | null;
};

/** The three collections, in the order the sidebar lists them. */
export const COLLECTIONS: readonly Collection[] = [
  {
    kind: 'space',
    records: 'spaces',
    label: COLLECTION_LABELS.spaces,
    singular: 'space',
    icon: Layers,
    indexHref: spacesPathFor,
    itemHref: spacePathFor,
  },
  {
    kind: 'document',
    records: 'documents',
    label: COLLECTION_LABELS.documents,
    singular: 'document',
    icon: FileText,
    indexHref: documentsPathFor,
    itemHref: documentPathFor,
  },
  {
    kind: 'dashboard',
    records: 'dashboards',
    label: COLLECTION_LABELS.dashboards,
    singular: 'dashboard',
    icon: LayoutDashboard,
    indexHref: dashboardsPathFor,
    itemHref: dashboardPathFor,
  },
];

export const collectionFor = (kind: CollectionKind): Collection =>
  COLLECTIONS.find((collection) => collection.kind === kind)!;
