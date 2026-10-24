import type { SpaceEntity } from '@synapcity/domain-records';

/** What can take part in a Space (ADR-0013). */
export type SpaceEntityItemKind = 'document' | 'dashboard';

/** A document taking part in a Space, as the detail page lists it. */
export type DocumentItem = {
  id: string;
  name: string;
  description?: string;
  updatedAt: string;
  createdAt: string;
  icon: string;
  kind: SpaceEntityItemKind;
};

/** A dashboard taking part in a Space, as the detail page lists it. */
export type DashboardItem = {
  id: string;
  name: string;
  description?: string;
  updatedAt: string;
  createdAt: string;
  icon: string;
  kind: SpaceEntityItemKind;
};

export type SpaceItem = DocumentItem | DashboardItem;

/** One Space with what takes part in it: the detail page's view model. */
export type Space = SpaceEntity & {
  kind: 'space';
  documents: DocumentItem[];
  dashboards: DashboardItem[];
  documentsTotal: number;
  dashboardsTotal: number;
};
