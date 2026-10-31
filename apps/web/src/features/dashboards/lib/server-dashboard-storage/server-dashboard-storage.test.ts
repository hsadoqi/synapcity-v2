import { createComposition } from '@synapcity/domain-dashboards';
import { describe, expect, it, vi } from 'vitest';

import { serverDashboardStorage } from './server-dashboard-storage';

describe('serverDashboardStorage', () => {
  it('loads the snapshot the page read, with its revision and no records', async () => {
    const composition = createComposition();
    const storage = serverDashboardStorage({
      composition,
      revision: 4,
      save: vi.fn(),
    });
    await expect(storage.load('d1')).resolves.toEqual({
      composition,
      records: null,
      revision: 4,
    });
  });

  it('loads an empty dashboard at revision 0', async () => {
    const storage = serverDashboardStorage({
      composition: null,
      revision: 0,
      save: vi.fn(),
    });
    await expect(storage.load('d1')).resolves.toMatchObject({
      composition: null,
      revision: 0,
    });
  });

  it('saves through the action with the id, composition and base revision, and passes its answer on', async () => {
    const save = vi.fn().mockResolvedValue({ ok: true, revision: 5 });
    const storage = serverDashboardStorage({
      composition: null,
      revision: 4,
      save,
    });
    const composition = createComposition();
    await expect(
      storage.saveComposition('d1', composition, 4),
    ).resolves.toEqual({
      ok: true,
      revision: 5,
    });
    expect(save).toHaveBeenCalledWith('d1', composition, 4);
  });

  it('passes a conflict on untouched', async () => {
    const save = vi.fn().mockResolvedValue({ ok: false, reason: 'conflict' });
    const storage = serverDashboardStorage({
      composition: null,
      revision: 4,
      save,
    });
    await expect(
      storage.saveComposition('d1', createComposition(), 4),
    ).resolves.toEqual({
      ok: false,
      reason: 'conflict',
    });
  });

  it('reports an action that throws (the network dropped) as not saved', async () => {
    const save = vi.fn().mockRejectedValue(new Error('network'));
    const storage = serverDashboardStorage({
      composition: null,
      revision: 4,
      save,
    });
    await expect(
      storage.saveComposition('d1', createComposition(), 4),
    ).resolves.toEqual({
      ok: false,
      reason: 'failed',
    });
  });

  it('does not store records', async () => {
    const storage = serverDashboardStorage({
      composition: null,
      revision: 0,
      save: vi.fn(),
    });
    await expect(storage.saveRecords({} as never)).resolves.toBeUndefined();
  });
});
