import { describe, expect, it } from 'vitest';

import {
  PROTOTYPE_RECORD_KINDS,
  activitySchema,
  assetSchema,
  habitSchema,
  linkSchema,
  prototypeRecordSchemas,
  taskSchema,
} from './index';

const base = {
  id: 'tsk_1',
  ownerId: '11111111-1111-4111-8111-111111111111',
  name: 'Ship it',
  icon: 'square-check',
  tags: [],
  createdAt: '2026-10-01T09:00:00Z',
  updatedAt: '2026-10-01T09:00:00Z',
};

describe('prototype record schemas', () => {
  it('has one schema per kind', () => {
    expect(Object.keys(prototypeRecordSchemas)).toEqual([
      ...PROTOTYPE_RECORD_KINDS,
    ]);
  });

  it('extends the base record, defaulting the pinned and viewed times', () => {
    const task = taskSchema.parse({
      ...base,
      projectId: 'prj_1',
      done: false,
      order: 0,
    });
    expect(task).toMatchObject({ pinnedAt: null, lastViewedAt: null });
    expect(
      taskSchema.safeParse({ ...base, done: false, order: 0 }).success,
    ).toBe(false);
  });

  it('accepts only YYYY-MM-DD habit days', () => {
    expect(
      habitSchema.safeParse({ ...base, completedDays: ['2026-10-01'] }).success,
    ).toBe(true);
    expect(
      habitSchema.safeParse({ ...base, completedDays: ['Oct 1'] }).success,
    ).toBe(false);
  });

  it('accepts only normalized http(s) links', () => {
    expect(
      linkSchema.safeParse({ ...base, url: 'https://example.com/' }).success,
    ).toBe(true);
    expect(
      linkSchema.safeParse({ ...base, url: 'javascript:alert(1)' }).success,
    ).toBe(false);
  });

  it('accepts only base64 raster image data URLs for assets', () => {
    const asset = { ...base, slot: 's1', dataUrl: 'data:image/png;base64,AA' };
    expect(assetSchema.safeParse(asset).success).toBe(true);
    for (const dataUrl of [
      'data:image/jpeg;base64,AA',
      'data:image/webp;base64,AA',
    ]) {
      expect(assetSchema.safeParse({ ...asset, dataUrl }).success).toBe(true);
    }
    for (const dataUrl of [
      'https://x.test/a.png',
      // SVG can carry script; the board only stores downscaled rasters.
      'data:image/svg+xml;base64,AA',
      'data:image/png,not-base64',
    ]) {
      expect(assetSchema.safeParse({ ...asset, dataUrl }).success).toBe(false);
    }
  });

  it('checks the kind of an activity subject', () => {
    const activity = { ...base, occurredAt: '2026-10-01T09:00:00Z' };
    expect(
      activitySchema.safeParse({
        ...activity,
        subject: { kind: 'task', id: 't' },
      }).success,
    ).toBe(true);
    expect(
      activitySchema.safeParse({
        ...activity,
        subject: { kind: 'space', id: 's' },
      }).success,
    ).toBe(false);
  });
});
