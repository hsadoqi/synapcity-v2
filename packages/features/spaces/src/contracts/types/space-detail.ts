import type { SpaceEntity } from '@synapcity/domain-spaces';

/** A document taking part in a Space, as the detail page lists it. */
export type DocumentItem = {
  id: string;
  name: string;
  description?: string;
  updatedAt: string;
  createdAt: string;
  icon: string;
  kind: 'document';
};

/** A dashboard taking part in a Space, as the detail page lists it. */
export type DashboardItem = {
  id: string;
  name: string;
  description?: string;
  updatedAt: string;
  createdAt: string;
  icon: string;
  kind: 'dashboard';
};

/** One Space with what takes part in it: the detail page's view model. */
export type Space = SpaceEntity & {
  kind: 'space';
  documents: DocumentItem[];
  dashboards: DashboardItem[];
  documentsTotal: number;
  dashboardsTotal: number;
  /**
   * Set when what takes part in the Space could not be read. The lists are
   * then empty because they are unknown, not because the Space has nothing.
   */
  itemsUnavailable?: true;
};
