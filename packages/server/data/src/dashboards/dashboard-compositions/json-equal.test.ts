import { describe, expect, it } from 'vitest';

import { jsonEqual } from './json-equal';

describe('jsonEqual', () => {
  it('ignores object key order at every depth', () => {
    expect(
      jsonEqual(
        { a: 1, b: { c: [1, { d: 2, e: 3 }] } },
        { b: { c: [1, { e: 3, d: 2 }] }, a: 1 },
      ),
    ).toBe(true);
  });

  it('keeps array order and exact values', () => {
    expect(jsonEqual([1, 2], [2, 1])).toBe(false);
    expect(jsonEqual({ a: 1 }, { a: 2 })).toBe(false);
    expect(jsonEqual({ a: '1' }, { a: 1 })).toBe(false);
    expect(jsonEqual({ a: null }, { a: undefined })).toBe(false);
  });

  it('tells arrays from objects and missing keys from extra ones', () => {
    expect(jsonEqual([], {})).toBe(false);
    expect(jsonEqual({ a: 1 }, { a: 1, b: 1 })).toBe(false);
    expect(jsonEqual({ a: 1, b: 1 }, { a: 1 })).toBe(false);
    expect(jsonEqual({ a: undefined }, { b: undefined })).toBe(false);
  });

  it('compares scalars and null', () => {
    expect(jsonEqual(null, null)).toBe(true);
    expect(jsonEqual(null, {})).toBe(false);
    expect(jsonEqual('x', 'x')).toBe(true);
  });
});
