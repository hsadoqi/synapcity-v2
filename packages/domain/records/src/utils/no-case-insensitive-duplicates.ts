import z from 'zod';

import { RECORD_MESSAGES } from '../constants';

/** No two tags are equal when case is ignored (the database checks the same). */
export function noCaseInsensitiveDuplicates(
  tags: string[],
  ctx: z.RefinementCtx,
) {
  const seen = new Set<string>();
  for (const [index, tag] of tags.entries()) {
    const key = tag.toLowerCase();
    if (seen.has(key)) {
      ctx.addIssue({
        code: 'custom',
        message: RECORD_MESSAGES.duplicateTag,
        path: [index],
      });
    }
    seen.add(key);
  }
}
