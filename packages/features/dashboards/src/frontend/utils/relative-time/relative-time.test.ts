import { describe, expect, it } from 'vitest';

import { relativeTime } from './index';

const NOW = Date.parse('2026-10-24T12:00:00Z');
const MINUTE = 60_000;
const ago = (minutes: number) => new Date(NOW - minutes * MINUTE).toISOString();

describe('relativeTime', () => {
  it.each([
    [0, 'Just now'],
    [-5, 'Just now'],
    [1, '1 min ago'],
    [12, '12 min ago'],
    [59, '59 min ago'],
    [180, '3 hr ago'],
    [2 * 24 * 60, '2 d ago'],
  ])('labels %i minutes ago as %s', (minutes, label) => {
    expect(relativeTime(ago(minutes), NOW)).toBe(label);
  });
});
