import { describe, expect, it } from 'vitest';

import { createSpaceFixture } from '../index';

describe('space fixtures', () => {
  it('builds a display-ready space owned by the given user', () => {
    const space = createSpaceFixture({ ownerId: 'user-1' });

    expect(space).toMatchObject({
      kind: 'space',
      ownerId: 'user-1',
      documentsTotal: space.documents.length,
      dashboardsTotal: space.dashboards.length,
    });
    expect(space.documents.every((item) => item.kind === 'document')).toBe(
      true,
    );
    expect(space.dashboards.every((item) => item.kind === 'dashboard')).toBe(
      true,
    );
  });
});
