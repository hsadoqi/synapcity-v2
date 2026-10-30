import { describe, expect, it } from 'vitest';

import { isPlainObject } from './is-plain-object';

describe('isPlainObject', () => {
  it('accepts objects, empty or not', () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject({ a: 1 })).toBe(true);
  });

  it.each([
    ['null', null],
    ['an array', []],
    ['a string', 'text'],
    ['a number', 1],
    ['undefined', undefined],
  ])('refuses %s', (_label, value) => {
    expect(isPlainObject(value)).toBe(false);
  });
});
