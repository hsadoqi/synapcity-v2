import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireOwner: vi.fn(),
  getSpaceSource: vi.fn(),
  getSpace: vi.fn(),
  recordSpaceView: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error('NEXT_HTTP_ERROR_FALLBACK;404');
  }),
}));

vi.mock('next/navigation', () => ({ notFound: mocks.notFound }));
vi.mock('@/lib/access/require-owner', () => ({
  requireOwner: mocks.requireOwner,
}));
vi.mock('@/lib/spaces', () => ({ getSpaceSource: mocks.getSpaceSource }));
vi.mock('@synapcity/features-spaces/server', () => ({
  getSpace: mocks.getSpace,
}));
vi.mock('@/lib/spaces/space-state-actions', () => ({
  recordSpaceView: mocks.recordSpaceView,
}));

import { isValidElement, type ReactElement, type ReactNode } from 'react';
import {
  RecordSpaceView,
  SpaceContent,
} from '@synapcity/features-spaces/frontend';
import { SetBreadcrumbs } from '@/components/breadcrumbs';

import SpaceShowPage from './page';

/** The elements the page returns, flattened, so a test can find one by type. */
function elements(node: ReactNode): ReactElement[] {
  if (!isValidElement(node)) return [];
  const { children } = node.props as { children?: ReactNode };
  const nested = Array.isArray(children) ? children : [children];
  return [node, ...nested.flatMap(elements)];
}
const find = (page: ReactNode, type: unknown) =>
  elements(page).find((element) => element.type === type);

const params = (spaceId: string) => Promise.resolve({ userId: 'u1', spaceId });

describe('the Space detail page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireOwner.mockResolvedValue({ kind: 'verified' });
  });

  it('renders the not-found page for a Space the loader cannot find', async () => {
    const source = { from: 'host' };
    mocks.getSpaceSource.mockResolvedValue(source);
    mocks.getSpace.mockResolvedValue(null);

    await expect(SpaceShowPage({ params: params('missing') })).rejects.toThrow(
      'NEXT_HTTP_ERROR_FALLBACK;404',
    );
    expect(mocks.requireOwner).toHaveBeenCalledWith('u1');
    expect(mocks.getSpace).toHaveBeenCalledWith(source, 'missing', {
      onItemsError: expect.any(Function),
    });
    expect(mocks.notFound).toHaveBeenCalledOnce();
  });

  it('shows the space, records the view and names it in the trail', async () => {
    const space = { id: 's1', name: 'Writing' };
    mocks.getSpaceSource.mockResolvedValue({ from: 'host' });
    mocks.getSpace.mockResolvedValue(space);

    const page = await SpaceShowPage({ params: params('s1') });

    expect(find(page, SpaceContent)?.props).toEqual({
      homePath: '/u1/home',
      space,
    });
    expect(find(page, RecordSpaceView)?.props).toEqual({
      spaceId: 's1',
      recordSpaceView: mocks.recordSpaceView,
    });
    expect(find(page, SetBreadcrumbs)?.props).toEqual({
      items: [
        { label: 'Spaces', href: '/u1/home/spaces' },
        { label: 'Writing' },
      ],
    });
  });

  it('logs, by code only, a failure to read what takes part in the space', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mocks.getSpaceSource.mockResolvedValue({ from: 'host' });
    mocks.getSpace.mockResolvedValue({ id: 's1', name: 'Writing' });

    await SpaceShowPage({ params: params('s1') });
    const [, , options] = mocks.getSpace.mock.calls[0]!;
    options.onItemsError({ code: 'PGRST301', message: 'secret detail' });

    expect(warn).toHaveBeenCalledWith('getSpace items failed', {
      code: 'PGRST301',
      status: undefined,
    });
    warn.mockRestore();
  });
});
