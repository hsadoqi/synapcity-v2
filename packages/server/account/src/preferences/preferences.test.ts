import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  readAccountPreferenceRow,
  writeAccountPreferenceRow,
} from './preferences';

const maybeSingle = vi.fn();
const select = vi.fn(() => ({ eq }));
const eq = vi.fn(() => ({ maybeSingle }));
const from = vi.fn(() => ({ select, upsert }));
const writeSelect = vi.fn();
const upsert = vi.fn((..._args: unknown[]) => ({ select: writeSelect }));
const client = { from } as never;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('readAccountPreferenceRow', () => {
  it('returns normalized preferences and a valid device timezone', async () => {
    maybeSingle.mockResolvedValue({
      data: {
        preferences: { regional: { language: 'de' } },
        device_timezone: 'Europe/Berlin',
      },
      error: null,
    });
    const result = await readAccountPreferenceRow(client, 'user-1');

    expect(from).toHaveBeenCalledWith('user_preferences');
    expect(eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(result).toMatchObject({
      ok: true,
      value: {
        preferences: { regional: { language: 'de' } },
        deviceTimezone: 'Europe/Berlin',
      },
    });
  });

  it('treats a non-string device timezone as absent', async () => {
    maybeSingle.mockResolvedValue({
      data: { preferences: {}, device_timezone: 42 },
      error: null,
    });
    await expect(
      readAccountPreferenceRow(client, 'user-1'),
    ).resolves.toMatchObject({ ok: true, value: { deviceTimezone: null } });
  });

  it('returns the empty account state when the row is missing', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });
    await expect(readAccountPreferenceRow(client, 'user-1')).resolves.toEqual({
      ok: true,
      value: { preferences: null, deviceTimezone: null },
    });
  });

  it('returns provider failures without logging them', async () => {
    const failure = { code: '42501', status: 403 };
    maybeSingle.mockResolvedValue({ data: null, error: failure });
    await expect(readAccountPreferenceRow(client, 'user-1')).resolves.toEqual({
      ok: false,
      failure,
    });
  });
});

describe('writeAccountPreferenceRow', () => {
  it('upserts only for the supplied verified caller and includes the timezone', async () => {
    writeSelect.mockResolvedValue({
      data: [{ user_id: 'user-1' }],
      error: null,
    });
    const preferences = { regional: { language: 'fr' } };

    await expect(
      writeAccountPreferenceRow(client, 'user-1', preferences, 'Europe/Paris'),
    ).resolves.toEqual({ ok: true });
    expect(from).toHaveBeenCalledWith('user_preferences');
    expect(upsert).toHaveBeenCalledWith(
      {
        user_id: 'user-1',
        preferences,
        schema_version: 1,
        device_timezone: 'Europe/Paris',
      },
      { onConflict: 'user_id' },
    );
  });

  it('omits an absent timezone', async () => {
    writeSelect.mockResolvedValue({
      data: [{ user_id: 'user-1' }],
      error: null,
    });

    await writeAccountPreferenceRow(client, 'user-1', {});

    expect(upsert.mock.calls[0]?.[0]).not.toHaveProperty('device_timezone');
  });

  it.each([
    [
      'provider error',
      { data: null, error: { code: '42501' } },
      { code: '42501' },
    ],
    ['row not written', { data: [], error: null }, { code: 'row_not_written' }],
  ])('reports %s with its failure', async (_name, response, failure) => {
    writeSelect.mockResolvedValue(response);

    await expect(
      writeAccountPreferenceRow(client, 'user-1', {}),
    ).resolves.toEqual({ ok: false, failure });
  });
});
