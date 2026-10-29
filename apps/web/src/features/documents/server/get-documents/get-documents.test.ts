import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  listRecordSummaries: vi.fn(),
  findRecord: vi.fn(),
  fixtureModeEnabled: vi.fn(() => false),
}));

vi.mock('@/lib/supabase/server', () => ({ createClient: mocks.createClient }));
vi.mock('@/lib/access/dev-fixture', () => ({
  fixtureModeEnabled: mocks.fixtureModeEnabled,
}));
vi.mock('@synapcity/server-data', () => ({
  listRecordSummaries: mocks.listRecordSummaries,
  findRecord: mocks.findRecord,
}));

import { DOCUMENT_FIXTURES } from '../../lib/fixtures';
import { getDocument, getDocuments } from './get-documents';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.fixtureModeEnabled.mockReturnValue(false);
  mocks.createClient.mockResolvedValue('client');
});

describe('getDocuments', () => {
  it('reads the owner’s documents from the database', async () => {
    mocks.listRecordSummaries.mockResolvedValue([...DOCUMENT_FIXTURES]);

    await expect(getDocuments()).resolves.toEqual([...DOCUMENT_FIXTURES]);
    expect(mocks.listRecordSummaries).toHaveBeenCalledWith(
      'client',
      'documents',
    );
  });

  it('propagates failures', async () => {
    const error = new Error('Connection failed');
    mocks.listRecordSummaries.mockRejectedValue(error);

    await expect(getDocuments()).rejects.toBe(error);
  });

  it('reads the sample records in fixture mode without a database', async () => {
    mocks.fixtureModeEnabled.mockReturnValue(true);

    await expect(getDocuments()).resolves.toEqual([...DOCUMENT_FIXTURES]);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });
});

describe('getDocument', () => {
  const sample = DOCUMENT_FIXTURES[0]!;

  it('reads one of the owner’s documents from the database', async () => {
    mocks.findRecord.mockResolvedValue(sample);

    await expect(getDocument(sample.id)).resolves.toBe(sample);
    expect(mocks.findRecord).toHaveBeenCalledWith(
      'client',
      'documents',
      sample.id,
    );
  });

  it('reads the sample record in fixture mode, and null for an unknown id', async () => {
    mocks.fixtureModeEnabled.mockReturnValue(true);

    await expect(getDocument(sample.id)).resolves.toEqual(sample);
    await expect(getDocument('missing')).resolves.toBeNull();
    expect(mocks.createClient).not.toHaveBeenCalled();
  });
});
