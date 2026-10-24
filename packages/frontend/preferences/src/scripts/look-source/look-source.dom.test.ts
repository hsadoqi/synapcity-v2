import { beforeEach, describe, expect, it } from 'vitest';
import {
  LOOK_COOKIE_MAX_LENGTH,
  LOOK_COOKIE_NAME,
  lookFromCookieHeader,
  lookOf,
  settingsDefaults,
} from '@synapcity/domain-preferences';
import { lookCookieExpression, lookSourceExpression } from './look-source';

const good = lookOf(settingsDefaults);
const evaluate = <T>(expression: string): T =>
  new Function(`return ${expression}`)() as T;

const set = (raw: string) => {
  document.cookie = `${LOOK_COOKIE_NAME}=${raw}; Path=/`;
};
const setJson = (value: unknown) =>
  set(encodeURIComponent(JSON.stringify(value)));

beforeEach(() => {
  document.cookie = `${LOOK_COOKIE_NAME}=; Path=/; Max-Age=0`;
  localStorage.clear();
});

type Mutable = Record<string, any>;
const clone = () => structuredClone(good) as Mutable;
const with_ = (edit: (look: Mutable) => void) => {
  const look = clone();
  edit(look);
  return look;
};

const cases: [string, unknown][] = [
  ['valid', good],
  ['extra keys', { ...good, extra: 1 }],
  ['version 2', { ...good, v: 2 }],
  ['version as a string', { ...good, v: '1' }],
  ['no version', with_((l) => delete l.v)],
  ['theme null', { ...good, theme: null }],
  ['theme array', { ...good, theme: [] }],
  ['appearance missing', with_((l) => delete l.appearance)],
  ...Object.keys(good.theme).flatMap((key): [string, unknown][] => [
    [`theme.${key} missing`, with_((l) => delete l.theme[key])],
    [`theme.${key} wrong type`, with_((l) => (l.theme[key] = { x: 1 }))],
    [`theme.${key} unknown`, with_((l) => (l.theme[key] = 'nope'))],
  ]),
  ...Object.keys(good.appearance).flatMap((key): [string, unknown][] => [
    [`appearance.${key} missing`, with_((l) => delete l.appearance[key])],
    [`appearance.${key} wrong type`, with_((l) => (l.appearance[key] = 'yes'))],
    [`appearance.${key} unknown`, with_((l) => (l.appearance[key] = 'nope'))],
  ]),
  ...[79, 80, 85, 150, 151, 9999, 87, 100.5, -100, NaN, '100', null].map(
    (size): [string, unknown] => [
      `textSize ${String(size)}`,
      with_((l) => (l.theme.textSize = size)),
    ],
  ),
  ['null', null],
  ['a string', 'dark'],
  ['an array', []],
  ['a number', 42],
];

describe('the cookie expression and the domain reader agree', () => {
  it.each(cases)('%s', (_name, value) => {
    setJson(value);
    const inPage = evaluate<unknown>(lookCookieExpression);
    expect(inPage !== null).toBe(
      lookFromCookieHeader(document.cookie) !== null,
    );
  });

  it('agrees on values that are not valid encoded JSON', () => {
    for (const raw of ['%E0%A4%A', encodeURIComponent('{nope'), '', 'dark']) {
      set(raw);
      expect(evaluate<unknown>(lookCookieExpression), raw).toBeNull();
      expect(lookFromCookieHeader(document.cookie), raw).toBeNull();
    }
  });

  it('agrees on a value over the size cap', () => {
    setJson({ ...good, pad: 'x'.repeat(LOOK_COOKIE_MAX_LENGTH) });
    expect(evaluate<unknown>(lookCookieExpression)).toBeNull();
    expect(lookFromCookieHeader(document.cookie)).toBeNull();
  });

  it('returns the look itself when valid', () => {
    setJson(good);
    expect(evaluate<unknown>(lookCookieExpression)).toMatchObject(good);
  });
});

describe('lookSourceExpression', () => {
  const source = () =>
    evaluate<Mutable>(lookSourceExpression('synapcity-preferences'));

  it('prefers a valid cookie, then localStorage, then nothing', () => {
    expect(source()).toEqual({});
    localStorage.setItem(
      'synapcity-preferences',
      JSON.stringify({ theme: { density: 'spacious' } }),
    );
    expect(source().theme.density).toBe('spacious');
    setJson(with_((l) => (l.theme.density = 'compact')));
    expect(source().theme.density).toBe('compact');
  });

  it('ignores a cookie with any bad value, whole, and falls back', () => {
    localStorage.setItem(
      'synapcity-preferences',
      JSON.stringify({ theme: { density: 'spacious' } }),
    );
    setJson(with_((l) => (l.theme.radius = 'url(x)')));
    expect(source().theme.density).toBe('spacious');
  });

  it('does not throw when storage is unreadable', () => {
    localStorage.setItem('synapcity-preferences', '{not json');
    expect(source()).toEqual({});
  });
});
