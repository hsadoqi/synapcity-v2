import { describe, expect, it } from 'vitest';

import { WEEKDAY_INITIAL, WEEKDAY_NAME, WEEKDAY_SHORT } from './index';

describe('weekday labels', () => {
  it('start on Monday', () => {
    expect(WEEKDAY_INITIAL).toEqual(['M', 'T', 'W', 'T', 'F', 'S', 'S']);
    expect(WEEKDAY_SHORT[0]).toBe('Mon');
    expect(WEEKDAY_NAME[6]).toBe('Sunday');
    expect(WEEKDAY_SHORT).toHaveLength(7);
    expect(WEEKDAY_NAME).toHaveLength(7);
  });
});
