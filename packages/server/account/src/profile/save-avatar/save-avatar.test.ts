import { describe, expect, it, vi } from 'vitest';
import type {
  ProviderUser,
  SupabaseServerClient,
} from '@synapcity/server-supabase';

import { removeOldAvatars, saveAvatar } from '.';

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3];
const user: ProviderUser = { id: 'u1', user_metadata: {}, identities: [] };

const pngFile = () =>
  new File([new Uint8Array(PNG)], 'a.png', { type: 'image/png' });

type Options = {
  uploadError?: unknown;
  profile?: { data: unknown; error: unknown };
  existing?: string[];
};

function fake({
  uploadError = null,
  profile = { data: [{ id: 'u1' }], error: null },
  existing = [],
}: Options = {}) {
  const upload = vi.fn().mockResolvedValue({ error: uploadError });
  const remove = vi.fn().mockResolvedValue({});
  const list = vi
    .fn()
    .mockResolvedValue({ data: existing.map((name) => ({ name })) });
  const getPublicUrl = vi.fn((path: string) => ({
    data: { publicUrl: `https://cdn.test/${path}` },
  }));
  const storageFrom = vi.fn(() => ({ upload, remove, list, getPublicUrl }));
  const select = vi.fn().mockResolvedValue(profile);
  const eq = vi.fn(() => ({ select }));
  const update = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ update }));
  return {
    client: {
      from,
      storage: { from: storageFrom },
    } as unknown as SupabaseServerClient,
    upload,
    remove,
    list,
    update,
    eq,
    storageFrom,
  };
}

describe('saveAvatar', () => {
  it("uploads to the caller's own folder, typed from the bytes, and records the picture", async () => {
    const f = fake({ existing: ['old.png'] });

    const saved = await saveAvatar(f.client, user, {
      kind: 'upload',
      file: pngFile(),
    });

    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    const [path, , options] = f.upload.mock.calls[0]!;
    expect(path).toMatch(/^u1\/[0-9a-f-]+\.png$/);
    expect(options).toMatchObject({ contentType: 'image/png', upsert: false });
    expect(saved.avatarUrl).toBe(`https://cdn.test/${path}`);
    expect(f.update).toHaveBeenCalledWith({ avatar_url: saved.avatarUrl });
    expect(f.eq).toHaveBeenCalledWith('id', 'u1');
    expect(saved.patch({ avatar_url: 'x' })).toEqual({
      avatar_url: saved.avatarUrl,
    });
  });

  it('deletes the older files but keeps the new one', async () => {
    const f = fake({ existing: ['old.png', 'older.webp'] });

    await saveAvatar(f.client, user, { kind: 'upload', file: pngFile() });

    const newPath = f.upload.mock.calls[0]![0] as string;
    expect(f.remove).toHaveBeenCalledWith(['u1/old.png', 'u1/older.webp']);
    expect(f.remove).not.toHaveBeenCalledWith(
      expect.arrayContaining([newPath]),
    );
  });

  it('removing returns to the provider picture, or none', async () => {
    const withGoogle: ProviderUser = {
      id: 'u1',
      identities: [
        {
          provider: 'google',
          identity_data: { picture: 'https://g.test/p.png' },
        },
      ],
    };
    const a = fake();
    const b = fake();

    const fromProvider = await saveAvatar(a.client, withGoogle, {
      kind: 'remove',
    });
    const none = await saveAvatar(b.client, user, { kind: 'remove' });

    expect(fromProvider).toMatchObject({
      ok: true,
      avatarUrl: 'https://g.test/p.png',
    });
    expect(none).toMatchObject({ ok: true, avatarUrl: null });
    expect(a.upload).not.toHaveBeenCalled();
  });

  it("refuses a file the schema rejects, with the schema's own words", async () => {
    const f = fake();

    const saved = await saveAvatar(f.client, user, {
      kind: 'upload',
      file: undefined,
    });

    expect(saved).toMatchObject({
      ok: false,
      reason: 'invalid-file',
      message: 'Choose an image.',
    });
    expect(f.upload).not.toHaveBeenCalled();
    expect(f.update).not.toHaveBeenCalled();
  });

  it('refuses bytes that are not a PNG, JPEG or WebP, whatever the browser claimed', async () => {
    const f = fake();
    const svg = new File(['<svg></svg>'], 'a.png', { type: 'image/png' });

    const saved = await saveAvatar(f.client, user, {
      kind: 'upload',
      file: svg,
    });

    expect(saved).toEqual({ ok: false, reason: 'unsupported-type' });
    expect(f.upload).not.toHaveBeenCalled();
  });

  it('reports a failed upload by code and status, and records nothing', async () => {
    const f = fake({
      uploadError: { code: 'quota', status: 413, message: 'secret' },
    });

    const saved = await saveAvatar(f.client, user, {
      kind: 'upload',
      file: pngFile(),
    });

    expect(saved).toEqual({
      ok: false,
      reason: 'upload-failed',
      failure: { code: 'quota', status: 413 },
    });
    expect(f.update).not.toHaveBeenCalled();
  });

  it('removes the uploaded file when the profile row cannot be updated', async () => {
    const f = fake({
      profile: { data: null, error: { code: '42501', status: 403 } },
    });

    const saved = await saveAvatar(f.client, user, {
      kind: 'upload',
      file: pngFile(),
    });

    const path = f.upload.mock.calls[0]![0] as string;
    expect(saved).toEqual({
      ok: false,
      reason: 'profile-not-saved',
      failure: { code: '42501', status: 403 },
    });
    expect(f.remove).toHaveBeenCalledWith([path]);
  });

  it('does not look saved when no profile row matched', async () => {
    const f = fake({ profile: { data: [], error: null } });

    await expect(
      saveAvatar(f.client, user, { kind: 'upload', file: pngFile() }),
    ).resolves.toEqual({
      ok: false,
      reason: 'profile-not-saved',
      failure: { code: 'profile_row_missing' },
    });
  });
});

describe('removeOldAvatars', () => {
  it('deletes every file in the user folder except the one to keep', async () => {
    const f = fake({ existing: ['a.png', 'b.png'] });

    await removeOldAvatars(f.client, 'u1', 'u1/b.png');

    expect(f.list).toHaveBeenCalledWith('u1');
    expect(f.remove).toHaveBeenCalledWith(['u1/a.png']);
  });

  it('removes nothing when the folder is empty', async () => {
    const f = fake({ existing: [] });

    await removeOldAvatars(f.client, 'u1');

    expect(f.remove).not.toHaveBeenCalled();
  });
});
