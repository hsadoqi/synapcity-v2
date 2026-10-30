import { z } from 'zod';

import {
  ICON_NAME_PATTERN,
  baseRecordInputSchema,
  baseRecordSchema,
  boundedIconSchema,
  boundedNameSchema,
  recordPatchSchema,
} from '@synapcity/domain-records';

// The Space's own wording (README and tests pin it). Record-wide messages live in
// `RECORD_MESSAGES` in domain-records; only what is specific to a Space is here,
// defined once and used by both the read and the write schema.
const SPACE_MESSAGES = {
  blankName: 'Enter a space name.',
  badIcon: 'Use a Lucide icon name.',
} as const;

// What is read back keeps no limit, so a Space saved before the limits existed
// still loads; what is written (`createSpaceSchema`) is bounded.
const name = z.string().trim().min(1, SPACE_MESSAGES.blankName);
// Store the Lucide identifier, never a React component or SVG markup.
const icon = z.string().regex(ICON_NAME_PATTERN, SPACE_MESSAGES.badIcon);

/**
 * The editable Space fields, with the D5 limits and the Space wording. Strict
 * like the base input: server-managed fields (id, owner, times) are refused,
 * not dropped. To start from a saved Space, project it with `editableFieldsOf`.
 */
export const createSpaceSchema = baseRecordInputSchema.extend({
  name: boundedNameSchema(SPACE_MESSAGES.blankName),
  icon: boundedIconSchema(SPACE_MESSAGES.badIcon),
});

/** A partial edit of a Space: at least one field, Space wording, strict. */
export const updateSpaceSchema = recordPatchSchema(createSpaceSchema);

/**
 * Saved-record contract for ADR-0012. Database adapters must map owner_id,
 * created_at and updated_at to these camelCase fields. Space remains
 * a provisional label; content relationships and lifecycle stay undecided.
 */
export const spaceSchema = baseRecordSchema.extend({ name, icon });
