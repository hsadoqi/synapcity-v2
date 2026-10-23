import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  listOwnedRecordSummaries: vi.fn(),
  fixtureModeEnabled: vi.fn(() => false),
}));

vi.mock('@/lib/supabase/server', () => ({ createClient: mocks.createClient }));
vi.mock('@/lib/access/dev-fixture', () => ({
  fixtureModeEnabled: mocks.fixtureModeEnabled,
}));
vi.mock('@/lib/owned-records', () => ({
  listOwnedRecordSummaries: mocks.listOwnedRecordSummaries,
}));

import { DOCUMENT_FIXTURES } from '../../lib/fixtures';
import { getDocuments } from './get-documents';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.fixtureModeEnabled.mockReturnValue(false);
  mocks.createClient.mockResolvedValue('client');
});

describe('getDocuments', () => {
  it('reads the owner’s documents from the database', async () => {
    mocks.listOwnedRecordSummaries.mockResolvedValue([...DOCUMENT_FIXTURES]);

    await expect(getDocuments()).resolves.toEqual([...DOCUMENT_FIXTURES]);
    expect(mocks.listOwnedRecordSummaries).toHaveBeenCalledWith(
      'client',
      'documents',
    );
  });

  it('propagates failures', async () => {
    const error = new Error('Connection failed');
    mocks.listOwnedRecordSummaries.mockRejectedValue(error);

    await expect(getDocuments()).rejects.toBe(error);
  });

  it('reads the sample records in fixture mode without a database', async () => {
    mocks.fixtureModeEnabled.mockReturnValue(true);

    await expect(getDocuments()).resolves.toEqual([...DOCUMENT_FIXTURES]);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });
});
