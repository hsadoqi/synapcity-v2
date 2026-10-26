import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  deleteOwnAccount: vi.fn(),
  removeOldAvatars: vi.fn(),
  revalidatePath: vi.fn(),
}));

class Redirected extends Error {
  constructor(readonly url: string) {
    super(`redirect:${url}`);
  }
}

vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Redirected(url);
  },
}));
vi.mock('@/features/auth/server/operations', () => ({
  deleteOwnAccount: mocks.deleteOwnAccount,
}));
vi.mock('@/features/account/server/save-avatar', () => ({
  removeOldAvatars: mocks.removeOldAvatars,
}));

import { confirmAccountDeletion } from './actions';

const run = () => confirmAccountDeletion({}, new FormData());

describe('confirmAccountDeletion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.removeOldAvatars.mockResolvedValue(undefined);
  });

  it('on success, goes to sign-in saying the account is gone', async () => {
    mocks.deleteOwnAccount.mockResolvedValue({ kind: 'deleted' });

    await expect(run()).rejects.toMatchObject({
      url: '/auth/login?notice=account-deleted',
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/', 'layout');
  });

  it("hands the account's stored-file cleanup to the deletion, for the caller's own folder only", async () => {
    mocks.deleteOwnAccount.mockImplementation(
      async (input: {
        cleanup: (supabase: unknown, id: string) => Promise<void>;
      }) => {
        await input.cleanup('client', 'user-1');
        return { kind: 'deleted' };
      },
    );

    await run().catch(() => undefined);

    expect(mocks.removeOldAvatars).toHaveBeenCalledExactlyOnceWith(
      'client',
      'user-1',
    );
  });

  it('takes no input, so there is no id to forge', async () => {
    mocks.deleteOwnAccount.mockResolvedValue({ kind: 'link-required' });

    await run();

    expect(mocks.deleteOwnAccount).toHaveBeenCalledExactlyOnceWith({
      cleanup: expect.any(Function),
    });
  });

  it.each([
    ['link-required', /expired.*nothing was deleted/i, true],
    ['signed-out', /signed out.*nothing was deleted/i, undefined],
    ['unavailable', /nothing was deleted/i, undefined],
  ] as const)(
    '%s: says nothing was deleted',
    async (kind, wording, linkRequired) => {
      mocks.deleteOwnAccount.mockResolvedValue({ kind });

      const state = await run();

      expect(state.error).toMatch(wording);
      expect(state.linkRequired).toBe(linkRequired);
      expect(mocks.revalidatePath).not.toHaveBeenCalled();
    },
  );

  it('is honest about any other failure, and logs only its code', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mocks.deleteOwnAccount.mockResolvedValue({
      kind: 'provider-error',
      code: 'PGRST202',
    });

    const state = await run();

    expect(state.error).toBe(
      'Could not delete your account. Try again in a moment.',
    );
    expect(warn).toHaveBeenCalledWith('confirmAccountDeletion failed', {
      code: 'PGRST202',
    });
  });
});

describe('confirmAccountDeletion in development fixture mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('SYNAPCITY_DEV_AUTH', 'fixture');
  });
  afterEach(() => vi.unstubAllEnvs());

  it('deletes nothing and never reaches the deletion operation', async () => {
    const result = await run();

    expect(result.error).toContain('Fixture mode');
    expect(mocks.deleteOwnAccount).not.toHaveBeenCalled();
    expect(mocks.removeOldAvatars).not.toHaveBeenCalled();
  });
});
