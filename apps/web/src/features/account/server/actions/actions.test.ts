import { AuthRetryableFetchError } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  getUser: vi.fn(),
  updateUser: vi.fn(),
  refreshSession: vi.fn(),
  profileEq: vi.fn(),
  profileSelect: vi.fn(),
  profileUpdate: vi.fn(),
  from: vi.fn(),
  upload: vi.fn(),
  getPublicUrl: vi.fn(),
  list: vi.fn(),
  remove: vi.fn(),
  bucket: vi.fn(),
}));

vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: {
      getUser: mocks.getUser,
      updateUser: mocks.updateUser,
      refreshSession: mocks.refreshSession,
    },
    from: mocks.from,
    storage: { from: mocks.bucket },
  }),
}));

import { updateAvatar } from './avatar-actions';
import { updateName } from './name-actions';
import { completeProfile, skipProfileSetup } from './setup-actions';

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
  mocks.profileSelect.mockResolvedValue({
    data: [{ id: 'user-1' }],
    error: null,
  });
  mocks.profileEq.mockReturnValue({ select: mocks.profileSelect });
  mocks.profileUpdate.mockReturnValue({ eq: mocks.profileEq });
  mocks.from.mockReturnValue({ update: mocks.profileUpdate });
  mocks.upload.mockResolvedValue({ error: null });
  mocks.getPublicUrl.mockImplementation((path: string) => ({
    data: { publicUrl: `https://cdn.test/avatars/${path}` },
  }));
  mocks.list.mockResolvedValue({ data: [], error: null });
  mocks.remove.mockResolvedValue({ error: null });
  mocks.bucket.mockReturnValue({
    upload: mocks.upload,
    getPublicUrl: mocks.getPublicUrl,
    list: mocks.list,
    remove: mocks.remove,
  });
});

