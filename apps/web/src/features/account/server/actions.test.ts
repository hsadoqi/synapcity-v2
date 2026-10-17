import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  getUser: vi.fn(),
  updateUser: vi.fn(),
  refreshSession: vi.fn(),
  createClient: vi.fn(),
}));

vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => {
    mocks.createClient();
    return {
      auth: {
        getUser: mocks.getUser,
        updateUser: mocks.updateUser,
        refreshSession: mocks.refreshSession,
      },
    };
  },
}));

import { updateProfile } from './actions';

function form(name: string): FormData {
  const data = new FormData();
  data.set('name', name);
  return data;
}

const signedIn = (metadata: Record<string, unknown> = {}) => ({
  data: { user: { id: 'user-1', user_metadata: metadata } },
  error: null,
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue(signedIn());
  mocks.updateUser.mockResolvedValue({ data: {}, error: null });
  mocks.refreshSession.mockResolvedValue({ data: {}, error: null });
});

describe('updateProfile', () => {
  it('points a blank name at the name field without calling Supabase', async () => {
    const state = await updateProfile({}, form('   '));

    expect(state).toEqual({
      error: 'Enter your name.',
      fields: ['name'],
      name: '',
    });
    expect(mocks.getUser).not.toHaveBeenCalled();
  });

  it('points an over-long name at the name field', async () => {
    const state = await updateProfile({}, form('a'.repeat(101)));

    expect(state.fields).toEqual(['name']);
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it('asks to sign in again when there is no caller, about no one field', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: { code: 'session_not_found' },
    });

    const state = await updateProfile({}, form('Ada'));

    expect(state).toEqual({
      error: 'Sign in again to update your profile.',
      name: 'Ada',
    });
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it('keeps existing metadata and saves the trimmed name', async () => {
    mocks.getUser.mockResolvedValue(
      signedIn({ avatar_url: 'https://img.test/a.png', full_name: 'Old' }),
    );

    const state = await updateProfile({}, form('  Ada  '));

    expect(mocks.updateUser).toHaveBeenCalledWith({
      data: { avatar_url: 'https://img.test/a.png', full_name: 'Ada' },
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/', 'layout');
    expect(state).toEqual({ message: 'Name updated.', name: 'Ada' });
  });

  it('reports a provider failure as a form error, about no one field', async () => {
    mocks.updateUser.mockResolvedValue({
      data: {},
      error: { code: 'over_request_rate_limit' },
    });

    const state = await updateProfile({}, form('Ada'));

    expect(state.error).toEqual(expect.any(String));
    expect(state.fields).toBeUndefined();
    expect(state.name).toBe('Ada');
    expect(mocks.refreshSession).not.toHaveBeenCalled();
  });

  it('confirms the save even when the token refresh fails', async () => {
    mocks.refreshSession.mockResolvedValue({
      data: {},
      error: { code: 'refresh_token_not_found' },
    });

    const state = await updateProfile({}, form('Ada'));

    expect(state).toEqual({
      message: 'Name saved. It may take a little while to show everywhere.',
      name: 'Ada',
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/', 'layout');
  });
});

describe('updateProfile in development fixture mode', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('SYNAPCITY_DEV_AUTH', 'fixture');
  });
  afterEach(() => vi.unstubAllEnvs());

  it('is rejected before a Supabase client is built', async () => {
    const result = await updateProfile({}, form('Ada'));

    expect(result.error).toContain('Fixture mode');
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });
});
