import { describe, expect, it, vi } from 'vitest';

const { listSpaces } = vi.hoisted(() => ({ listSpaces: vi.fn() }));

vi.mock('../space-repository', () => ({ listSpaces }));

import { SPACE_FIXTURES } from '../../lib/fixtures';
import { getSpaces } from './get-spaces';

describe('getSpaces', () => {
  it('returns the owner’s spaces from the repository', async () => {
    listSpaces.mockResolvedValue([...SPACE_FIXTURES]);

    await expect(getSpaces()).resolves.toEqual([...SPACE_FIXTURES]);
  });

  it('propagates repository failures', async () => {
    const error = new Error('Connection failed');
    listSpaces.mockRejectedValue(error);

    await expect(getSpaces()).rejects.toBe(error);
  });
});
