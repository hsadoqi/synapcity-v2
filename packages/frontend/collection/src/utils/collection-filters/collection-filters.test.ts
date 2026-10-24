import { describe, expect, it } from 'vitest';

import {
  EMPTY_FILTERS,
  countActiveFilters,
  hasActiveFilters,
} from './collection-filters';

describe('collection filters', () => {
  it('start with nothing active', () => {
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false);
    expect(countActiveFilters(EMPTY_FILTERS)).toBe(0);
  });

  it('count each switch and each chosen group or tag', () => {
    const filters = {
      pinned: true,
      recent: false,
      groups: ['Writing', 'Learning'],
      tags: ['ideas'],
    };

    expect(hasActiveFilters(filters)).toBe(true);
    expect(countActiveFilters(filters)).toBe(4);
  });
});
