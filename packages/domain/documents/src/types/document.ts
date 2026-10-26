import type { z } from 'zod';

import type { documentSchema } from '../schemas';

export type DocumentEntity = z.infer<typeof documentSchema>;

/**
 * A document as the index lists it: the saved record plus how many Spaces it
 * takes part in. The count is derived from participation, not stored on the
 * document (ADR-0013, items 2 and 3).
 */
export type DocumentSummary = DocumentEntity & { spacesTotal: number };
