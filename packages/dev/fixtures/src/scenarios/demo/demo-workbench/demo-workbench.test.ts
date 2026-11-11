import { describe, expect, it } from 'vitest';

import { baseRecordSchema } from '@synapcity/domain-records';
import { spaceSchema } from '@synapcity/domain-spaces';

import { demoWorkbench } from './demo-workbench';

describe('demoWorkbench', () => {
  const s = demoWorkbench();
  const countIn = (spaceName: string, kind: 'document' | 'dashboard') => {
    const id = s.spaces.find((x) => x.name === spaceName)!.id;
    return s.memberships.filter((m) => m.spaceId === id && m.kind === kind)
      .length;
  };

  it('is deterministic and shares nothing between builds', () => {
    const again = demoWorkbench();
    expect(again).toEqual(s);
    again.spaces[0]!.tags.push('mutated');
    expect(demoWorkbench()).toEqual(s);
  });

  it('passes the domain schemas, with ordered timestamps and unique ids', () => {
    for (const sp of s.spaces)
      expect(spaceSchema.safeParse(sp).success).toBe(true);
    const items = [...s.documents, ...s.dashboards];
    for (const r of items)
      expect(baseRecordSchema.safeParse(r).success).toBe(true);
    for (const r of [...s.spaces, ...items])
      expect(Date.parse(r.createdAt)).toBeLessThanOrEqual(
        Date.parse(r.updatedAt),
      );
    const ids = [...s.spaces, ...items].map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives the Spaces different sizes, one of them empty', () => {
    expect(countIn('Writing', 'document')).toBeGreaterThanOrEqual(10);
    expect(countIn('Product launch', 'dashboard')).toBeGreaterThanOrEqual(4);
    expect(countIn('Health', 'document')).toBeLessThan(
      countIn('Writing', 'document') / 2,
    );
    expect(countIn('Home', 'document') + countIn('Home', 'dashboard')).toBe(0);
  });

  it('files some items in several Spaces and some in none', () => {
    const spacesOf = new Map<string, number>();
    for (const m of s.memberships)
      spacesOf.set(m.itemId, (spacesOf.get(m.itemId) ?? 0) + 1);
    expect([...spacesOf.values()].some((n) => n > 1)).toBe(true);
    const unfiled = [...s.documents, ...s.dashboards].filter(
      (r) => !spacesOf.has(r.id),
    );
    expect(unfiled.length).toBeGreaterThan(0);
  });

  it('files an item only once in the same Space, and only the owner’s', () => {
    const keys = s.memberships.map((m) => `${m.spaceId}/${m.itemId}`);
    expect(new Set(keys).size).toBe(keys.length);
    expect(s.memberships.every((m) => m.ownerId === s.users[0]!.id)).toBe(true);
  });
});
