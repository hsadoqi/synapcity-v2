import { describe, expect, it } from 'vitest';

import { normalizeLinkUrl } from './index';

describe('normalizeLinkUrl', () => {
  it.each([
    ['example.com', 'https://example.com/'],
    ['http://example.com/a', 'http://example.com/a'],
    ['javascript:alert(1)', null],
    ['mailto:a@b.co', null],
    ['not a url', null],
    ['', null],
    ['localhost:3000', 'https://localhost:3000/'],
    ['example.com:8080', 'https://example.com:8080/'],
    ['https://example.com', 'https://example.com/'],
  ])('normalizes %j', (input, expected) => {
    expect(normalizeLinkUrl(input)).toBe(expected);
  });
});
