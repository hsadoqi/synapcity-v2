import type { z } from 'zod';

import type {
  createSpaceSchema,
  spaceSchema,
  updateSpaceSchema,
} from '../schema';

export type Space = z.infer<typeof spaceSchema>;
export type CreateSpaceInput = z.infer<typeof createSpaceSchema>;
export type UpdateSpaceInput = z.infer<typeof updateSpaceSchema>;

export type EntityKind = 'space' | 'document' | 'dashboard';
export type SpaceItemKind = Omit<EntityKind, 'space'>;

export type SpaceItem = Space & {
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
  kind: SpaceItemKind;
};

export type DocumentItem = {
  id: string;
  name: string;
  description?: string;
  updatedAt: string;
  createdAt: string;
  icon: string;
  kind: SpaceItemKind;
};
