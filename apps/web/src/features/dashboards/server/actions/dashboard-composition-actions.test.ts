import { AuthRetryableFetchError } from '@supabase/supabase-js';
import {
  addWidget,
  createComposition,
  createWidget,
  type DashboardComposition,
} from '@synapcity/domain-dashboards';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  saveComposition: vi.fn(),
  recordRecordView: vi.fn(),
  getVerifiedIdentity: vi.fn(),
  fixtureModeEnabled: vi.fn(() => false),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser: mocks.getUser } }),
}));
vi.mock('@/lib/access/dev-fixture', () => ({
  FIXTURE_MESSAGE: 'Saving is off in fixture mode.',
  fixtureModeEnabled: mocks.fixtureModeEnabled,
}));
vi.mock('@/features/auth/server/session', () => ({
  getVerifiedIdentity: mocks.getVerifiedIdentity,
}));
vi.mock('@synapcity/server-data', () => ({
  saveComposition: mocks.saveComposition,
  recordRecordView: mocks.recordRecordView,
}));

import {
  recordDashboardView,
  saveDashboardComposition,
} from './dashboard-composition-actions';

const ID = '9ab8c032-8759-44e9-808d-0573d13f290e';
// Link widgets create and read no records, so the table set is never touched.
const NO_RECORDS = {} as Parameters<typeof createWidget>[1];
const ctx = { ownerId: '11111111-1111-4111-8111-111111111111', now: 0 };

function composition(...types: Parameters<typeof createWidget>[0][]) {
  return types.reduce<DashboardComposition>(
    (c, type) => addWidget(c, createWidget(type, NO_RECORDS, ctx).widget),
    createComposition(),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  mocks.fixtureModeEnabled.mockReturnValue(false);
  mocks.getUser.mockResolvedValue({
    data: { user: { id: 'user-1' } },
    error: null,
  });
  mocks.saveComposition.mockResolvedValue({ ok: true, revision: 4 });
  mocks.getVerifiedIdentity.mockResolvedValue({ status: 'verified' });
  mocks.recordRecordView.mockResolvedValue({ ok: true });
});

describe('saveDashboardComposition', () => {
  it('saves a composition of link widgets against its base revision and reports the new revision', async () => {
    const c = composition('pinned', 'spaces');

    await expect(saveDashboardComposition(ID, c, 3)).resolves.toEqual({
      ok: true,
      revision: 4,
    });
    expect(mocks.saveComposition).toHaveBeenCalledWith(
      expect.anything(),
      ID,
      c,
      3,
    );
  });

  it('saves a composition that went through JSON, as it arrives from the browser', async () => {
    const c = composition('last-opened');
    await expect(
      saveDashboardComposition(ID, JSON.parse(JSON.stringify(c)), 0),
    ).resolves.toMatchObject({ ok: true });
  });

  it('reports a conflict as a conflict, not a failure', async () => {
    mocks.saveComposition.mockResolvedValue({ ok: false, reason: 'conflict' });
    await expect(
      saveDashboardComposition(ID, composition('pinned'), 3),
    ).resolves.toEqual({ ok: false, reason: 'conflict' });
  });

  it('reports a database failure with a generic message and logs only code and status', async () => {
    mocks.saveComposition.mockResolvedValue({
      ok: false,
      reason: 'failed',
      error: { code: '42501', status: 403 },
    });
    await expect(
      saveDashboardComposition(ID, composition('pinned'), 3),
    ).resolves.toEqual({
      ok: false,
      reason: 'failed',
      message: 'Could not save your changes. Try again.',
    });
    expect(console.warn).toHaveBeenCalledWith(
      'saveDashboardComposition failed',
      { code: '42501', status: 403 },
    );
  });

  describe('refuses what the browser could forge, without touching the database', () => {
    const cases: [string, () => [unknown, unknown, unknown]][] = [
      ['an id that is not a uuid', () => ['nope', composition('pinned'), 0]],
      ['a missing id', () => [undefined, composition('pinned'), 0]],
      ['a composition that is not one', () => [ID, { widgets: 'x' }, 0]],
      ['no composition', () => [ID, null, 0]],
      ['a widget type that owns data', () => [ID, composition('tasks'), 0]],
      ['a negative revision', () => [ID, composition('pinned'), -1]],
      ['a fractional revision', () => [ID, composition('pinned'), 1.5]],
      [
        'a revision that is not a number',
        () => [ID, composition('pinned'), '3'],
      ],
    ];
    it.each(cases)('%s', async (_name, args) => {
      const result = await saveDashboardComposition(...args());
      expect(result).toMatchObject({ ok: false, reason: 'failed' });
      expect(mocks.saveComposition).not.toHaveBeenCalled();
      expect(mocks.getUser).not.toHaveBeenCalled();
    });

    it('a hidden widget (no widget status is persisted)', async () => {
      const c = composition('pinned');
      const hidden = {
        ...c,
        widgets: c.widgets.map((w) => ({ ...w, status: 'hidden' as const })),
      };
      const result = await saveDashboardComposition(ID, hidden, 0);
      expect(result).toMatchObject({ ok: false, reason: 'failed' });
      expect(mocks.saveComposition).not.toHaveBeenCalled();
    });
  });

  it('asks the person to sign in again when the session is gone, and saves nothing', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(
      saveDashboardComposition(ID, composition('pinned'), 0),
    ).resolves.toEqual({
      ok: false,
      reason: 'failed',
      message: 'Sign in again to save your changes.',
    });
    expect(mocks.saveComposition).not.toHaveBeenCalled();
  });

  it('says to try again, not to sign in, when the provider is unavailable', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: new AuthRetryableFetchError('offline', 503),
    });
    await expect(
      saveDashboardComposition(ID, composition('pinned'), 0),
    ).resolves.toMatchObject({
      message: 'Could not save your changes. Try again.',
    });
    expect(mocks.saveComposition).not.toHaveBeenCalled();
  });

  it('saves nothing in development fixture mode', async () => {
    mocks.fixtureModeEnabled.mockReturnValue(true);
    await expect(
      saveDashboardComposition(ID, composition('pinned'), 0),
    ).resolves.toEqual({
      ok: false,
      reason: 'failed',
      message: 'Saving is off in fixture mode.',
    });
    expect(mocks.getUser).not.toHaveBeenCalled();
    expect(mocks.saveComposition).not.toHaveBeenCalled();
  });
});

describe('recordDashboardView', () => {
  it('records the view for a verified caller', async () => {
    await recordDashboardView(ID);
    expect(mocks.recordRecordView).toHaveBeenCalledWith(
      expect.anything(),
      'dashboards',
      ID,
      expect.any(Date),
    );
  });

  it('does nothing for an id that is not a uuid, a signed-out caller, or fixture mode', async () => {
    await recordDashboardView('nope');
    mocks.getVerifiedIdentity.mockResolvedValue({ status: 'unverified' });
    await recordDashboardView(ID);
    mocks.getVerifiedIdentity.mockResolvedValue({ status: 'verified' });
    mocks.fixtureModeEnabled.mockReturnValue(true);
    await recordDashboardView(ID);
    expect(mocks.recordRecordView).not.toHaveBeenCalled();
  });

  it('logs a failed write and says nothing to the person', async () => {
    mocks.recordRecordView.mockResolvedValue({
      ok: false,
      error: { code: '42501' },
    });
    await expect(recordDashboardView(ID)).resolves.toBeUndefined();
    expect(console.warn).toHaveBeenCalledWith('recordDashboardView failed', {
      code: '42501',
      status: undefined,
    });
  });
});
