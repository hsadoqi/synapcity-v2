import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }));
const { fixtureModeEnabled } = vi.hoisted(() => ({
  fixtureModeEnabled: vi.fn(() => false),
}));

vi.mock('@/lib/supabase/server', () => ({ createClient }));
vi.mock('@/lib/access/dev-fixture', () => ({ fixtureModeEnabled }));

import { SPACE_FIXTURES } from '../../lib/fixtures';
import { findSpace, listSpaces } from './space-repository';

const row = {
  id: '9ab8c032-8759-44e9-808d-0573d13f290e',
  owner_id: '11111111-1111-4111-8111-111111111111',
  name: 'Writing',
  description: null,
  icon: 'pen-line',
  tags: ['writing'],
  created_at: '2026-10-18T05:12:33.123456+00:00',
  updated_at: '2026-10-18T05:12:33.123456+00:00',
};

/** A stand-in for the PostgREST query builder that resolves to `result`. */
function queryReturning(result: { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {};
  for (const method of ['select', 'order', 'eq']) {
    builder[method] = vi.fn(() => builder);
  }
  builder.maybeSingle = vi.fn(() => Promise.resolve(result));
  builder.then = (resolve: (value: unknown) => unknown) => resolve(result);
  const from = vi.fn(() => builder);
  createClient.mockResolvedValue({ from });
  return { from, builder };
}

describe('space repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fixtureModeEnabled.mockReturnValue(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('listSpaces', () => {
    it('maps rows onto the feature contract, newest first', async () => {
      const { from, builder } = queryReturning({ data: [row], error: null });

      const spaces = await listSpaces();

      expect(from).toHaveBeenCalledWith('spaces');
      expect(builder.order).toHaveBeenCalledWith('created_at', {
        ascending: false,
      });
      expect(spaces).toEqual([
        {
          id: row.id,
          ownerId: row.owner_id,
          name: 'Writing',
          icon: 'pen-line',
          tags: ['writing'],
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        },
      ]);
      expect(spaces[0]).not.toHaveProperty('description', null);
    });

    it('keeps a description when there is one', async () => {
      queryReturning({
        data: [{ ...row, description: 'Drafts' }],
        error: null,
      });

      expect((await listSpaces())[0]?.description).toBe('Drafts');
    });

    it('reports a database error', async () => {
      queryReturning({ data: null, error: { message: 'boom' } });

      await expect(listSpaces()).rejects.toThrow('Failed to load spaces: boom');
    });

    it('rejects a malformed row instead of passing it on', async () => {
      queryReturning({ data: [{ ...row, name: 123 }], error: null });

      await expect(listSpaces()).rejects.toMatchObject({ name: 'ZodError' });
    });

    it('reads the sample records in fixture mode without a database', async () => {
      fixtureModeEnabled.mockReturnValue(true);

      await expect(listSpaces()).resolves.toEqual([...SPACE_FIXTURES]);
      expect(createClient).not.toHaveBeenCalled();
    });
  });

  describe('findSpace', () => {
    it('returns the matching space', async () => {
      const { builder } = queryReturning({ data: row, error: null });

      const space = await findSpace(row.id);

      expect(builder.eq).toHaveBeenCalledWith('id', row.id);
      expect(space?.id).toBe(row.id);
    });

    it('returns null when no row is visible to the owner', async () => {
      queryReturning({ data: null, error: null });

      await expect(findSpace(row.id)).resolves.toBeNull();
    });

    it('returns null for a malformed id without querying', async () => {
      await expect(findSpace('not-a-uuid')).resolves.toBeNull();
      expect(createClient).not.toHaveBeenCalled();
    });

    it('reports a database error with the id', async () => {
      queryReturning({ data: null, error: { message: 'boom' } });

      await expect(findSpace(row.id)).rejects.toThrow(
        `Failed to load space ${row.id}: boom`,
      );
    });

    it('finds a sample record in fixture mode', async () => {
      fixtureModeEnabled.mockReturnValue(true);
      const [first] = SPACE_FIXTURES;

      await expect(findSpace(first!.id)).resolves.toEqual(first);
      await expect(findSpace('missing')).resolves.toBeNull();
      expect(createClient).not.toHaveBeenCalled();
    });
  });
});
