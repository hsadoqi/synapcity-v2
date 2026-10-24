import { describe, expect, it } from 'vitest';

import { normalizeLinkUrl } from './index';

describe('normalizeLinkUrl', () => {
  it.each([
    ['example.com', 'https://example.com/'],
    ['http://example.com/a', 'http://example.com/a'],
    ['javascript:alert(1)', null],
    ['not a url', null],
    ['', null],
  ])('normalizes %j', (input, expected) => {
    expect(normalizeLinkUrl(input)).toBe(expected);
  });
});
