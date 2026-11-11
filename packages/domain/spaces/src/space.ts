import type { z } from 'zod';
import {
  baseRecordCreateSchema,
  baseRecordMetadataSchema,
  baseRecordSchema,
  boundedIconSchema,
  boundedNameSchema,
  recordPatchSchema,
} from '@synapcity/domain-records';

// The Space's own wording (README and tests pin it). Record-wide messages live in
// `RECORD_MESSAGES` in domain-records; only what is specific to a Space is here.
// The write schemas (create, update) use it; the saved-record schema is the
// base record contract unchanged, so a read reports the base wording.
const SPACE_MESSAGES = {
  blankName: 'Enter a space name.',
  badIcon: 'Use a Lucide icon name.',
} as const;

const spaceNameSchema = boundedNameSchema(SPACE_MESSAGES.blankName);
const spaceIconSchema = boundedIconSchema(SPACE_MESSAGES.badIcon);

const spaceMetadataSchema = baseRecordMetadataSchema.extend({
  name: spaceNameSchema,
  icon: spaceIconSchema,
});

/**
 * The editable Space fields, with the D5 limits and the Space wording. Strict
 * like the base input: server-managed fields (id, owner, times) are refused,
 * not dropped. To start from a saved Space, project it with `editableFieldsOf`.
 */
export const createSpaceSchema = baseRecordCreateSchema.extend({
  name: spaceNameSchema,
  icon: spaceIconSchema.optional(),
});

/** A partial edit of a Space: at least one field, Space wording, strict. */
export const updateSpaceSchema = recordPatchSchema(spaceMetadataSchema);

/**
 * Saved-record contract for ADR-0012. Database adapters must map owner_id,
 * created_at and updated_at to these camelCase fields. Space remains
 * a provisional label; content relationships and lifecycle stay undecided.
 */
export const spaceSchema = baseRecordSchema;

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
