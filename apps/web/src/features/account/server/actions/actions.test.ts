import {
  AuthRetryableFetchError,
  AuthSessionMissingError,
} from '@supabase/supabase-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  revalidatePath: vi.fn(),
  getUser: vi.fn(),
  updateUser: vi.fn(),
  refreshSession: vi.fn(),
  profileEq: vi.fn(),
  profileSelect: vi.fn(),
  profileUpdate: vi.fn(),
  profileRead: vi.fn(),
  from: vi.fn(),
  upload: vi.fn(),
  getPublicUrl: vi.fn(),
  list: vi.fn(),
  remove: vi.fn(),
  bucket: vi.fn(),
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
      from: mocks.from,
      storage: { from: mocks.bucket },
    };
  },
}));

import { updateAvatar } from './avatar-actions';
import { updateName } from './name-actions';
import { completeProfile, skipProfileSetup } from './setup-actions';

const CDN = 'https://cdn.test/storage/v1/object/public/avatars/';

type Row = {
  avatar_url: string | null;
  account_deletion_started_at: string | null;
  profile_completed_at?: string | null;
};
let row: Row | null = null;
function setRow(next: Partial<Row> | null) {
  row = next && {
    avatar_url: null,
    account_deletion_started_at: null,
    ...next,
  };
}

