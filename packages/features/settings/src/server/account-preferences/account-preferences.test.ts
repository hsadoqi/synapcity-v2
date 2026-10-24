import { beforeEach, describe, expect, it, vi } from 'vitest';

const readAccountPreferenceRow = vi.hoisted(() => vi.fn());

vi.mock('@synapcity/server-account', () => ({ readAccountPreferenceRow }));

import { loadSettingsAccountPreferences } from './account-preferences';

const client = {} as never;

beforeEach(() => vi.clearAllMocks());

describe('loadSettingsAccountPreferences', () => {
  it('returns the loaded account state', async () => {
    const value = { preferences: null, deviceTimezone: null };
    readAccountPreferenceRow.mockResolvedValue({ ok: true, value });

    await expect(
      loadSettingsAccountPreferences(client, 'user-1'),
    ).resolves.toEqual(value);
    expect(readAccountPreferenceRow).toHaveBeenCalledWith(client, 'user-1');
  });

  it('returns undefined and delegates failure policy to the host', async () => {
    const failure = { code: '42501', status: 403 };
    const onFailure = vi.fn();
    readAccountPreferenceRow.mockResolvedValue({ ok: false, failure });

    await expect(
      loadSettingsAccountPreferences(client, 'user-1', onFailure),
    ).resolves.toBeUndefined();
    expect(onFailure).toHaveBeenCalledWith(failure);
  });
});
