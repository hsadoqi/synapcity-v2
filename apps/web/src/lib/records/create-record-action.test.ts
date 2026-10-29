import { AuthRetryableFetchError } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  createRecord: vi.fn(),
  revalidatePath: vi.fn(),
  fixtureModeEnabled: vi.fn(() => false),
  serverSpaceSource: vi.fn(),
}));

vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser: mocks.getUser } }),
}));
vi.mock('@/lib/access/dev-fixture', () => ({
  FIXTURE_MESSAGE: 'Saving is off in fixture mode.',
  fixtureModeEnabled: mocks.fixtureModeEnabled,
}));
vi.mock('@synapcity/server-data', () => ({
  createRecord: mocks.createRecord,
}));

// The real Space source, watched, so the test sees Spaces go through it.
vi.mock('@synapcity/features-spaces/server', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@synapcity/features-spaces/server')>();
  mocks.serverSpaceSource.mockImplementation(actual.serverSpaceSource);
  return { ...actual, serverSpaceSource: mocks.serverSpaceSource };
});

import { createRecord } from './create-record-action';

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  mocks.fixtureModeEnabled.mockReturnValue(false);
  mocks.getUser.mockResolvedValue({
    data: { user: { id: 'user-1' } },
    error: null,
  });
  mocks.createRecord.mockResolvedValue({ ok: true, id: 'new-id' });
});

describe('createRecord', () => {
  it.each([
    ['space', 'spaces'],
    ['document', 'documents'],
    ['dashboard', 'dashboards'],
  ])(
    'creates a %s in %s and refreshes the pages that list it',
    async (kind, table) => {
      await expect(createRecord(kind, 'Garden plans')).resolves.toEqual({
        ok: true,
        id: 'new-id',
      });
      expect(mocks.createRecord).toHaveBeenCalledWith(
        expect.anything(),
        table,
        {
          name: 'Garden plans',
        },
      );
      expect(mocks.revalidatePath).toHaveBeenCalledWith('/', 'layout');
    },
  );

  it('trims the name before saving it', async () => {
    await createRecord('document', '  Launch plan  ');

    expect(mocks.createRecord).toHaveBeenCalledWith(
      expect.anything(),
      'documents',
      { name: 'Launch plan' },
    );
  });

  it.each([
    ['space', ''],
    ['space', '   '],
    ['space', 42],
    ['note', 'Garden plans'],
    [undefined, 'Garden plans'],
  ])(
    'rejects bad input (%j, %j) without calling Supabase',
    async (kind, name) => {
      const result = await createRecord(kind, name);

      expect(result).toMatchObject({ ok: false });
      expect(mocks.getUser).not.toHaveBeenCalled();
      expect(mocks.createRecord).not.toHaveBeenCalled();
    },
  );

  it('asks for a name when the name is blank', async () => {
    await expect(createRecord('dashboard', ' ')).resolves.toEqual({
      ok: false,
      error: 'Give it a name.',
    });
  });

  it('asks a signed-out caller to sign in again and writes nothing', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });

    await expect(createRecord('space', 'Garden plans')).resolves.toMatchObject({
      ok: false,
      signedOut: true,
    });
    expect(mocks.createRecord).not.toHaveBeenCalled();
  });

  it('says try again during an outage and writes nothing', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: new AuthRetryableFetchError('fetch failed', 0),
    });

    const result = await createRecord('space', 'Garden plans');

    expect(result).toMatchObject({ ok: false });
    expect(result).not.toHaveProperty('signedOut');
    expect(mocks.createRecord).not.toHaveBeenCalled();
  });

  it('logs a database refusal by code only and reports a generic failure', async () => {
    mocks.createRecord.mockResolvedValue({
      ok: false,
      error: { code: '42501' },
    });

    await expect(createRecord('document', 'Launch plan')).resolves.toEqual({
      ok: false,
      error: 'Could not save your changes. Try again.',
    });
    expect(console.warn).toHaveBeenCalledWith('createRecord failed', {
      kind: 'document',
      code: '42501',
      status: undefined,
    });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it('creates a Space through the Space source, not a table of its own', async () => {
    await createRecord('space', 'Garden plans');
    expect(mocks.serverSpaceSource).toHaveBeenCalledTimes(1);

    await createRecord('document', 'Launch plan');
    expect(mocks.serverSpaceSource).toHaveBeenCalledTimes(1);
  });

  it('tells a signed-out caller to sign in again to save', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });

    await expect(createRecord('document', 'Launch plan')).resolves.toEqual({
      ok: false,
      error: 'Sign in again to save your changes.',
      signedOut: true,
    });
  });

  it('reports a cut-off save as unconfirmed and still refreshes the lists', async () => {
    mocks.createRecord.mockResolvedValue({
      ok: false,
      error: { code: '', status: 0 },
    });

    await expect(createRecord('space', 'Garden plans')).resolves.toEqual({
      ok: false,
      error: 'Could not save your changes. Try again.',
      unconfirmed: true,
    });
    expect(console.warn).toHaveBeenCalledWith('createRecord failed', {
      kind: 'space',
      code: '',
      status: 0,
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/', 'layout');
  });

  it('saves nothing in fixture mode', async () => {
    mocks.fixtureModeEnabled.mockReturnValue(true);

    await expect(createRecord('space', 'Garden plans')).resolves.toEqual({
      ok: false,
      error: 'Saving is off in fixture mode.',
    });
    expect(mocks.createRecord).not.toHaveBeenCalled();
  });
});