describe('updateName', () => {
  it('points a blank name at the name field without calling Supabase', async () => {
    const state = await updateName({}, form('   '));

    expect(state).toEqual({
      error: 'Enter your name.',
      fields: ['name'],
      name: '',
    });
    expect(mocks.getUser).not.toHaveBeenCalled();
  });

  it('points an over-long name at the name field', async () => {
    const state = await updateName({}, form('a'.repeat(81)));

    expect(state.fields).toEqual(['name']);
    expect(mocks.profileUpdate).not.toHaveBeenCalled();
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it('asks to sign in again when there is no caller, about no one field', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: { code: 'session_not_found' },
    });

    const state = await updateName({}, form('Ada'));

    expect(state).toEqual({
      error: 'Sign in again to update your profile.',
      signedOut: true,
      name: 'Ada',
    });
    expect(mocks.profileUpdate).not.toHaveBeenCalled();
  });

  it('saves the trimmed name to the caller own profile row first, then mirrors it', async () => {
    mocks.getUser.mockResolvedValue(
      signedIn({ avatar_url: 'https://img.test/a.png', full_name: 'Old' }),
    );

    const state = await updateName({}, form('  Ada  '));

    expect(mocks.from).toHaveBeenCalledWith('profiles');
    expect(mocks.profileUpdate).toHaveBeenCalledWith({ display_name: 'Ada' });
    expect(mocks.profileEq).toHaveBeenCalledWith('id', 'user-1');
    expect(mocks.updateUser).toHaveBeenCalledWith({
      data: { avatar_url: 'https://img.test/a.png', full_name: 'Ada' },
    });
    expect(mocks.profileUpdate.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.updateUser.mock.invocationCallOrder[0]!,
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/', 'layout');
    expect(state).toEqual({
      saved: true,
      message: 'Name updated.',
      name: 'Ada',
    });
  });

  it('reports a failed profile save as a form error and mirrors nothing', async () => {
    mocks.profileSelect.mockResolvedValue({
      data: null,
      error: { code: '42501' },
    });

    const state = await updateName({}, form('Ada'));

    expect(state.error).toEqual(expect.any(String));
    expect(state.fields).toBeUndefined();
    expect(state.name).toBe('Ada');
    expect(mocks.updateUser).not.toHaveBeenCalled();
    expect(mocks.refreshSession).not.toHaveBeenCalled();
  });

  it('confirms the save even when the token refresh fails', async () => {
    mocks.refreshSession.mockResolvedValue({
      data: {},
      error: { code: 'refresh_token_not_found' },
    });

    const state = await updateName({}, form('Ada'));

    expect(state).toEqual({
      saved: true,
      message: 'Name saved. It may take a little while to show everywhere.',
      name: 'Ada',
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/', 'layout');
  });

  it('confirms the save even when mirroring to the session fails', async () => {
    mocks.updateUser.mockResolvedValue({
      data: {},
      error: { code: 'over_request_rate_limit' },
    });

    const state = await updateName({}, form('Ada'));

    expect(state.message).toContain('Name saved.');
    expect(state.error).toBeUndefined();
  });
});

// PNG signature plus padding: enough for the type check, not a decodable image.
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0];

function avatarForm(
  bytes: number[],
  options: { type?: string; name?: string } = {},
): FormData {
  const data = new FormData();
  data.set(
    'avatar',
    new File([new Uint8Array(bytes)], options.name ?? 'me.png', {
      type: options.type ?? 'image/png',
    }),
  );
  return data;
}

describe('updateAvatar', () => {
  it('rejects a missing file without uploading anything', async () => {
    const state = await updateAvatar(
      { avatarUrl: 'https://old.test/a.png' },
      new FormData(),
    );

    expect(state).toEqual({
      error: 'Choose an image.',
      fields: ['avatar'],
      avatarUrl: 'https://old.test/a.png',
    });
    expect(mocks.upload).not.toHaveBeenCalled();
  });

  it('rejects a type that is not PNG, JPEG or WebP', async () => {
    const state = await updateAvatar(
      {},
      avatarForm([60, 115, 118, 103], { type: 'image/svg+xml', name: 'a.svg' }),
    );

    expect(state.error).toBe('Use a PNG, JPEG or WebP image.');
    expect(state.fields).toEqual(['avatar']);
    expect(mocks.upload).not.toHaveBeenCalled();
  });

  it('rejects a file larger than the limit', async () => {
    const big = new Array(2 * 1024 * 1024 + 1).fill(0);
    const state = await updateAvatar({}, avatarForm(big));

    expect(state.error).toBe('Use an image of at most 2 MB.');
    expect(mocks.upload).not.toHaveBeenCalled();
  });

  it('does not trust the declared type: a script labelled image/png is refused', async () => {
    const state = await updateAvatar(
      {},
      avatarForm([...Buffer.from('<script>alert(1)</script>')], {
        type: 'image/png',
      }),
    );

    expect(state.error).toBe('Use a PNG, JPEG or WebP image.');
    expect(mocks.upload).not.toHaveBeenCalled();
  });

  it('asks to sign in again when there is no caller', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: { code: 'session_not_found' },
    });

    const state = await updateAvatar({}, avatarForm(PNG));

    expect(state.error).toBe('Sign in again to update your profile.');
    expect(mocks.upload).not.toHaveBeenCalled();
  });

  it('uploads into the caller own folder, records the URL, mirrors it and cleans up', async () => {
    mocks.getUser.mockResolvedValue(
      signedIn({ full_name: 'Ada', avatar_url: 'https://old.test/a.png' }),
    );
    mocks.list.mockResolvedValue({
      data: [{ name: 'old-1.png' }],
      error: null,
    });

    const state = await updateAvatar({}, avatarForm(PNG));

    const [path, , options] = mocks.upload.mock.calls[0]!;
    expect(mocks.bucket).toHaveBeenCalledWith('avatars');
    expect(path).toMatch(/^user-1\/[0-9a-f-]{36}\.png$/);
    expect(options).toMatchObject({ contentType: 'image/png', upsert: false });

    const url = `https://cdn.test/avatars/${path}`;
    expect(mocks.profileUpdate).toHaveBeenCalledWith({ avatar_url: url });
    expect(mocks.profileEq).toHaveBeenCalledWith('id', 'user-1');
    expect(mocks.remove).toHaveBeenCalledWith(['user-1/old-1.png']);
    expect(mocks.updateUser).toHaveBeenCalledWith({
      data: { full_name: 'Ada', avatar_url: url },
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/', 'layout');
    expect(state).toEqual({
      saved: true,
      avatarUrl: url,
      message: 'Photo updated.',
    });
  });

  it('keeps the file just uploaded when it clears the old ones', async () => {
    mocks.list.mockImplementation(async () => {
      const path = mocks.upload.mock.calls[0]![0] as string;
      return {
        data: [{ name: path.split('/')[1] }, { name: 'old.png' }],
        error: null,
      };
    });

    await updateAvatar({}, avatarForm(PNG));

    expect(mocks.remove).toHaveBeenCalledWith(['user-1/old.png']);
  });

  it('deletes the new file and keeps the old picture when the profile row cannot be saved', async () => {
    mocks.profileSelect.mockResolvedValue({
      data: null,
      error: { code: '23514' },
    });

    const state = await updateAvatar(
      { avatarUrl: 'https://old.test/a.png' },
      avatarForm(PNG),
    );

    const path = mocks.upload.mock.calls[0]![0] as string;
    expect(mocks.remove).toHaveBeenCalledWith([path]);
    expect(state.error).toEqual(expect.any(String));
    expect(state.avatarUrl).toBe('https://old.test/a.png');
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it('reports a failed upload without touching the profile', async () => {
    mocks.upload.mockResolvedValue({ error: { message: 'bucket not found' } });

    const state = await updateAvatar({}, avatarForm(PNG));

    expect(state.error).toEqual(expect.any(String));
    expect(mocks.profileUpdate).not.toHaveBeenCalled();
  });

  it('removes the picture and every stored file when asked', async () => {
    mocks.getUser.mockResolvedValue(
      signedIn({ full_name: 'Ada', avatar_url: 'https://old.test/a.png' }),
    );
    mocks.list.mockResolvedValue({
      data: [{ name: 'a.png' }, { name: 'b.webp' }],
      error: null,
    });
    const data = new FormData();
    data.set('intent', 'remove');

    const state = await updateAvatar(
      { avatarUrl: 'https://old.test/a.png' },
      data,
    );

    expect(mocks.upload).not.toHaveBeenCalled();
    expect(mocks.profileUpdate).toHaveBeenCalledWith({ avatar_url: null });
    expect(mocks.remove).toHaveBeenCalledWith([
      'user-1/a.png',
      'user-1/b.webp',
    ]);
    expect(mocks.updateUser).toHaveBeenCalledWith({
      data: { full_name: 'Ada' },
    });
    expect(state).toEqual({
      saved: true,
      avatarUrl: null,
      message: 'Photo removed.',
    });
  });
});

describe('updateAvatar removal returns to the default', () => {
  const remove = () => {
    const data = new FormData();
    data.set('intent', 'remove');
    return data;
  };

  it('goes back to the GitHub picture when the account has one', async () => {
    const github = 'https://avatars.githubusercontent.com/u/1';
    mocks.getUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-1',
          user_metadata: { avatar_url: 'https://old.test/uploaded.png' },
          identities: [
            { provider: 'email', identity_data: {} },
            { provider: 'github', identity_data: { avatar_url: github } },
          ],
        },
      },
      error: null,
    });

    const state = await updateAvatar({}, remove());

    expect(mocks.profileUpdate).toHaveBeenCalledWith({ avatar_url: github });
    expect(mocks.updateUser).toHaveBeenCalledWith({
      data: { avatar_url: github },
    });
    expect(state.avatarUrl).toBe(github);
  });

  it('uses the Google picture when that is the linked account', async () => {
    const google = 'https://lh3.googleusercontent.com/a/b';
    mocks.getUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-1',
          user_metadata: {},
          identities: [
            { provider: 'google', identity_data: { picture: google } },
          ],
        },
      },
      error: null,
    });

    const state = await updateAvatar({}, remove());

    expect(state.avatarUrl).toBe(google);
  });
});

