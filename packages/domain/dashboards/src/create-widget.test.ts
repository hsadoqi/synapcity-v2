import {
  emptyRecords,
  getRecord,
  prototypeRecordSchemas,
} from '@synapcity/domain-prototypes';
import { describe, expect, it } from 'vitest';

import { createWidget } from './index';

const ctx = { ownerId: '11111111-1111-4111-8111-111111111111', now: 0 };

describe('createWidget', () => {
  it('creates a source record for record-backed widgets only', () => {
    const tasks = createWidget('tasks', emptyRecords(), ctx);
    expect(Object.keys(tasks.records.project)).toHaveLength(1);
    expect(Object.keys(tasks.records.task)).toHaveLength(1);
    const feed = createWidget('feed', emptyRecords(), ctx);
    expect(feed.widget).toMatchObject({ type: 'feed', query: { limit: 6 } });
    expect(
      Object.values(feed.records).every((t) => Object.keys(t).length === 0),
    ).toBe(true);
  });

  it.each(['stat', 'progress', 'habit', 'notes', 'tasks'] as const)(
    'creates a valid %s source record',
    (type) => {
      const { widget, records } = createWidget(type, emptyRecords(), ctx);
      if (!('source' in widget)) throw new Error('expected a source');
      const record = getRecord(records, widget.source);
      expect(prototypeRecordSchemas[widget.source.kind].parse(record)).toEqual(
        record,
      );
    },
  );

  it.each(['pinned', 'last-opened', 'spaces'] as const)(
    'creates the %s link widget with a limit and no record',
    (type) => {
      const { widget, records } = createWidget(type, emptyRecords(), ctx);
      expect(widget).toMatchObject({ type, query: { limit: 6 } });
      expect(records).toEqual(emptyRecords());
    },
  );
});
