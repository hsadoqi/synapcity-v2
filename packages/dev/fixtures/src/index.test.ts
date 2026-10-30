import { describe, expect, it } from 'vitest';
import {
  createDashboardRecord,
  createDocumentRecord,
  createFixtures,
  createPerson,
  createSpace,
  resetDefaultFixtures,
} from './index.ts';

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

describe('contract-backed record factories', () => {
  const records = (fx: ReturnType<typeof createFixtures>) =>
    [
      ['space', fx.space],
      ['documentRecord', fx.documentRecord],
      ['dashboardRecord', fx.dashboardRecord],
    ] as const;

  it.each(['space', 'documentRecord', 'dashboardRecord'] as const)(
    '%s gives every record its own id (no shared default identity)',
    (kind) => {
      const fx = createFixtures(3);
      const ids = fx.list(50, () => fx[kind]()).map((record) => record.id);
      expect(new Set(ids).size).toBe(50);
    },
  );

  it('builds persistable shapes: string icons, ISO timestamps, name not title', () => {
    for (const [, make] of records(createFixtures(5))) {
      for (let i = 0; i < 20; i += 1) {
        const record = make();
        expect(record.icon).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
        expect(typeof record.createdAt).toBe('string');
        expect(Date.parse(record.createdAt)).toBeLessThanOrEqual(
          Date.parse(record.updatedAt),
        );
        expect(record).not.toHaveProperty('title');
        expect(record.name.length).toBeGreaterThan(0);
      }
    }
  });

  it('stays inside the metadata bounds (name 120, description 2000, 20 tags of 50)', () => {
    const fx = createFixtures(9);
    for (const record of fx.list(100, () => fx.space())) {
      expect(record.name.length).toBeLessThanOrEqual(120);
      expect(record.description?.length ?? 0).toBeLessThanOrEqual(2000);
      expect(record.tags.length).toBeLessThanOrEqual(20);
      expect(new Set(record.tags.map((t) => t.toLowerCase())).size).toBe(
        record.tags.length,
      );
    }
  });

  it('does not alias: mutating one result never changes another', () => {
    const fx = createFixtures(2);
    const a = fx.space({ tags: ['x'] });
    const b = fx.space({ tags: ['x'] });
    a.tags.push('changed');
    a.name = 'Changed';
    expect(b.tags).toEqual(['x']);
    expect(b.name).not.toBe('Changed');
  });

  it('is deterministic for the same seed', () => {
    expect(createFixtures(11).space()).toEqual(createFixtures(11).space());
    expect(createFixtures(11).space()).not.toEqual(createFixtures(12).space());
  });

  it('gives records built together one owner, and an override changes it', () => {
    const fx = createFixtures(4);
    expect(fx.space().ownerId).toBe(fx.documentRecord().ownerId);
    const other = '22222222-2222-4222-8222-222222222222';
    expect(fx.space({ ownerId: other }).ownerId).toBe(other);
  });

  it('validates like incoming data and refuses inverted timestamps', () => {
    const fx = createFixtures();
    expect(() => fx.space({ name: '  ' })).toThrow();
    expect(() => fx.documentRecord({ icon: 'Not An Icon' })).toThrow();
    expect(() =>
      fx.dashboardRecord({
        createdAt: '2026-02-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      }),
    ).toThrow(/updated before/);
  });

  it('uses only the reserved .test domain for people', () => {
    const fx = createFixtures();
    for (const person of fx.list(30, fx.person)) {
      expect(person.email).toMatch(/@synapcity\.test$/);
    }
  });
});

describe('stand-alone factories', () => {
  it('give different ids on successive calls and restart on reset', () => {
    resetDefaultFixtures(8);
    const first = createSpace();
    const second = createSpace();
    expect(first.id).not.toBe(second.id);
    resetDefaultFixtures(8);
    expect(createSpace()).toEqual(first);
    expect(createDocumentRecord().id).toBeTruthy();
    expect(createDashboardRecord().id).toBeTruthy();
    expect(createPerson().email).toMatch(/@synapcity\.test$/);
  });
});
