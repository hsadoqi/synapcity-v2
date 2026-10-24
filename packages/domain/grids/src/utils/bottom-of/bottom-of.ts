import type { LayoutItem } from '../../types';

/** First free row below every item. */
export function bottomOf(layout: readonly LayoutItem[]): number {
  return layout.reduce((max, l) => Math.max(max, l.y + l.h), 0);
}