/** What the name form submits: first, last and display names. */
function form(firstName: string, displayName = '', lastName = ''): FormData {
  const data = new FormData();
  data.set('firstName', firstName);
  data.set('lastName', lastName);
  data.set('name', displayName);
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
  // The avatar's compare-and-set write chains .or() and .is()/.eq() after
  // the id filter; each step returns the same chain.
  const chain = {
    select: mocks.profileSelect,
    eq: mocks.profileEq,
    or: () => chain,
    is: () => chain,
  };
  mocks.profileEq.mockReturnValue(chain);
  // A row the writes change and the reads see, so a read after a save
  // returns what was saved.
  setRow({ avatar_url: null });
  mocks.profileUpdate.mockImplementation((values: Record<string, unknown>) => {
    if (row) row = { ...row, ...values };
    return chain;
  });
  mocks.profileRead.mockImplementation(async () => ({
    data: row ? { ...row } : null,
    error: null,
  }));
  mocks.from.mockReturnValue({
    update: mocks.profileUpdate,
    select: () => ({ eq: () => ({ maybeSingle: mocks.profileRead }) }),
  });
  mocks.upload.mockResolvedValue({ error: null });
  mocks.getPublicUrl.mockImplementation((path: string) => ({
    data: {
      publicUrl: `https://cdn.test/storage/v1/object/public/avatars/${path}`,
    },
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
  it('points a blank first name at its field without calling Supabase', async () => {
    const state = await updateName({}, form('   '));

    expect(state).toEqual({
      error: 'Enter your first name.',
      fields: ['firstName'],
      firstName: '   ',
      lastName: '',
      name: '',
    });
    expect(mocks.getUser).not.toHaveBeenCalled();
  });

  it('points an over-long display name at its field', async () => {
    const state = await updateName({}, form('Ada', 'a'.repeat(81)));

    expect(state.fields).toEqual(['name']);
    expect(mocks.profileUpdate).not.toHaveBeenCalled();
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it('asks to sign in again when there is no caller, about no one field', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: new AuthSessionMissingError(),
    });

    const state = await updateName({}, form('Ada'));

    expect(state).toEqual({
      error: 'Sign in again to update your profile.',
      signedOut: true,
      firstName: 'Ada',
      lastName: '',
      name: '',
    });
    expect(mocks.profileUpdate).not.toHaveBeenCalled();
  });

  it('saves the trimmed names and completes setup in one write, then mirrors them', async () => {
    mocks.getUser.mockResolvedValue(
      signedIn({ avatar_url: 'https://img.test/a.png', full_name: 'Old' }),
    );

    const state = await updateName({}, form('  Ada ', '', ' Lovelace '));

    expect(mocks.from).toHaveBeenCalledWith('profiles');
    expect(mocks.profileUpdate).toHaveBeenCalledExactlyOnceWith({
      first_name: 'Ada',
      last_name: 'Lovelace',
      display_name: null,
      profile_completed_at: expect.any(String),
    });
    expect(mocks.profileEq).toHaveBeenCalledWith('id', 'user-1');
    // No display name: the header falls back to the first name.
    expect(mocks.updateUser).toHaveBeenCalledWith({
      data: {
        avatar_url: 'https://img.test/a.png',
        first_name: 'Ada',
        last_name: 'Lovelace',
      },
    });
    expect(mocks.profileUpdate.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.updateUser.mock.invocationCallOrder[0]!,
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/', 'layout');
    expect(state).toEqual({
      saved: true,
      message: 'Name updated.',
      firstName: 'Ada',
      lastName: 'Lovelace',
      name: '',
    });
  });

  it('keeps a chosen display name', async () => {
    const state = await updateName({}, form('Ada', ' Countess '));

    expect(mocks.profileUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ display_name: 'Countess' }),
    );
    expect(state.name).toBe('Countess');
  });

  it('points at the first name when the database refuses completion without one', async () => {
    mocks.profileSelect.mockResolvedValue({
      data: null,
      error: { code: '23514' },
    });

    const state = await updateName({}, form('Ada'));

    expect(state.fields).toEqual(['firstName']);
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it('reports a failed profile save as a form error and mirrors nothing', async () => {
    mocks.profileSelect.mockResolvedValue({
      data: null,
      error: { code: '42501' },
    });

    const state = await updateName({}, form('Ada'));

    expect(state.error).toEqual(expect.any(String));
    expect(state.fields).toBeUndefined();
    expect(state.firstName).toBe('Ada');
    expect(mocks.updateUser).not.toHaveBeenCalled();
    expect(mocks.refreshSession).not.toHaveBeenCalled();
  });

  it('confirms the save even when the token refresh fails', async () => {
    mocks.refreshSession.mockResolvedValue({
      data: {},
      error: { code: 'refresh_token_not_found' },
    });

    const state = await updateName({}, form('Ada'));

    expect(state).toMatchObject({
      saved: true,
      message: 'Name saved. It may take a little while to show everywhere.',
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/', 'layout');
  });

  it('confirms the save even when mirroring to the session fails', async () => {
    mocks.updateUser.mockResolvedValue({
      data: {},
      error: { code: 'over_request_rate_limit' },
    });

    const state = await updateName({}, form('Ada'));

    expect(state).toMatchObject({
      saved: true,
      message: 'Name saved. It may take a little while to show everywhere.',
    });
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

  it('uploads into the caller own folder, records the URL, mirrors it and removes the picture it replaced', async () => {
    mocks.getUser.mockResolvedValue(
      signedIn({ full_name: 'Ada', avatar_url: 'https://old.test/a.png' }),
    );
    setRow({ avatar_url: `${CDN}user-1/old-1.png` });

    const state = await updateAvatar({}, avatarForm(PNG));

    const [path, , options] = mocks.upload.mock.calls[0]!;
    expect(mocks.bucket).toHaveBeenCalledWith('avatars');
    expect(path).toMatch(/^user-1\/[0-9a-f-]{36}\.png$/);
    expect(options).toMatchObject({ contentType: 'image/png', upsert: false });

    const url = `https://cdn.test/storage/v1/object/public/avatars/${path}`;
    expect(mocks.profileUpdate).toHaveBeenCalledWith({ avatar_url: url });
    expect(mocks.profileEq).toHaveBeenCalledWith('id', 'user-1');
    // Only if the row still holds the picture read before the upload.
    expect(mocks.profileEq).toHaveBeenCalledWith(
      'avatar_url',
      `${CDN}user-1/old-1.png`,
    );
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

  it('keeps the file just uploaded, and young files, when it clears old unreferenced ones', async () => {
    const hoursAgo = (h: number) =>
      new Date(Date.now() - h * 3_600_000).toISOString();
    mocks.list.mockImplementation(async () => {
      const path = mocks.upload.mock.calls[0]![0] as string;
      return {
        data: [
          { name: path.split('/')[1], id: '1', created_at: hoursAgo(0) },
          { name: 'old.png', id: '2', created_at: hoursAgo(2) },
          { name: 'young.png', id: '3', created_at: hoursAgo(0.1) },
        ],
        error: null,
      };
    });

    await updateAvatar({}, avatarForm(PNG));

    expect(mocks.remove).toHaveBeenCalledExactlyOnceWith(['user-1/old.png']);
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

  it('removes the picture, its file and old stray files when asked', async () => {
    mocks.getUser.mockResolvedValue(
      signedIn({ full_name: 'Ada', avatar_url: 'https://old.test/a.png' }),
    );
    setRow({ avatar_url: `${CDN}user-1/a.png` });
    mocks.list.mockResolvedValue({
      data: [
        {
          name: 'b.webp',
          id: '2',
          created_at: new Date(Date.now() - 7_200_000).toISOString(),
        },
      ],
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
    expect(mocks.remove).toHaveBeenCalledWith(['user-1/a.png']);
    expect(mocks.remove).toHaveBeenCalledWith(['user-1/b.webp']);
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

function setupForm(firstName: string, file?: File): FormData {
  const data = form(firstName);
  if (file) data.set('avatar', file);
  return data;
}

const emptyFile = () => new File([], '', { type: 'application/octet-stream' });
const pngFile = () =>
  new File([new Uint8Array(PNG)], 'me.png', { type: 'image/png' });

describe('completeProfile', () => {
  it('points a blank first name at its field and echoes the current picture', async () => {
    const state = await completeProfile(
      { avatarUrl: 'https://gh.test/a.png' },
      setupForm('  '),
    );

    expect(state).toEqual({
      error: 'Enter your first name.',
      fields: ['firstName'],
      firstName: '  ',
      lastName: '',
      name: '',
      avatarUrl: 'https://gh.test/a.png',
    });
    expect(mocks.getUser).not.toHaveBeenCalled();
  });

  it('saves the names and completion when no file was chosen, leaving the picture alone', async () => {
    const state = await completeProfile(
      { avatarUrl: 'https://gh.test/a.png' },
      setupForm(' Ada ', emptyFile()),
    );

    expect(mocks.upload).not.toHaveBeenCalled();
    expect(mocks.profileUpdate).toHaveBeenCalledExactlyOnceWith({
      first_name: 'Ada',
      last_name: null,
      display_name: null,
      profile_completed_at: expect.any(String),
    });
    expect(state).toMatchObject({
      saved: true,
      firstName: ' Ada ',
      avatarUrl: 'https://gh.test/a.png',
      message: 'Profile saved.',
    });
  });

  it('saves the names first, then the photo, mirroring both in one update', async () => {
    mocks.getUser.mockResolvedValue(signedIn({ full_name: 'Old' }));

    const state = await completeProfile({}, setupForm('Ada', pngFile()));

    const path = mocks.upload.mock.calls[0]![0] as string;
    const url = `https://cdn.test/storage/v1/object/public/avatars/${path}`;
    const [names, photo] = mocks.profileUpdate.mock.calls.map(([v]) => v);
    expect(names).toMatchObject({ first_name: 'Ada' });
    expect(photo).toEqual({ avatar_url: url });
    expect(mocks.updateUser).toHaveBeenCalledTimes(1);
    expect(mocks.updateUser).toHaveBeenCalledWith({
      data: { first_name: 'Ada', avatar_url: url },
    });
    expect(mocks.refreshSession).toHaveBeenCalledTimes(1);
    expect(state).toMatchObject({ saved: true, avatarUrl: url });
  });

  it('saves nothing when the names are refused', async () => {
    mocks.profileSelect.mockResolvedValueOnce({
      data: null,
      error: { code: '42501' },
    });

    const state = await completeProfile({}, setupForm('Ada', pngFile()));

    expect(state.error).toBe('Could not save your changes. Try again.');
    expect(mocks.upload).not.toHaveBeenCalled();
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it('asks to sign in again when there is no caller', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: new AuthSessionMissingError(),
    });

    const state = await completeProfile({}, setupForm('Ada'));

    expect(state.error).toBe('Sign in again to update your profile.');
  });
});

describe('completeProfile when the photo fails after the names were saved', () => {
  it('says the name was saved and the photo was not, mirrors the names, and stays on the form', async () => {
    const script = new File(['<script>1</script>'], 'x.png', {
      type: 'image/png',
    });

    const state = await completeProfile(
      { avatarUrl: 'https://gh.test/a.png' },
      setupForm('Ada', script),
    );

    expect(mocks.profileUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ first_name: 'Ada' }),
    );
    expect(state.error).toBe(
      'Your name was saved, but your photo was not. Use a PNG, JPEG or WebP image.',
    );
    expect(state.fields).toEqual(['avatar']);
    expect(state.saved).toBeUndefined();
    expect(state.avatarUrl).toBe('https://gh.test/a.png');
    expect(mocks.updateUser).toHaveBeenCalledWith({
      data: { first_name: 'Ada' },
    });
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
    // Postgres reports no error when the filter matches nothing, and there is
    // no row to read either.
    mocks.profileSelect.mockResolvedValue({ data: [], error: null });
    setRow(null);
  });

  it('is not reported as a saved name', async () => {
    const state = await updateName({}, form('Ada'));

    expect(state.error).toBe(SAVE_FAILED);
    expect(state.saved).toBeUndefined();
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it('is not reported as a saved photo, and nothing is uploaded', async () => {
    const state = await updateAvatar({}, avatarForm(PNG));

    expect(state.error).toBe(SAVE_FAILED);
    expect(state.saved).toBeUndefined();
    expect(mocks.upload).not.toHaveBeenCalled();
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

    await updateName({}, form('Secret', 'Secret Name'));

    expect(warn).toHaveBeenCalledWith('saveProfileNames failed', {
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

    expect(warn).toHaveBeenCalledWith('saveProfileNames failed', {
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

describe('the profile-setup step is recorded in the profile row', () => {
  it('as completed with the names, never in the token metadata', async () => {
    await completeProfile({}, setupForm('Ada'));

    expect(mocks.profileUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ profile_completed_at: expect.any(String) }),
    );
    for (const [argument] of mocks.updateUser.mock.calls) {
      expect(JSON.stringify(argument)).not.toContain('profile_confirmed');
    }
  });

  it('but not by an edit of the photo alone', async () => {
    await updateAvatar({}, avatarForm(PNG));

    for (const [values] of mocks.profileUpdate.mock.calls) {
      expect(values).not.toHaveProperty('profile_completed_at');
    }
  });
});

describe('skipProfileSetup', () => {
  it('records the skip, only while setup is incomplete, and changes nothing else', async () => {
    const result = await skipProfileSetup();

    expect(result).toEqual({ saved: true });
    expect(mocks.profileUpdate).toHaveBeenCalledExactlyOnceWith({
      profile_setup_skipped_at: expect.any(String),
    });
    expect(mocks.updateUser).not.toHaveBeenCalled();
    expect(mocks.upload).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/', 'layout');
  });

  it('counts an already-completed setup as done', async () => {
    mocks.profileSelect.mockResolvedValueOnce({ data: [], error: null });
    setRow({ profile_completed_at: '2026-11-11T00:00:00Z' });

    expect(await skipProfileSetup()).toEqual({ saved: true });
  });

  it('reports not saved, and touches nothing, when there is no session', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: new AuthSessionMissingError(),
    });

    expect(await skipProfileSetup()).toEqual({ saved: false });
    expect(mocks.profileUpdate).not.toHaveBeenCalled();
  });

  it('reports not saved when the profile cannot be written', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mocks.profileSelect.mockResolvedValueOnce({
      data: null,
      error: { code: '42501', status: 403 },
    });

    expect(await skipProfileSetup()).toEqual({ saved: false });
    expect(warn).toHaveBeenCalledWith('skipProfileSetup failed', {
      code: '42501',
      status: 403,
    });
    warn.mockRestore();
  });
});

describe('development fixture mode', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('SYNAPCITY_DEV_AUTH', 'fixture');
  });
  afterEach(() => vi.unstubAllEnvs());

  it('rejects every profile action before a Supabase client is built', async () => {
    const shown = 'https://cdn.test/storage/v1/object/public/avatars/old.png';
    const results = await Promise.all([
      updateName({}, form('Ada')),
      updateAvatar({ avatarUrl: shown }, avatarForm(PNG)),
      completeProfile({ avatarUrl: shown }, setupForm('Ada')),
    ]);

    for (const result of results) {
      expect(result.error).toContain('Fixture mode');
    }
    // A refused submit keeps showing the picture the person already has.
    expect(results[1]?.avatarUrl).toBe(shown);
    expect(await skipProfileSetup()).toEqual({ saved: false });
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });
});
