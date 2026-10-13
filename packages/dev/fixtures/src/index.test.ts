import { describe, expect, it } from 'vitest';
import { createFixtures } from './index.ts';

describe('createFixtures', () => {
  it('repeats the same data for the same seed', () => {
    const a = createFixtures(42);
    const b = createFixtures(42);
    expect(a.person()).toEqual(b.person());
    expect(a.recent()).toEqual(b.recent());
  });

  it('gives different data for a different seed', () => {
    expect(createFixtures(1).person()).not.toEqual(createFixtures(2).person());
  });

  it('keeps instances independent', () => {
    const a = createFixtures(7);
    const b = createFixtures(7);
    a.person();
    a.person();
    expect(b.person()).toEqual(createFixtures(7).person());
  });

  it('applies overrides and builds lists', () => {
    const f = createFixtures();
    expect(f.person({ name: 'Ada' }).name).toBe('Ada');
    expect(f.list(3, f.title)).toHaveLength(3);
  });
});
