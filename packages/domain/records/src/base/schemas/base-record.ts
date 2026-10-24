import { z } from 'zod';

const timestampSchema = z.iso.datetime({ offset: true });

/**
 * A Lucide identifier in kebab-case. Store the Lucide identifier, never a
 * React component or SVG markup.
 */
export const ICON_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** The editable fields every owned record shares. No messages. */
export const baseRecordInputSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().optional(),
  icon: z.string().regex(ICON_NAME_PATTERN),
  tags: z.array(z.string()),
});

/**
 * The ten fields every owned record shares (ADR-0012, ADR-0013): the editable
 * fields plus the saved-record metadata the server supplies. Each kind extends
 * this and keeps its own contract and messages.
 */
export const baseRecordSchema = baseRecordInputSchema.extend({
  id: z.string().min(1),
  ownerId: z.uuid(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  /** When the owner pinned the record; null when it is not pinned. */
  pinnedAt: timestampSchema.nullable().default(null),
  /** When the owner last opened the record; null when never opened. */
  lastViewedAt: timestampSchema.nullable().default(null),
});
