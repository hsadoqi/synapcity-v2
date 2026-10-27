import { describe, expect, it } from 'vitest';

describe('@synapcity/server-data root entry', () => {
  it('loads behind its server-only guard and exposes the Space and record functions', async () => {
    const entry = await import('./index');

    expect(Object.keys(entry).sort()).toEqual([
      'createRecord',
      'findSpace',
      'listRecordSummaries',
      'listSpaceDashboards',
      'listSpaceDocuments',
      'listSpaceSummaries',
      'listSpaces',
      'recordSpaceView',
      'setRecordPinned',
      'setSpacePinned',
    ]);
  });
});
