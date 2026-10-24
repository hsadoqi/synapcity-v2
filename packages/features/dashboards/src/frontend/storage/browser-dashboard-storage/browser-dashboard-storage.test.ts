import {
  addWidget,
  createComposition,
  createWidget,
} from '@synapcity/domain-dashboards';
import { emptyRecords } from '@synapcity/domain-prototypes';
import { describe, expect, it, vi } from 'vitest';

import { browserDashboardStorage } from './index';

const OWNER = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';
const DASH = 'dash-1';
const COMPOSITION_KEY = `synapcity.dashboard.${OWNER}.${DASH}.v1`;
const RECORDS_KEY = `synapcity.records.${OWNER}.v1`;

/** A Storage backed by a Map, so tests can read what was written. */
function mapStorage(seed: Record<string, string> = {}) {
  const map = new Map(Object.entries(seed));
  const storage = {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
    key: (i: number) => [...map.keys()][i] ?? null,
    get length() {
      return map.size;
    },
  } satisfies Storage;
  return { map, storage };
}

function sample() {
  const created = createWidget('notes', emptyRecords(), {
    ownerId: OWNER,
    now: 0,
  });
  return {
    composition: addWidget(createComposition(), created.widget),
    records: created.records,
  };
}

describe('browserDashboardStorage', () => {
  it('round-trips a composition and records under owner-scoped keys', async () => {
    const { map, storage } = mapStorage();
    const adapter = browserDashboardStorage({ ownerId: OWNER, storage });
    const { composition, records } = sample();
    await adapter.saveComposition(DASH, composition);
    await adapter.saveRecords(records);
    expect([...map.keys()].sort()).toEqual(
      [COMPOSITION_KEY, RECORDS_KEY].sort(),
    );
    expect(await adapter.load(DASH)).toEqual({ composition, records });
  });

  it('returns nulls when nothing is saved', async () => {
    const adapter = browserDashboardStorage({
      ownerId: OWNER,
      storage: mapStorage().storage,
    });
    expect(await adapter.load(DASH)).toEqual({
      composition: null,
      records: null,
    });
  });

  it('keeps owners apart', async () => {
    const { storage } = mapStorage();
    const { composition, records } = sample();
    const mine = browserDashboardStorage({ ownerId: OWNER, storage });
    await mine.saveComposition(DASH, composition);
    await mine.saveRecords(records);
    const theirs = browserDashboardStorage({ ownerId: OTHER, storage });
    expect(await theirs.load(DASH)).toEqual({
      composition: null,
      records: null,
    });
  });

  it('sets an invalid value aside and reports it', async () => {
    const bad = '{"settings":{}}';
    const { map, storage } = mapStorage({ [COMPOSITION_KEY]: bad });
    const onError = vi.fn();
    const adapter = browserDashboardStorage({
      ownerId: OWNER,
      storage,
      onError,
    });
    expect((await adapter.load(DASH)).composition).toBeNull();
    expect(map.get(`${COMPOSITION_KEY}.invalid`)).toBe(bad);
    expect(map.get(COMPOSITION_KEY)).toBe(bad);
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'invalid', key: COMPOSITION_KEY }),
    );
  });

  it('treats unparseable JSON as invalid', async () => {
    const { map, storage } = mapStorage({ [RECORDS_KEY]: '{' });
    const onError = vi.fn();
    const adapter = browserDashboardStorage({
      ownerId: OWNER,
      storage,
      onError,
    });
    expect((await adapter.load(DASH)).records).toBeNull();
    expect(map.get(`${RECORDS_KEY}.invalid`)).toBe('{');
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'invalid', key: RECORDS_KEY }),
    );
  });

  it('reports a throwing storage without throwing', async () => {
    const failing = {
      ...mapStorage().storage,
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('quota');
      },
    } as Storage;
    const onError = vi.fn();
    const adapter = browserDashboardStorage({
      ownerId: OWNER,
      storage: failing,
      onError,
    });
    await expect(adapter.load(DASH)).resolves.toEqual({
      composition: null,
      records: null,
    });
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'read' }),
    );
    await expect(
      adapter.saveComposition(DASH, sample().composition),
    ).resolves.toBeUndefined();
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'write', key: COMPOSITION_KEY }),
    );
  });
});
