import { describe, it } from 'node:test';
import { expect } from 'vitest';
import { buildScenario } from '..';

describe('starter', () => {
  const s = buildScenario('starter');

  it('has two people, each with 3 Spaces, 4 Documents, 2 Dashboards and 5 memberships', () => {
    expect(s.users).toHaveLength(2);
    for (const u of s.users) {
      expect(
        s.spaces.filter((x) => x.ownerId === u.id).map((x) => x.name),
      ).toEqual(['Writing', 'Learning', 'Personal']);
      expect(s.documents.filter((x) => x.ownerId === u.id)).toHaveLength(4);
      expect(s.dashboards.filter((x) => x.ownerId === u.id)).toHaveLength(2);
      expect(s.memberships.filter((m) => m.ownerId === u.id)).toHaveLength(5);
    }
  });

  it('leaves Personal empty and one Document filed nowhere, as the sample does', () => {
    for (const u of s.users) {
      const personal = s.spaces.find(
        (x) => x.ownerId === u.id && x.name === 'Personal',
      )!;
      expect(s.memberships.filter((m) => m.spaceId === personal.id)).toEqual(
        [],
      );
      const loose = s.documents.find(
        (x) => x.ownerId === u.id && x.name === 'Loose thought',
      )!;
      expect(s.memberships.some((m) => m.itemId === loose.id)).toBe(false);
    }
  });
});
