import { baseRecordSchema } from '@synapcity/domain-records';
import { spaceSchema } from '@synapcity/domain-spaces';
import { findEntityIcon } from '@synapcity/frontend-collection';
import { describe, expect, it } from 'vitest';

import { DEMO_DASHBOARDS, DEMO_DOCUMENTS, DEMO_SPACES } from './demo-spaces';
import { fixtureSpaceSource } from './fixture-space-source';

describe('the demo Spaces', () => {
  it('are valid records with distinct IDs', () => {
    expect(DEMO_SPACES.length).toBeGreaterThan(0);
    expect(new Set(DEMO_SPACES.map((space) => space.id)).size).toBe(
      DEMO_SPACES.length,
    );
    for (const space of DEMO_SPACES) {
      expect(spaceSchema.parse(space)).toEqual(space);
    }
  });

  it('cover spaces with and without a description', () => {
    expect(DEMO_SPACES.some((space) => Boolean(space.description))).toBe(true);
    expect(DEMO_SPACES.some((space) => space.description === undefined)).toBe(
      true,
    );
  });

  it('use icons from the fixed entity icon set', () => {
    for (const space of DEMO_SPACES) {
      expect(findEntityIcon(space.icon)?.name).toBe(space.icon);
    }
  });

  it('cover tagged and untagged spaces', () => {
    expect(DEMO_SPACES.some((space) => space.tags.length > 0)).toBe(true);
    expect(DEMO_SPACES.some((space) => space.tags.length === 0)).toBe(true);
  });
});

describe('fixtureSpaceSource', () => {
  const source = fixtureSpaceSource();

  it('lists the sample Spaces', async () => {
    await expect(source.list()).resolves.toEqual([...DEMO_SPACES]);
  });

  it('summarises them with zero counts, as there is no participation data', async () => {
    const summaries = await source.listSummaries();

    expect(summaries).toHaveLength(DEMO_SPACES.length);
    expect(summaries[0]).toMatchObject({
      id: DEMO_SPACES[0]?.id,
      documentsTotal: 0,
      dashboardsTotal: 0,
    });
  });

  it('lists the sample Spaces as nav items: display fields only, pinned first, then most recently changed', async () => {
    const items = await source.listNavItems();
    const allowed = ['description', 'icon', 'id', 'name', 'tags', 'updatedAt'];

    expect(items).toHaveLength(DEMO_SPACES.length);
    for (const item of items) {
      expect(Object.keys(item).filter((key) => !allowed.includes(key))).toEqual(
        [],
      );
    }
    const order = [...DEMO_SPACES]
      .sort((a, b) =>
        Boolean(a.pinnedAt) !== Boolean(b.pinnedAt)
          ? a.pinnedAt
            ? -1
            : 1
          : (b.pinnedAt ?? '').localeCompare(a.pinnedAt ?? '') ||
            b.updatedAt.localeCompare(a.updatedAt),
      )
      .map((space) => space.id);
    expect(items.map((item) => item.id)).toEqual(order);
  });

  it('lists every sample Space with no participation rows, as there is no participation data', async () => {
    const spaces = await source.listWithRelations();

    expect(spaces.map((space) => space.id)).toEqual(
      DEMO_SPACES.map((space) => space.id),
    );
    for (const space of spaces) {
      expect(space).toMatchObject({
        space_documents: [],
        space_dashboards: [],
      });
    }
  });

  it('reads one sample Space’s relations of the kind asked for, and null for anything else', async () => {
    const id = DEMO_SPACES[0]!.id;

    const documents = await source.getRelations(id, 'documents');
    expect(documents?.space_documents).toEqual([]);
    expect(documents).not.toHaveProperty('space_dashboards');

    const dashboards = await source.getRelations(id, 'dashboards');
    expect(dashboards?.space_dashboards).toEqual([]);
    expect(dashboards).not.toHaveProperty('space_documents');

    await expect(source.getRelations(id)).resolves.toMatchObject({
      id,
      space_documents: [],
      space_dashboards: [],
    });
    await expect(source.getRelations('missing')).resolves.toBeNull();
  });

  it('finds a sample Space by id and nothing else', async () => {
    const [first] = DEMO_SPACES;

    await expect(source.find(first!.id)).resolves.toEqual(first);
    await expect(source.find('missing')).resolves.toBeNull();
  });

  it('does not save: a pin comes back as a fixture-mode failure', async () => {
    await expect(source.setPinned(DEMO_SPACES[0]!.id, true)).resolves.toEqual({
      ok: false,
      error: { code: 'fixture_mode' },
    });
  });

  it('does not create: a new Space comes back as a fixture-mode failure', async () => {
    await expect(source.create({ name: 'Garden plans' })).resolves.toEqual({
      ok: false,
      error: { code: 'fixture_mode' },
    });
  });

  it.each(['addDocument', 'addDashboard'] as const)(
    'does not save: %s comes back as a fixture-mode failure',
    async (method) => {
      await expect(
        source[method](DEMO_SPACES[0]!.id, DEMO_DOCUMENTS[0]!.id),
      ).resolves.toEqual({ ok: false, error: { code: 'fixture_mode' } });
    },
  );

  it('records no view and reports success', async () => {
    await expect(source.recordView(DEMO_SPACES[0]!.id)).resolves.toEqual({
      ok: true,
    });
  });

  it('offers the sample documents and dashboards as base records, whatever the space', async () => {
    const documents = await source.listDocuments('any-space');
    const dashboards = await source.listDashboards('another-space');

    expect(documents.map((d) => d.id)).toEqual(['doc1', 'doc2']);
    expect(dashboards.map((d) => d.id)).toEqual(['dash1', 'dash2']);
    expect(documents).toEqual(DEMO_DOCUMENTS);
    expect(dashboards).toEqual(DEMO_DASHBOARDS);
    for (const record of [...documents, ...dashboards]) {
      expect(baseRecordSchema.parse(record)).toEqual(record);
    }
  });
});
