import { describe, expect, it, vi } from 'vitest';

const { listSpaceSummaries } = vi.hoisted(() => ({
  listSpaceSummaries: vi.fn(),
}));

vi.mock('../space-repository', () => ({ listSpaceSummaries }));

import { SPACE_FIXTURES } from '../../lib/fixtures';
import { getSpaces } from './get-spaces';

const summaries = SPACE_FIXTURES.map((space) => ({
  ...space,
  documentsTotal: 2,
  dashboardsTotal: 1,
}));

describe('getSpaces', () => {
  it('returns the owner’s spaces with their counts from the repository', async () => {
    listSpaceSummaries.mockResolvedValue(summaries);

    await expect(getSpaces()).resolves.toEqual(summaries);
  });

  it('propagates repository failures', async () => {
    const error = new Error('Connection failed');
    listSpaceSummaries.mockRejectedValue(error);

    await expect(getSpaces()).rejects.toBe(error);
  });
});