function setupForm(name: string, file?: File): FormData {
  const data = new FormData();
  data.set('name', name);
  if (file) data.set('avatar', file);
  return data;
}

const emptyFile = () => new File([], '', { type: 'application/octet-stream' });
const pngFile = () =>
  new File([new Uint8Array(PNG)], 'me.png', { type: 'image/png' });

describe('completeProfile', () => {
  it('points a blank name at the name field and echoes the current picture', async () => {
    const state = await completeProfile(
      { avatarUrl: 'https://gh.test/a.png' },
      setupForm('  '),
    );

    expect(state).toEqual({
      error: 'Enter your name.',
      fields: ['name'],
      name: '',
      avatarUrl: 'https://gh.test/a.png',
    });
    expect(mocks.getUser).not.toHaveBeenCalled();
  });

  it('saves just the name when no file was chosen, leaving the picture alone', async () => {
    const state = await completeProfile(
      { avatarUrl: 'https://gh.test/a.png' },
      setupForm(' Ada ', emptyFile()),
    );

    expect(mocks.upload).not.toHaveBeenCalled();
    expect(mocks.profileUpdate).toHaveBeenCalledTimes(1);
    expect(mocks.profileUpdate).toHaveBeenCalledWith({ display_name: 'Ada' });
    expect(state).toEqual({
      saved: true,
      name: 'Ada',
      avatarUrl: 'https://gh.test/a.png',
      message: 'Profile saved.',
    });
  });

  it('saves the name and a chosen photo, mirroring both to the session in one update', async () => {
    mocks.getUser.mockResolvedValue(signedIn({ full_name: 'Old' }));

    const state = await completeProfile({}, setupForm('Ada', pngFile()));

    const path = mocks.upload.mock.calls[0]![0] as string;
    const url = `https://cdn.test/avatars/${path}`;
    expect(mocks.profileUpdate).toHaveBeenCalledWith({ avatar_url: url });
    expect(mocks.profileUpdate).toHaveBeenCalledWith({ display_name: 'Ada' });
    expect(mocks.updateUser).toHaveBeenCalledTimes(1);
    expect(mocks.updateUser).toHaveBeenCalledWith({
      data: { full_name: 'Ada', avatar_url: url, profile_confirmed: true },
    });
    expect(mocks.refreshSession).toHaveBeenCalledTimes(1);
    expect(state).toMatchObject({ saved: true, name: 'Ada', avatarUrl: url });
  });

  it('saves nothing when the photo is refused, and points at the photo field', async () => {
    const script = new File(['<script>1</script>'], 'x.png', {
      type: 'image/png',
    });

    const state = await completeProfile({}, setupForm('Ada', script));

    expect(state.fields).toEqual(['avatar']);
    expect(state.name).toBe('Ada');
    expect(mocks.profileUpdate).not.toHaveBeenCalled();
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it('asks to sign in again when there is no caller', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: { code: 'session_not_found' },
    });

    const state = await completeProfile({}, setupForm('Ada'));

    expect(state.error).toBe('Sign in again to update your profile.');
  });
});

