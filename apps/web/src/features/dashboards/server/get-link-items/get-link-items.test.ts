import { createComposition } from '@synapcity/domain-dashboards';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  listSummaries: vi.fn(),
  getDocuments: vi.fn(),
  getDashboards: vi.fn(),
  logFailure: vi.fn(),
}));

vi.mock('@/lib/spaces', () => ({
  getSpaceSource: async () => ({ listSummaries: mocks.listSummaries }),
}));
vi.mock('@/features/documents/server/get-documents', () => ({
  getDocuments: mocks.getDocuments,
}));
vi.mock('../get-dashboards', () => ({ getDashboards: mocks.getDashboards }));
vi.mock('@/lib/log-failure', () => ({ logFailure: mocks.logFailure }));

import { getDashboardLinkItems } from './get-link-items';

const record = (id: string) => ({
  id,
  name: id,
  icon: 'folder',
  pinnedAt: null,
  lastViewedAt: null,
});

/** A composition holding one widget of each given type. */
function compositionWith(
  ...types: ('pinned' | 'last-opened' | 'spaces' | 'notes')[]
) {
  // Only the type matters to what is fetched.
  const widgets = types.map(
    (type, i) => ({ id: `w${i}`, type, status: 'active' }) as never,
  );
  return { ...createComposition(), widgets };
}

describe('getDashboardLinkItems', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.listSummaries.mockResolvedValue([record('s1')]);
    mocks.getDocuments.mockResolvedValue([record('d1')]);
    mocks.getDashboards.mockResolvedValue([record('b1')]);
  });

  it('lists all three kinds with their pages for a null composition (browser fixture mode)', async () => {
    const { items, unavailableKinds } = await getDashboardLinkItems('u1', null);

    expect(items.map((i) => [i.kind, i.id, i.href])).toEqual([
      ['space', 's1', '/u1/home/spaces/s1'],
      ['document', 'd1', '/u1/home/documents/d1'],
      ['dashboard', 'b1', '/u1/home/dashboards/b1'],
    ]);
    expect(unavailableKinds).toEqual([]);
  });

  it('names the kinds it did not read, so a widget added later can ask for them', async () => {
    const { unloadedKinds } = await getDashboardLinkItems(
      'u1',
      compositionWith('spaces'),
    );
    expect(unloadedKinds.sort()).toEqual(['dashboard', 'document']);

    const none = await getDashboardLinkItems('u1', compositionWith('pinned'));
    expect(none.unloadedKinds).toEqual([]);
    const fixture = await getDashboardLinkItems('u1', null);
    expect(fixture.unloadedKinds).toEqual([]);
  });

  it('reads only the kinds the composition shows', async () => {
    await getDashboardLinkItems('u1', compositionWith('spaces'));
    expect(mocks.listSummaries).toHaveBeenCalledOnce();
    expect(mocks.getDocuments).not.toHaveBeenCalled();
    expect(mocks.getDashboards).not.toHaveBeenCalled();
  });

  it('reads nothing when no link widget is on the dashboard', async () => {
    const result = await getDashboardLinkItems('u1', createComposition());
    expect(result).toEqual({
      items: [],
      unavailableKinds: [],
      unloadedKinds: ['space', 'document', 'dashboard'],
    });
    expect(mocks.listSummaries).not.toHaveBeenCalled();
    expect(mocks.getDocuments).not.toHaveBeenCalled();
    expect(mocks.getDashboards).not.toHaveBeenCalled();
  });

  it('reads every kind once for Pinned', async () => {
    await getDashboardLinkItems('u1', compositionWith('pinned', 'last-opened'));
    expect(mocks.listSummaries).toHaveBeenCalledOnce();
    expect(mocks.getDocuments).toHaveBeenCalledOnce();
    expect(mocks.getDashboards).toHaveBeenCalledOnce();
  });

  it('reports a failed source instead of an empty list, and keeps the others', async () => {
    mocks.getDocuments.mockRejectedValue(
      Object.assign(new Error('offline'), { code: '57014' }),
    );

    const { items, unavailableKinds } = await getDashboardLinkItems(
      'u1',
      compositionWith('pinned'),
    );

    expect(unavailableKinds).toEqual(['document']);
    expect(items.map((i) => i.kind)).toEqual(['space', 'dashboard']);
    expect(mocks.logFailure).toHaveBeenCalledWith(
      'getDashboardLinkItems documents',
      expect.objectContaining({ code: '57014' }),
    );
  });

  it('reports every failed source', async () => {
    mocks.listSummaries.mockRejectedValue(new Error('x'));
    mocks.getDashboards.mockRejectedValue(new Error('y'));

    const { items, unavailableKinds } = await getDashboardLinkItems('u1', null);

    expect(unavailableKinds.sort()).toEqual(['dashboard', 'space']);
    expect(items.map((i) => i.kind)).toEqual(['document']);
  });
});
