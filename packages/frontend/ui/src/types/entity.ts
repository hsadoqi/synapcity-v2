import type { z } from 'zod';

import type {
  createSpaceSchema,
  spaceSchema,
  updateSpaceSchema,
} from '@synapcity/frontend-ui/types/entity-schema';

export type SpaceEntity = z.infer<typeof spaceSchema>;
export type CreateSpaceInput = z.infer<typeof createSpaceSchema>;
export type UpdateSpaceInput = z.infer<typeof updateSpaceSchema>;

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
