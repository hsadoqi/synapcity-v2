import { baseRecordSchema, spaceSchema } from '@synapcity/domain-records';
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
