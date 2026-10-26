import { describe, expect, it } from 'vitest';

describe('@synapcity/server-data root entry', () => {
  it('loads behind its server-only guard and exposes the Space, Document and Dashboard functions', async () => {
    const entry = await import('./index');

    expect(Object.keys(entry).sort()).toEqual([
      'findSpace',
      'listDashboardSummaries',
      'listDocumentSummaries',
      'listSpaceDashboards',
      'listSpaceDocuments',
      'listSpaceSummaries',
      'listSpaces',
      'recordSpaceView',
      'setDashboardPinned',
      'setDocumentPinned',
      'setSpacePinned',
    ]);
  });
});
