import { describe, expect, it } from 'vitest';

import { spaceItemPath, spacePath } from './space-paths';

describe('the Space addresses', () => {
  it('put a space under the home address the host gives', () => {
    expect(spacePath('/u1/home', 's1')).toBe('/u1/home/spaces/s1');
  });

  it('put an item at its route nested in the space (ADR-0013, item 9)', () => {
    expect(
      spaceItemPath('/u1/home', 's1', { id: 'd1', kind: 'document' }),
    ).toBe('/u1/home/spaces/s1/documents/d1');
    expect(
      spaceItemPath('/u1/home', 's1', { id: 'b1', kind: 'dashboard' }),
    ).toBe('/u1/home/spaces/s1/dashboards/b1');
  });
});