describe('completeProfile when the name cannot be saved after the photo was', () => {
  it('reports the failure but keeps showing the photo that did save', async () => {
    // First profile write (the photo) works, the second (the name) fails.
    mocks.profileSelect
      .mockResolvedValueOnce({ data: [{ id: 'user-1' }], error: null })
      .mockResolvedValueOnce({ data: null, error: { code: '42501' } });

    const state = await completeProfile({}, setupForm('Ada', pngFile()));

    const path = mocks.upload.mock.calls[0]![0] as string;
    expect(state.error).toEqual(expect.any(String));
    expect(state.saved).toBeUndefined();
    expect(state.name).toBe('Ada');
    expect(state.avatarUrl).toBe(`https://cdn.test/avatars/${path}`);
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });
});

const SIGN_IN_AGAIN = 'Sign in again to update your profile.';
const SAVE_FAILED = 'Could not save your changes. Try again.';

const removeForm = () => {
  const data = new FormData();
  data.set('intent', 'remove');
  return data;
};

describe('when the session cannot be checked', () => {
  it.each([
    ['updateName', () => updateName({}, form('Ada'))],
    ['updateAvatar', () => updateAvatar({}, avatarForm(PNG))],
    ['completeProfile', () => completeProfile({}, setupForm('Ada'))],
  ])('%s tells someone with no session to sign in again', async (_n, run) => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: { code: 'session_not_found' },
    });

    const state = await run();

    expect(state.error).toBe(SIGN_IN_AGAIN);
    expect(state.signedOut).toBe(true);
  });

  it.each([
    ['updateName', () => updateName({}, form('Ada'))],
    ['updateAvatar', () => updateAvatar({}, avatarForm(PNG))],
    ['completeProfile', () => completeProfile({}, setupForm('Ada'))],
  ])(
    '%s does not call a dropped connection a signed-out session',
    async (_name, run) => {
      mocks.getUser.mockResolvedValue({
        data: { user: null },
        error: new AuthRetryableFetchError('fetch failed', 0),
      });

      const state = await run();

      expect(state.error).toBe(SAVE_FAILED);
      // Signing in again would not help during an outage, so no link is offered.
      expect(state.signedOut).toBeUndefined();
      expect(mocks.profileUpdate).not.toHaveBeenCalled();
      expect(mocks.upload).not.toHaveBeenCalled();
    },
  );
});

