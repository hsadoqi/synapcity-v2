import { isStorableText } from '@synapcity/domain-records';

import { dashboardCompositionSchema } from '../../schemas';
import type { DashboardComposition } from '../../types';
import { LINK_WIDGET_TYPES } from '../widgets';

/** The size cap on a stored composition (ADR-0016): 64 KB of JSON. */
export const MAX_COMPOSITION_BYTES = 64 * 1024;

export type PersistableResult =
  | { ok: true; composition: DashboardComposition }
  | {
      ok: false;
      /**
       * `invalid`: not a composition. The others are valid ones the server will
       * not store. `invalid-text`: a string (or key) holds U+0000 or an unpaired
       * surrogate, which the database cannot store; it is refused, never cleaned.
       */
      reason:
        | 'invalid'
        | 'widget-type'
        | 'widget-status'
        | 'too-large'
        | 'invalid-text';
    };

/** True when any string or object key in `value` cannot be stored. */
function hasUnstorableText(value: unknown): boolean {
  if (typeof value === 'string') return !isStorableText(value);
  if (Array.isArray(value)) return value.some(hasUnstorableText);
  if (typeof value === 'object' && value !== null) {
    return Object.entries(value).some(
      ([key, entry]) => !isStorableText(key) || hasUnstorableText(entry),
    );
  }
  return false;
}

/**
 * Checks a composition that arrived from a browser before it is stored
 * (ADR-0016, Slice 4): it must satisfy the composition contract, hold only
 * link widgets (the types that own no data), have every widget active (no
 * hidden or archived status is persisted: removal deletes), and fit the size
 * cap. Anything else is refused whole, never trimmed.
 */
export function parsePersistableComposition(input: unknown): PersistableResult {
  const parsed = dashboardCompositionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: 'invalid' };
  const composition = parsed.data;
  if (!composition.widgets.every((w) => LINK_WIDGET_TYPES.includes(w.type))) {
    return { ok: false, reason: 'widget-type' };
  }
  if (!composition.widgets.every((w) => w.status === 'active')) {
    return { ok: false, reason: 'widget-status' };
  }
  if (hasUnstorableText(composition))
    return { ok: false, reason: 'invalid-text' };
  const bytes = new TextEncoder().encode(JSON.stringify(composition)).length;
  if (bytes > MAX_COMPOSITION_BYTES) return { ok: false, reason: 'too-large' };
  return { ok: true, composition };
}
