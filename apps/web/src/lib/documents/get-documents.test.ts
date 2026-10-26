import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  listDocumentSummaries: vi.fn(),
  fixtureModeEnabled: vi.fn(() => false),
}));

vi.mock('@/lib/supabase/server', () => ({ createClient: mocks.createClient }));
vi.mock('@/lib/access/dev-fixture', () => ({
  fixtureModeEnabled: mocks.fixtureModeEnabled,
}));
vi.mock('@synapcity/server-data', () => ({
  listDocumentSummaries: mocks.listDocumentSummaries,
}));

import { DEMO_DOCUMENTS } from '@/lib/demo/documents';
import { getDocuments } from './get-documents';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.fixtureModeEnabled.mockReturnValue(false);
  mocks.createClient.mockResolvedValue('client');
});

describe('getDocuments', () => {
  it('reads the owner’s documents from the database', async () => {
    mocks.listDocumentSummaries.mockResolvedValue([...DEMO_DOCUMENTS]);

    await expect(getDocuments()).resolves.toEqual([...DEMO_DOCUMENTS]);
    expect(mocks.listDocumentSummaries).toHaveBeenCalledWith('client');
  });

  it('propagates failures', async () => {
    const error = new Error('Connection failed');
    mocks.listDocumentSummaries.mockRejectedValue(error);

    await expect(getDocuments()).rejects.toBe(error);
  });

  it('reads the sample records in fixture mode without a database', async () => {
    mocks.fixtureModeEnabled.mockReturnValue(true);

    await expect(getDocuments()).resolves.toEqual([...DEMO_DOCUMENTS]);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });
});
