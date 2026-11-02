import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  refreshedLookCookie: vi.fn(),
  updateSession: vi.fn(),
}));

vi.mock('@synapcity/domain-preferences', async (importActual) => ({
  ...(await importActual<typeof import('@synapcity/domain-preferences')>()),
  refreshedLookCookie: mocks.refreshedLookCookie,
}));
vi.mock('./lib/supabase/middleware', () => ({
  updateSession: mocks.updateSession,
}));

import { proxy } from './proxy';

function request(method: string, protocol = 'https:') {
  return {
    method,
    headers: new Headers({ cookie: 'synapcity-look=value' }),
    nextUrl: { protocol },
  } as NextRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.updateSession.mockResolvedValue(new Response());
  mocks.refreshedLookCookie.mockReturnValue('synapcity-look=renewed; Path=/');
});

describe('proxy look-cookie renewal', () => {
  it.each(['GET', 'HEAD'])(
    'renews the look on %s page requests',
    async (method) => {
      const response = await proxy(request(method));

      expect(mocks.refreshedLookCookie).toHaveBeenCalledWith(
        'synapcity-look=value',
        { domain: undefined, secure: true },
      );
      expect(response.headers.get('set-cookie')).toContain(
        'synapcity-look=renewed',
      );
    },
  );

  it('does not renew on a Server Action POST that may rewrite the cookie', async () => {
    const response = await proxy(request('POST'));

    expect(mocks.refreshedLookCookie).not.toHaveBeenCalled();
    expect(response.headers.has('set-cookie')).toBe(false);
  });
});
