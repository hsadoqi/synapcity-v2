import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireOwner: vi.fn(),
  getSpaceSource: vi.fn(),
  getSpace: vi.fn(),
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

import SpaceShowPage from './page';

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
    expect(mocks.getSpace).toHaveBeenCalledWith(source, 'missing');
    expect(mocks.notFound).toHaveBeenCalledOnce();
  });
});