describe('an update that changes no row', () => {
  beforeEach(() => {
    // Postgres reports no error when the filter matches nothing.
    mocks.profileSelect.mockResolvedValue({ data: [], error: null });
  });

  it('is not reported as a saved name', async () => {
    const state = await updateName({}, form('Ada'));

    expect(state.error).toBe(SAVE_FAILED);
    expect(state.saved).toBeUndefined();
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it('is not reported as a saved photo, and the upload is not left behind', async () => {
    const state = await updateAvatar({}, avatarForm(PNG));

    const path = mocks.upload.mock.calls[0]![0] as string;
    expect(state.error).toBe(SAVE_FAILED);
    expect(state.saved).toBeUndefined();
    expect(mocks.remove).toHaveBeenCalledWith([path]);
  });

  it('is not reported as a removed photo', async () => {
    const state = await updateAvatar({}, removeForm());

    expect(state.error).toBe(SAVE_FAILED);
    expect(state.saved).toBeUndefined();
  });
});

describe('failure logging', () => {
  it('records the operation and code but never the message, session or name', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mocks.profileSelect.mockResolvedValue({
      data: null,
      error: {
        code: '42501',
        status: 403,
        message: 'secret-detail ada@example.com',
      },
    });

    await updateName({}, form('Secret Name'));

    expect(warn).toHaveBeenCalledWith('saveName failed', {
      code: '42501',
      status: 403,
    });
    expect(JSON.stringify(warn.mock.calls)).not.toMatch(
      /secret|ada@example|Secret Name/i,
    );
    warn.mockRestore();
  });

  it('records a missing profile row by its own code', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mocks.profileSelect.mockResolvedValue({ data: [], error: null });

    await updateName({}, form('Ada'));

    expect(warn).toHaveBeenCalledWith('saveName failed', {
      code: 'profile_row_missing',
      status: undefined,
    });
    warn.mockRestore();
  });

  it('records a failed token mirror by operation, and still confirms the save', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mocks.updateUser.mockResolvedValue({
      data: {},
      error: { code: 'over_request_rate_limit', status: 429 },
    });

    const state = await updateName({}, form('Ada'));

    expect(warn).toHaveBeenCalledWith('mirrorToSession.updateUser failed', {
      code: 'over_request_rate_limit',
      status: 429,
    });
    expect(state.saved).toBe(true);
    warn.mockRestore();
  });
});

describe('the name-and-photo step is marked done', () => {
  it('when it is finished, even with just a name', async () => {
    await completeProfile({}, setupForm('Ada'));

    expect(mocks.updateUser).toHaveBeenCalledWith({
      data: { full_name: 'Ada', profile_confirmed: true },
    });
  });

  it('but not by an ordinary edit of the name or the photo', async () => {
    await updateName({}, form('Ada'));
    await updateAvatar({}, avatarForm(PNG));

    for (const [argument] of mocks.updateUser.mock.calls) {
      expect(JSON.stringify(argument)).not.toContain('profile_confirmed');
    }
  });
});

describe('skipProfileSetup', () => {
  it('marks the step done and changes nothing else', async () => {
    mocks.getUser.mockResolvedValue(
      signedIn({ full_name: 'Ada', avatar_url: 'https://gh.test/a.png' }),
    );

    const result = await skipProfileSetup();

    expect(result).toEqual({ saved: true });
    expect(mocks.updateUser).toHaveBeenCalledWith({
      data: {
        full_name: 'Ada',
        avatar_url: 'https://gh.test/a.png',
        profile_confirmed: true,
      },
    });
    expect(mocks.profileUpdate).not.toHaveBeenCalled();
    expect(mocks.upload).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/', 'layout');
  });

  it('reports not saved, and touches nothing, when there is no session', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: { code: 'session_not_found' },
    });

    expect(await skipProfileSetup()).toEqual({ saved: false });
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it('reports not saved when the session cannot be updated', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mocks.updateUser.mockResolvedValue({
      data: {},
      error: { code: 'over_request_rate_limit', status: 429 },
    });

    expect(await skipProfileSetup()).toEqual({ saved: false });
    warn.mockRestore();
  });
});
