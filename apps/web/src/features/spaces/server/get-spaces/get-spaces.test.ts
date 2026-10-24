import { describe, expect, it, vi } from 'vitest';

const source = vi.hoisted(() => ({ listSummaries: vi.fn() }));

vi.mock('../space-source', () => ({ getSpaceSource: async () => source }));

import { SPACE_FIXTURES } from '../../lib/fixtures';
import { getSpaces } from './get-spaces';

const summaries = SPACE_FIXTURES.map((space) => ({
  ...space,
  documentsTotal: 2,
  dashboardsTotal: 1,
}));

describe('getSpaces', () => {
  it('returns the owner’s spaces with their counts from the source', async () => {
    source.listSummaries.mockResolvedValue(summaries);

    await expect(getSpaces()).resolves.toEqual(summaries);
  });

  it('propagates source failures', async () => {
    const error = new Error('Connection failed');
    source.listSummaries.mockRejectedValue(error);

    await expect(getSpaces()).rejects.toBe(error);
  });
});
