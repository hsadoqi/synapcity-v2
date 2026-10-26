import type { SupabaseServerClient } from '@synapcity/server-supabase';
import { describe, expect, it, vi } from 'vitest';

import {
  listDashboardSummaries,
  setDashboardPinned,
} from './dashboard-records';

const row = {
  id: '9ab8c032-8759-44e9-808d-0573d13f290e',
  owner_id: '11111111-1111-4111-8111-111111111111',
  name: '  Weekly  ',
  description: 'Notes.',
  icon: 'Not An Icon',
  tags: [],
  created_at: '2026-10-18T05:12:33.123456+00:00',
  updated_at: '2026-10-18T05:12:33.123456+00:00',
  pinned_at: null,
  last_viewed_at: null,
  space_dashboards: [{ count: 1 }],
};

function clientReturning(result: { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {};
  for (const method of ['select', 'order', 'update', 'eq']) {
    builder[method] = vi.fn(() => builder);
  }
  builder.then = (resolve: (value: unknown) => unknown) => resolve(result);
  const from = vi.fn(() => builder);
  return { client: { from } as unknown as SupabaseServerClient, from };
}

describe('listDashboardSummaries', () => {
  it('reads the dashboards table and parses each row with the dashboard contract', async () => {
    const { client, from } = clientReturning({
      data: [{ ...row, icon: 'layout-dashboard' }],
      error: null,
    });

    await expect(listDashboardSummaries(client)).resolves.toMatchObject([
      { id: row.id, name: 'Weekly', spacesTotal: 1 },
    ]);
    expect(from).toHaveBeenCalledWith('dashboards');
  });

  it('rejects a row the contract refuses', async () => {
    const { client } = clientReturning({ data: [row], error: null });

    await expect(listDashboardSummaries(client)).rejects.toMatchObject({
      name: 'ZodError',
    });
  });
});

describe('setDashboardPinned', () => {
  it('writes to the dashboards table', async () => {
    const { client, from } = clientReturning({
      data: [{ pinned_at: null }],
      error: null,
    });

    await expect(setDashboardPinned(client, row.id, false)).resolves.toEqual({
      ok: true,
      pinnedAt: null,
    });
    expect(from).toHaveBeenCalledWith('dashboards');
  });
});
