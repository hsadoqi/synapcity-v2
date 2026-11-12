import { describe, expect, it, vi } from 'vitest';
import type { SupabaseServerClient } from '@synapcity/server-supabase';

import {
  readProfileSetup,
  saveProfileNames,
  skipProfileSetup,
} from './profile-setup';

type Result = { data: unknown; error: unknown };

/** A request client whose profile reads and writes answer in turn. */
function client(answers: { reads?: Result[]; writes?: Result[] }) {
  const update = vi.fn();
  const filters: [string, unknown][] = [];
  const reads = [...(answers.reads ?? [])];
  const writes = [...(answers.writes ?? [])];
  const chain = {
    eq: (column: string, value: unknown) => {
      filters.push([column, value]);
      return chain;
    },
    is: (column: string, value: unknown) => {
      filters.push([`${column}.is`, value]);
      return chain;
    },
    select: async () => writes.shift(),
  };
  const fake = {
    from: () => ({
      update: (values: unknown) => {
        update(values);
        return chain;
      },
      select: () => ({
        eq: () => ({ maybeSingle: async () => reads.shift() }),
      }),
    }),
  };
  return { client: fake as unknown as SupabaseServerClient, update, filters };
}

const row = (fields: Record<string, string | null>) => ({
  data: {
    first_name: null,
    last_name: null,
    display_name: null,
    avatar_url: null,
    profile_completed_at: null,
    profile_setup_skipped_at: null,
    ...fields,
  },
  error: null,
});

describe('readProfileSetup', () => {
  it('reads the names and derives the setup state, completion first', async () => {
    const f = client({
      reads: [
        row({
          first_name: 'Ada',
          profile_completed_at: '2026-11-11T10:00:00Z',
          profile_setup_skipped_at: '2026-11-10T10:00:00Z',
        }),
      ],
    });

    expect(await readProfileSetup(f.client, 'u1')).toEqual({
      kind: 'found',
      state: 'completed',
      completedAt: '2026-11-11T10:00:00Z',
      skippedAt: '2026-11-10T10:00:00Z',
      firstName: 'Ada',
      lastName: null,
      displayName: null,
      avatarUrl: null,
    });
  });

  it('tells a missing row from a failed read', async () => {
    const missing = client({ reads: [{ data: null, error: null }] });
    const failed = client({
      reads: [
        { data: null, error: { code: '500', status: 500, message: 'x' } },
      ],
    });

    expect(await readProfileSetup(missing.client, 'u1')).toEqual({
      kind: 'missing',
    });
    expect(await readProfileSetup(failed.client, 'u1')).toEqual({
      kind: 'failed',
      failure: { code: '500', status: 500 },
    });
  });
});

describe('saveProfileNames', () => {
  const names = { firstName: 'Ada', lastName: null, displayName: null };

  it('saves the names and the completion in one write, and mirrors them', async () => {
    const f = client({ writes: [{ data: [{ id: 'u1' }], error: null }] });

    const saved = await saveProfileNames(f.client, 'u1', names);

    expect(f.update).toHaveBeenCalledExactlyOnceWith({
      first_name: 'Ada',
      last_name: null,
      display_name: null,
      profile_completed_at: expect.any(String),
    });
    expect(f.filters).toEqual([['id', 'u1']]);
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    expect(saved.patch({ full_name: 'Old', avatar_url: 'a' })).toEqual({
      avatar_url: 'a',
      first_name: 'Ada',
    });
  });

  it('reports the database refusing completion without a first name', async () => {
    const f = client({
      writes: [{ data: null, error: { code: '23514', message: 'check' } }],
    });

    expect(await saveProfileNames(f.client, 'u1', names)).toEqual({
      ok: false,
      reason: 'first-name-required',
      failure: { code: '23514' },
    });
  });

  it('does not look saved when no row matched', async () => {
    const f = client({ writes: [{ data: [], error: null }] });

    expect(await saveProfileNames(f.client, 'u1', names)).toEqual({
      ok: false,
      reason: 'not-saved',
      failure: { code: 'profile_row_missing' },
    });
  });
});

describe('skipProfileSetup', () => {
  it('marks the skip only while setup is not completed', async () => {
    const f = client({ writes: [{ data: [{ id: 'u1' }], error: null }] });

    expect(await skipProfileSetup(f.client, 'u1')).toEqual({ kind: 'skipped' });
    expect(f.update).toHaveBeenCalledWith({
      profile_setup_skipped_at: expect.any(String),
    });
    expect(f.filters).toEqual([
      ['id', 'u1'],
      ['profile_completed_at.is', null],
    ]);
  });

  it('changes nothing for a completed setup', async () => {
    const f = client({
      writes: [{ data: [], error: null }],
      reads: [
        row({
          first_name: 'Ada',
          profile_completed_at: '2026-11-11T10:00:00Z',
        }),
      ],
    });

    expect(await skipProfileSetup(f.client, 'u1')).toEqual({
      kind: 'already-completed',
    });
  });

  it('fails when nothing matched and the row is not completed', async () => {
    const f = client({
      writes: [{ data: [], error: null }],
      reads: [{ data: null, error: null }],
    });

    expect(await skipProfileSetup(f.client, 'u1')).toEqual({
      kind: 'failed',
      failure: { code: 'profile_row_missing' },
    });
  });
});
