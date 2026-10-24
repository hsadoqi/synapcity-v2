import type { z } from 'zod';

import type {
  createSpaceSchema,
  spaceSchema,
  updateSpaceSchema,
} from '../schemas';

export type SpaceEntity = z.infer<typeof spaceSchema>;
export type CreateSpaceInput = z.infer<typeof createSpaceSchema>;
export type UpdateSpaceInput = z.infer<typeof updateSpaceSchema>;

/**
 * A space as the index lists it: the saved record plus how many documents and
 * dashboards take part in it. The counts are derived, not stored on the space.
 */
export type SpaceSummary = SpaceEntity & {
  documentsTotal: number;
  dashboardsTotal: number;
};
