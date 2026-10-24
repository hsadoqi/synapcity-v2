import { baseRecordSchema } from '@synapcity/domain-records';
import { describe, expect, it } from 'vitest';

import { SPACE_FIXTURES, spaceItem } from '../../lib/fixtures';
import { fixtureSpaceSource } from './fixture-space-source';

describe('fixtureSpaceSource', () => {
  const source = fixtureSpaceSource();

  it('lists the sample Spaces', async () => {
    await expect(source.list()).resolves.toEqual([...SPACE_FIXTURES]);
  });

  it('summarises them with zero counts, as there is no participation data', async () => {
    const summaries = await source.listSummaries();

    expect(summaries).toHaveLength(SPACE_FIXTURES.length);
    expect(summaries[0]).toMatchObject({
      id: SPACE_FIXTURES[0]?.id,
      documentsTotal: 0,
      dashboardsTotal: 0,
    });
  });

  it('finds a sample Space by id and nothing else', async () => {
    const [first] = SPACE_FIXTURES;

    await expect(source.find(first!.id)).resolves.toEqual(first);
    await expect(source.find('missing')).resolves.toBeNull();
  });

  it('does not save: a pin comes back as a fixture-mode failure', async () => {
    await expect(
      source.setPinned(SPACE_FIXTURES[0]!.id, true),
    ).resolves.toEqual({ ok: false, error: { code: 'fixture_mode' } });
  });

  it('records no view and reports success', async () => {
    await expect(source.recordView(SPACE_FIXTURES[0]!.id)).resolves.toEqual({
      ok: true,
    });
  });

  it('offers the sample documents and dashboards as base records, whatever the space', async () => {
    const documents = await source.listDocuments('any-space');
    const dashboards = await source.listDashboards('another-space');

    expect(documents.map((d) => d.id)).toEqual(
      spaceItem.documents.map((d) => d.id),
    );
    expect(dashboards.map((d) => d.id)).toEqual(
      spaceItem.dashboards.map((d) => d.id),
    );
    for (const record of [...documents, ...dashboards]) {
      expect(baseRecordSchema.parse(record)).toEqual(record);
    }
  });
});
