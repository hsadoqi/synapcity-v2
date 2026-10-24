import { describe, expect, it } from 'vitest';

import { isEmptyValue } from './is-empty-value';

describe('isEmptyValue', () => {
  it.each([
    ['an empty string', ''],
    ['null', null],
    ['undefined', undefined],
    ['an empty array', []],
    ['NaN', Number.NaN],
  ])('treats %s as empty', (_label, value) => {
    expect(isEmptyValue(value)).toBe(true);
  });

  it.each([
    ['zero', 0],
    ['false', false],
    ['a non-empty string', 'x'],
    ['a string of spaces', '  '],
    ['a non-empty array', ['x']],
    ['an object', {}],
  ])('treats %s as a value', (_label, value) => {
    expect(isEmptyValue(value)).toBe(false);
  });
});
