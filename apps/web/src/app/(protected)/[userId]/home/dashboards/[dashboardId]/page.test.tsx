import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireOwner: vi.fn(),
  getDashboard: vi.fn(),
  getDashboardComposition: vi.fn(),
  getDashboardLinkItems: vi.fn(),
  fixtureModeEnabled: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error('NEXT_HTTP_ERROR_FALLBACK;404');
  }),
}));

vi.mock('next/navigation', () => ({ notFound: mocks.notFound }));
vi.mock('@/lib/access/require-owner', () => ({
  requireOwner: mocks.requireOwner,
}));
vi.mock('@/features/dashboards/server/get-dashboards', () => ({
  getDashboard: mocks.getDashboard,
}));
vi.mock('@/features/dashboards/server/get-composition', () => ({
  getDashboardComposition: mocks.getDashboardComposition,
}));
vi.mock('@/features/dashboards/server/get-link-items', () => ({
  getDashboardLinkItems: mocks.getDashboardLinkItems,
}));
vi.mock(
  '@/features/dashboards/server/actions/dashboard-composition-actions',
  () => ({
    recordDashboardView: vi.fn(),
  }),
);
vi.mock('@/lib/access/dev-fixture', () => ({
  fixtureModeEnabled: mocks.fixtureModeEnabled,
}));

import { isValidElement, type ReactElement, type ReactNode } from 'react';
import { SetBreadcrumbs } from '@synapcity/frontend-shells';

import { DashboardView } from '@/features/dashboards/components/dashboard-view';
import { RecordDashboardView } from '@/features/dashboards/components/record-dashboard-view';
import DashboardShowPage, { generateMetadata } from './page';

/** The elements the page returns, flattened, so a test can find one by type. */
function elements(node: ReactNode): ReactElement[] {
  if (!isValidElement(node)) return [];
  const { children } = node.props as { children?: ReactNode };
  const nested = Array.isArray(children) ? children : [children];
  return [node, ...nested.flatMap(elements)];
}
const find = (page: ReactNode, type: unknown) =>
  elements(page).find((element) => element.type === type);

const params = (id: string) =>
  Promise.resolve({ userId: 'u1', dashboardId: id });

describe('the Dashboard page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireOwner.mockResolvedValue({ kind: 'verified' });
    mocks.getDashboardComposition.mockResolvedValue({
      composition: null,
      revision: 0,
    });
    mocks.getDashboardLinkItems.mockResolvedValue([]);
    mocks.fixtureModeEnabled.mockReturnValue(false);
  });

  it('is not found when the owner has no such dashboard', async () => {
    mocks.getDashboard.mockResolvedValue(null);

    await expect(
      DashboardShowPage({ params: params('missing') }),
    ).rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;404');
    expect(mocks.requireOwner).toHaveBeenCalledWith('u1');
    expect(mocks.getDashboard).toHaveBeenCalledWith('missing');
  });

  it('checks the owner before reading', async () => {
    mocks.requireOwner.mockRejectedValue(new Error('NEXT_REDIRECT'));

    await expect(DashboardShowPage({ params: params('x1') })).rejects.toThrow(
      'NEXT_REDIRECT',
    );
    expect(mocks.getDashboard).not.toHaveBeenCalled();
  });

  it('shows the dashboard and names it in the trail', async () => {
    const dashboard = { id: 'x1', name: 'Launch' };
    mocks.getDashboard.mockResolvedValue(dashboard);

    const page = await DashboardShowPage({ params: params('x1') });

    expect(find(page, DashboardView)?.props).toEqual({
      dashboard,
      composition: null,
      revision: 0,
      items: [],
      persistence: 'server',
    });
    expect(find(page, RecordDashboardView)?.props).toMatchObject({
      dashboardId: 'x1',
    });
    expect(find(page, SetBreadcrumbs)?.props).toEqual({
      items: [
        {
          label: 'Dashboards',
          href: '/u1/home/dashboards',
          kind: 'collection',
        },
        { label: 'Launch' },
      ],
    });
  });

  it('titles the page after the dashboard', async () => {
    mocks.getDashboard.mockResolvedValue({ id: 'x1', name: 'Launch' });
    await expect(generateMetadata({ params: params('x1') })).resolves.toEqual({
      title: 'Launch',
    });
  });

  it('is not found from its metadata too, so the status is 404', async () => {
    mocks.getDashboard.mockResolvedValue(null);
    await expect(
      generateMetadata({ params: params('missing') }),
    ).rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;404');
  });

  it('hands the stored composition, its revision and the link items to the canvas', async () => {
    const composition = { widgets: [] };
    const items = [{ id: 's1' }];
    mocks.getDashboard.mockResolvedValue({ id: 'x1', name: 'Launch' });
    mocks.getDashboardComposition.mockResolvedValue({
      composition,
      revision: 7,
    });
    mocks.getDashboardLinkItems.mockResolvedValue(items);

    const page = await DashboardShowPage({ params: params('x1') });

    expect(mocks.getDashboardComposition).toHaveBeenCalledWith('x1');
    expect(mocks.getDashboardLinkItems).toHaveBeenCalledWith('u1');
    expect(find(page, DashboardView)?.props).toMatchObject({
      composition,
      revision: 7,
      items,
    });
  });

  it('keeps the canvas in this browser in development fixture mode', async () => {
    mocks.getDashboard.mockResolvedValue({ id: 'x1', name: 'Launch' });
    mocks.fixtureModeEnabled.mockReturnValue(true);

    const page = await DashboardShowPage({ params: params('x1') });

    expect(find(page, DashboardView)?.props).toMatchObject({
      persistence: 'browser',
    });
  });

  it('does not render an empty canvas when the composition cannot be read', async () => {
    mocks.getDashboard.mockResolvedValue({ id: 'x1', name: 'Launch' });
    mocks.getDashboardComposition.mockRejectedValue(new Error('unreadable'));

    await expect(DashboardShowPage({ params: params('x1') })).rejects.toThrow(
      'unreadable',
    );
  });
});
