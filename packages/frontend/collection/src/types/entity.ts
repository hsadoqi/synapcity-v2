import type { SpaceEntity } from '@synapcity/domain-records';

export type EntityKind = 'space' | 'document' | 'dashboard';
export type SpaceEntityItemKind = Exclude<EntityKind, 'space'>;

export type Space = SpaceEntity & {
  kind: EntityKind;
  documents: DocumentItem[];
  dashboards: DashboardItem[];
  documentsTotal: number;
  dashboardsTotal: number;
};

export type DashboardItem = {
  id: string;
  name: string;
  description?: string;
  updatedAt: string;
  createdAt: string;
  icon: string;
  kind: SpaceEntityItemKind;
};

export type DocumentItem = {
  id: string;
  name: string;
  description?: string;
  updatedAt: string;
  createdAt: string;
  icon: string;
  kind: SpaceEntityItemKind;
};

export type SpaceItem = DocumentItem | DashboardItem;
export type EntityItem = Space | SpaceItem;
