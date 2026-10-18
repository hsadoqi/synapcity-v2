import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { notFound } = vi.hoisted(() => ({ notFound: vi.fn() }));

vi.mock('next/navigation', () => ({ notFound }));

import { getSpace } from './get-space';

describe('getSpace', () => {
  const fetchSpace = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchSpace);
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.example.test');
    notFound.mockImplementation(() => {
      throw new Error('NEXT_HTTP_ERROR_FALLBACK;404');
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('fetches an encoded space ID without caching and returns the response', async () => {
    const space = {
      id: 'a/b ?',
      ownerId: '11111111-1111-4111-8111-111111111111',
      name: 'Writing',
      icon: 'pen-line',
      description: 'Drafts',
      tags: ['writing'],
      createdAt: '2026-10-01T09:00:00Z',
      updatedAt: '2026-10-03T14:30:00Z',
    };
    fetchSpace.mockResolvedValue(Response.json(space));

    await expect(getSpace(space.id)).resolves.toEqual(space);
    expect(fetchSpace).toHaveBeenCalledExactlyOnceWith(
      'https://api.example.test/api/spaces/a%2Fb%20%3F',
      { cache: 'no-store' },
    );
    expect(notFound).not.toHaveBeenCalled();
  });

  it('preserves the relative URL fallback when the API URL is unset', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', undefined);
    fetchSpace.mockResolvedValue(
      Response.json({
        id: 's1',
        ownerId: '11111111-1111-4111-8111-111111111111',
        name: 'Writing',
        icon: 'pen-line',
        tags: [],
        createdAt: '2026-10-01T09:00:00Z',
        updatedAt: '2026-10-03T14:30:00Z',
      }),
    );

    await getSpace('s1');

    expect(fetchSpace).toHaveBeenCalledExactlyOnceWith('/api/spaces/s1', {
      cache: 'no-store',
    });
  });

  it('uses the Next.js not-found boundary for a missing space', async () => {
    fetchSpace.mockResolvedValue(new Response(null, { status: 404 }));

    await expect(getSpace('missing')).rejects.toThrow(
      'NEXT_HTTP_ERROR_FALLBACK;404',
    );
    expect(notFound).toHaveBeenCalledOnce();
  });

  it('reports other unsuccessful responses with the space ID and status', async () => {
    fetchSpace.mockResolvedValue(new Response(null, { status: 500 }));

    await expect(getSpace('s1')).rejects.toThrow(
      'Failed to fetch space s1: 500',
    );
    expect(notFound).not.toHaveBeenCalled();
  });

  it('propagates network failures', async () => {
    const error = new Error('Connection failed');
    fetchSpace.mockRejectedValue(error);

    await expect(getSpace('s1')).rejects.toBe(error);
  });

  it('rejects malformed records from a successful response', async () => {
    fetchSpace.mockResolvedValue(
      Response.json({
        id: 's1',
        ownerId: '11111111-1111-4111-8111-111111111111',
        name: 123,
        icon: 'pen-line',
        tags: [],
        createdAt: '2026-10-01T09:00:00Z',
        updatedAt: '2026-10-03T14:30:00Z',
      }),
    );

    await expect(getSpace('s1')).rejects.toMatchObject({ name: 'ZodError' });
    expect(notFound).not.toHaveBeenCalled();
  });

  it('rejects a successful response missing saved-record metadata', async () => {
    fetchSpace.mockResolvedValue(
      Response.json({
        id: 's1',
        ownerId: '11111111-1111-4111-8111-111111111111',
        name: 'Writing',
        icon: 'pen-line',
        tags: [],
      }),
    );

    await expect(getSpace('s1')).rejects.toMatchObject({ name: 'ZodError' });
  });
});
