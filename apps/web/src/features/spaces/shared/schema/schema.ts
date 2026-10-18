import { z } from 'zod';

const timestampSchema = z.iso.datetime({ offset: true });

/** Editable fields only; saved-record metadata is supplied by the server. */
export const createSpaceSchema = z.object({
  name: z.string().trim().min(1, 'Enter a space name.'),
  description: z.string().optional(),
  // Store the Lucide identifier, never a React component or SVG markup.
  icon: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use a Lucide icon name.'),
  tags: z.array(z.string()),
});

export const updateSpaceSchema = createSpaceSchema.partial();

/**
 * Saved-record contract for ADR-0012. Database adapters must map owner_id,
 * created_at and updated_at to these camelCase fields. Space remains
 * a provisional label; content relationships and lifecycle stay undecided.
 */
export const spaceSchema = createSpaceSchema.extend({
  id: z.string().min(1, 'A space ID is required.'),
  ownerId: z.uuid(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});
