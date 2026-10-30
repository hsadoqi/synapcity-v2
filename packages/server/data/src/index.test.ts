import { describe, expect, it } from 'vitest';

describe('@synapcity/server-data root entry', () => {
  it('loads behind its server-only guard and exposes the Space, record and composition functions', async () => {
    const entry = await import('./index');

    expect(Object.keys(entry).sort()).toEqual([
      'COMPOSITION_SCHEMA_VERSION',
      'RECORD_TABLES',
      'createRecord',
      'findRecord',
      'findSpace',
      'listRecordSummaries',
      'listSpaceDashboards',
      'listSpaceDocuments',
      'listSpaceSummaries',
      'listSpaces',
      'loadComposition',
      'recordRecordView',
      'recordSpaceView',
      'saveComposition',
      'setRecordPinned',
      'setSpacePinned',
    ]);
  });
});
