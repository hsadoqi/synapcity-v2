import type { SupabaseServerClient } from '@synapcity/server-supabase';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const data = vi.hoisted(() => ({
  findSpace: vi.fn(),
  listSpaceDashboards: vi.fn(),
  listSpaceDocuments: vi.fn(),
  listSpaceSummaries: vi.fn(),
  listSpaces: vi.fn(),
  recordSpaceView: vi.fn(),
  setSpacePinned: vi.fn(),
}));
vi.mock('@synapcity/server-data', () => data);

import { serverSpaceSource } from './server-space-source';

const client = { request: true } as unknown as SupabaseServerClient;
const ID = '9ab8c032-8759-44e9-808d-0573d13f290e';

describe('serverSpaceSource', () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([
    ['list', 'listSpaces', []],
    ['listSummaries', 'listSpaceSummaries', []],
    ['find', 'findSpace', [ID]],
    ['setPinned', 'setSpacePinned', [ID, true]],
    ['listDocuments', 'listSpaceDocuments', [ID]],
    ['listDashboards', 'listSpaceDashboards', [ID]],
  ] as const)(
    '%s reads through %s with the supplied client',
    async (method, fn, args) => {
      const result = { sentinel: method };
      data[fn].mockResolvedValue(result);
      const source = serverSpaceSource(client) as unknown as Record<
        string,
        (...a: unknown[]) => Promise<unknown>
      >;

      await expect(source[method]!(...args)).resolves.toBe(result);
      expect(data[fn]).toHaveBeenCalledWith(client, ...args);
    },
  );

  it('records a view with the current time', async () => {
    data.recordSpaceView.mockResolvedValue({ ok: true });
    const before = Date.now();

    await expect(serverSpaceSource(client).recordView(ID)).resolves.toEqual({
      ok: true,
    });

    const [passedClient, id, now] = data.recordSpaceView.mock.calls[0]!;
    expect(passedClient).toBe(client);
    expect(id).toBe(ID);
    expect(now).toBeInstanceOf(Date);
    expect((now as Date).getTime()).toBeGreaterThanOrEqual(before);
  });
});
