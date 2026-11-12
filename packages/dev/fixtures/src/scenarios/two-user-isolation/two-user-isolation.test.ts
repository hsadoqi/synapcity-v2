import { describe, expect, it } from 'vitest';
import { buildScenario } from '../builder';

describe('two-user-isolation', () => {
  const s = buildScenario('two-user-isolation');
  const [a, b] = s.users as [(typeof s.users)[0], (typeof s.users)[0]];

  it('puts confusable names on both people and none across an edge', () => {
    const namesOf = (id: string) =>
      [...s.spaces, ...s.documents, ...s.dashboards]
        .filter((r) => r.ownerId === id)
        .map((r) => r.name.toLowerCase());
    const shared = namesOf(a.id).filter((n) => namesOf(b.id).includes(n));
    expect(shared.length).toBeGreaterThanOrEqual(10);
    expect(
      s.spaces.some((x) => x.ownerId === b.id && x.name === 'personal'),
    ).toBe(true);
    expect(
      s.spaces.some((x) => x.ownerId === a.id && x.name === 'Personal'),
    ).toBe(true);
    expect(
      s.dashboards.some(
        (x) => x.ownerId === a.id && x.name === 'Writing progress',
      ),
    ).toBe(true);
    expect(
      s.documents.some(
        (x) => x.ownerId === b.id && x.name === 'Writing progress',
      ),
    ).toBe(true);
  });
});
