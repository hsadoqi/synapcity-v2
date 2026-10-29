import {
  addWidget,
  createComposition,
  createWidget,
} from '@synapcity/domain-dashboards';
import {
  emptyRecords,
  newRecord,
  putRecord,
  touchRecord,
} from '@synapcity/domain-prototypes';
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
    await adapter.saveComposition(DASH, composition, 0);
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
    await mine.saveComposition(DASH, composition, 0);
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

  it('rejects unreadable saved data', async () => {
    const failingRead = {
      ...mapStorage().storage,
      getItem: () => {
        throw new Error('blocked');
      },
    } as Storage;
    const readError = vi.fn();
    const readAdapter = browserDashboardStorage({
      ownerId: OWNER,
      storage: failingRead,
      onError: readError,
    });
    await expect(readAdapter.load(DASH)).rejects.toThrow('blocked');
    expect(readError).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'read' }),
    );
  });

  it('does not overwrite saved records when reading them fails', async () => {
    const existing = sample().records;
    const saved = JSON.stringify(existing);
    const { map, storage } = mapStorage({ [RECORDS_KEY]: saved });
    const failingRead = {
      ...storage,
      getItem: () => {
        throw new Error('blocked');
      },
    } as Storage;
    const onError = vi.fn();
    const adapter = browserDashboardStorage({
      ownerId: OWNER,
      storage: failingRead,
      onError,
    });

    await expect(adapter.saveRecords(emptyRecords())).rejects.toThrow(
      'blocked',
    );
    expect(map.get(RECORDS_KEY)).toBe(saved);
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'read', key: RECORDS_KEY }),
    );
  });

  it('rejects writes that could not be saved', async () => {
    const failingWrite = {
      ...mapStorage().storage,
      setItem: () => {
        throw new Error('quota');
      },
    } as Storage;
    const onError = vi.fn();
    const adapter = browserDashboardStorage({
      ownerId: OWNER,
      storage: failingWrite,
      onError,
    });
    await expect(
      adapter.saveComposition(DASH, sample().composition, 0),
    ).rejects.toThrow();
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'write', key: COMPOSITION_KEY }),
    );
    await expect(adapter.saveRecords(emptyRecords())).rejects.toThrow();
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'write', key: RECORDS_KEY }),
    );
  });

  it('preserves an existing invalid-data backup', async () => {
    const bad = '{"settings":{}}';
    const previous = '{"settings":null}';
    const backupKey = `${COMPOSITION_KEY}.invalid`;
    const { map, storage } = mapStorage({
      [COMPOSITION_KEY]: bad,
      [backupKey]: previous,
    });
    const adapter = browserDashboardStorage({ ownerId: OWNER, storage });

    await expect(adapter.load(DASH)).rejects.toThrow();
    expect(map.get(COMPOSITION_KEY)).toBe(bad);
    expect(map.get(backupKey)).toBe(previous);
  });

  it('keeps records another tab saved when this tab saves its older copy', async () => {
    const { storage } = mapStorage();
    const tabA = browserDashboardStorage({ ownerId: OWNER, storage });
    const tabB = browserDashboardStorage({ ownerId: OWNER, storage });
    const start = sample().records;
    await tabA.saveRecords(start);
    const metric = {
      ...newRecord('metric', 'Added in A', { ownerId: OWNER, now: 1000 }),
      value: 1,
      unit: '',
      note: '',
    };
    await tabA.saveRecords(putRecord(start, 'metric', metric));
    const note = Object.values(start.note)[0]!;
    await tabB.saveRecords(
      putRecord(start, 'note', {
        ...touchRecord(note, 2000),
        body: 'Edited in B',
      }),
    );
    const { records } = await tabA.load(DASH);
    expect(records?.metric[metric.id]).toEqual(metric);
    expect(records?.note[note.id]?.body).toBe('Edited in B');
  });

  it('keeps the newer copy of a record both tabs changed', async () => {
    const { storage } = mapStorage();
    const adapter = browserDashboardStorage({ ownerId: OWNER, storage });
    const start = sample().records;
    const note = Object.values(start.note)[0]!;
    await adapter.saveRecords(
      putRecord(start, 'note', { ...touchRecord(note, 5000), body: 'newer' }),
    );
    await adapter.saveRecords(
      putRecord(start, 'note', { ...touchRecord(note, 3000), body: 'older' }),
    );
    expect((await adapter.load(DASH)).records?.note[note.id]?.body).toBe(
      'newer',
    );
  });

  it('refuses to load, rather than risk overwriting, when an invalid value cannot be set aside', async () => {
    const bad = '{"settings":{}}';
    const { map, storage } = mapStorage({ [COMPOSITION_KEY]: bad });
    const full = {
      ...storage,
      setItem: (key: string, value: string) => {
        if (key.endsWith('.invalid')) throw new Error('quota');
        map.set(key, value);
      },
    } as Storage;
    const onError = vi.fn();
    const adapter = browserDashboardStorage({
      ownerId: OWNER,
      storage: full,
      onError,
    });
    await expect(adapter.load(DASH)).rejects.toThrow();
    expect(map.get(COMPOSITION_KEY)).toBe(bad);
  });
});
