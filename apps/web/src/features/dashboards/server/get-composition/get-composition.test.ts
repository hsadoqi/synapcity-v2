import { createComposition } from '@synapcity/domain-dashboards';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  loadComposition: vi.fn(),
  createClient: vi.fn(async () => ({ client: true })),
  fixtureModeEnabled: vi.fn(),
}));

vi.mock('@synapcity/server-data', () => ({
  loadComposition: mocks.loadComposition,
}));
vi.mock('@/lib/supabase/server', () => ({ createClient: mocks.createClient }));
vi.mock('@/lib/access/dev-fixture', () => ({
  fixtureModeEnabled: mocks.fixtureModeEnabled,
}));

import { getDashboardComposition } from './get-composition';

describe('getDashboardComposition', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.fixtureModeEnabled.mockReturnValue(false);
  });

  it('reads the stored composition and its revision', async () => {
    const composition = createComposition();
    mocks.loadComposition.mockResolvedValue({ composition, revision: 3 });

    await expect(getDashboardComposition('d1')).resolves.toEqual({
      composition,
      revision: 3,
    });
    expect(mocks.loadComposition).toHaveBeenCalledWith({ client: true }, 'd1');
  });

  it('reads as empty at revision 0 when nothing was saved', async () => {
    mocks.loadComposition.mockResolvedValue(null);
    await expect(getDashboardComposition('d1')).resolves.toEqual({
      composition: null,
      revision: 0,
    });
  });

  it('throws on a stored document that fails the contract, never reading it as empty', async () => {
    mocks.loadComposition.mockResolvedValue({
      composition: { secret: 'row data' },
      revision: 3,
    });
    const error = await getDashboardComposition('d1').catch((e: Error) => e);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toMatch(/invalid/);
    expect((error as Error).message).not.toMatch(/secret/);
  });

  it('lets a failed read throw to the error page', async () => {
    mocks.loadComposition.mockRejectedValue(new Error('Failed to load'));
    await expect(getDashboardComposition('d1')).rejects.toThrow(
      'Failed to load',
    );
  });

  it('reads nothing in development fixture mode', async () => {
    mocks.fixtureModeEnabled.mockReturnValue(true);
    await expect(getDashboardComposition('d1')).resolves.toEqual({
      composition: null,
      revision: 0,
    });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });
});
