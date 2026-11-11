import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { baseRecordSchema } from '@synapcity/domain-records';
import { spaceSchema } from '@synapcity/domain-spaces';

import { buildScenario, scenarioNames } from './builder';
import { stableId } from './scenario';

const SEED_SQL = readFileSync(
  new URL('../../../../../supabase/seed.sql', import.meta.url),
  'utf8',
);

describe.each(scenarioNames)('scenario "%s"', (name) => {
  const s = buildScenario(name);
  const all = [...s.spaces, ...s.documents, ...s.dashboards];

  it('has only people, Spaces, Documents, Dashboards and memberships', () => {
    // Nothing the database creates by itself: no compositions, revisions, content, events or profiles.
    expect(Object.keys(s).sort()).toEqual([
      'dashboards',
      'documents',
      'memberships',
      'name',
      'spaces',
      'users',
    ]);
  });

  it('gives every person and record its own id, UUID-shaped', () => {
    const ids = [...s.users.map((u) => u.id), ...all.map((r) => r.id)];
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids)
      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );
  });

  it('passes the domain schemas', () => {
    for (const sp of s.spaces)
      expect(spaceSchema.safeParse(sp).success).toBe(true);
    for (const r of [...s.documents, ...s.dashboards])
      expect(baseRecordSchema.safeParse(r).success).toBe(true);
  });

  it('owns every record by one of its people', () => {
    const owners = new Set(s.users.map((u) => u.id));
    for (const r of all) expect(owners.has(r.ownerId)).toBe(true);
  });

  it('files records only in the same person’s Spaces, and never across people', () => {
    const byId = new Map(all.map((r) => [r.id, r]));
    expect(s.memberships.length).toBeGreaterThan(0);
    for (const m of s.memberships) {
      const sp = byId.get(m.spaceId);
      const it = byId.get(m.itemId);
      expect(sp, 'the Space exists').toBeDefined();
      expect(it, 'the item exists').toBeDefined();
      expect(s.spaces.some((x) => x.id === m.spaceId)).toBe(true);
      expect(sp!.ownerId).toBe(m.ownerId);
      expect(it!.ownerId).toBe(m.ownerId);
      expect(
        (m.kind === 'document' ? s.documents : s.dashboards).some(
          (x) => x.id === m.itemId,
        ),
      ).toBe(true);
    }
    const keys = s.memberships.map((m) => `${m.spaceId}/${m.itemId}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('keeps createdAt on or before updatedAt, and uses the reserved test domain', () => {
    for (const r of all)
      expect(Date.parse(r.createdAt)).toBeLessThanOrEqual(
        Date.parse(r.updatedAt),
      );
    for (const u of s.users) expect(u.email).toMatch(/@synapcity\.test$/);
  });

  it('is deterministic and independent: building twice gives equal graphs that share nothing', () => {
    const again = buildScenario(name);
    expect(again).toEqual(s);
    again.spaces[0]!.tags.push('mutated');
    again.users[0]!.name = 'Mutated';
    expect(buildScenario(name)).toEqual(s);
    expect(s.spaces[0]!.tags).not.toContain('mutated');
  });

  it('every name appears in the development sample (supabase/seed.sql) it mirrors', () => {
    const starterNames = [...s.spaces, ...s.documents, ...s.dashboards].map(
      (r) => r.name,
    );
    const mirrored = starterNames.filter((n) => SEED_SQL.includes(`'${n}'`));
    // The isolation scenario adds look-alikes of its own; the rest come from the sample.
    expect(mirrored.length).toBeGreaterThanOrEqual(11);
  });
});

describe('stable ids', () => {
  it('depend only on the label, and are pinned so a change is deliberate', () => {
    expect(stableId('x')).toBe(stableId('x'));
    expect(stableId('x')).not.toBe(stableId('y'));
    expect(stableId('starter/user/a')).toBe(
      '827bde07-e989-4144-a738-44ff4cca4bbc',
    );
  });
});
