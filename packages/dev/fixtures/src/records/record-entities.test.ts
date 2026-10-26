import { describe, expect, it } from 'vitest';

import { createDashboardEntity, createDocumentEntity } from './record-entities';

describe.each([
  ['createDocumentEntity', createDocumentEntity, 'Launch plan'],
  ['createDashboardEntity', createDashboardEntity, 'Weekly review'],
] as const)('%s', (_, create, name) => {
  it('creates independent deterministic records', () => {
    const first = create();
    const second = create();

    expect(first).toEqual(second);
    expect(first).not.toBe(second);
    first.tags.push('changed');
    expect(second.name).toBe(name);
    expect(second.tags).not.toContain('changed');
  });

  it('applies overrides and validates them', () => {
    expect(create({ id: 'fixture-custom', pinnedAt: null })).toMatchObject({
      id: 'fixture-custom',
      pinnedAt: null,
      lastViewedAt: null,
    });
    expect(() => create({ name: '   ' })).toThrow();
    expect(() => create({ createdAt: 'yesterday' })).toThrow();
  });
});
