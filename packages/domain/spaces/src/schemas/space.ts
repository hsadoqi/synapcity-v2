import { z } from 'zod';

import {
  ICON_NAME_PATTERN,
  baseRecordInputSchema,
  baseRecordSchema,
} from '@synapcity/domain-records';

const name = z.string().trim().min(1, 'Enter a space name.');
// Store the Lucide identifier, never a React component or SVG markup.
const icon = z.string().regex(ICON_NAME_PATTERN, 'Use a Lucide icon name.');

/** Editable fields only; saved-record metadata is supplied by the server. */
export const createSpaceSchema = baseRecordInputSchema.extend({ name, icon });

export const updateSpaceSchema = createSpaceSchema.partial();

/**
 * Saved-record contract for ADR-0012. Database adapters must map owner_id,
 * created_at and updated_at to these camelCase fields. Space remains
 * a provisional label; content relationships and lifecycle stay undecided.
 */
export const spaceSchema = baseRecordSchema.extend({
  name,
  icon,
  id: z.string().min(1, 'A space ID is required.'),
});
