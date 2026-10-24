import { describe, expect, it } from 'vitest';

import { newRecord } from '../new-record';
import { emptyRecords, putRecord } from '../record-tables';
import { updateMetricValue } from './index';

const ctx = { ownerId: '11111111-1111-4111-8111-111111111111', now: 0 };
const base = () =>
  putRecord(emptyRecords(), 'metric', {
    ...newRecord('metric', 'Steps', ctx),
    id: 'm1',
    value: 100,
    unit: 'steps',
    note: '',
  });

describe('updateMetricValue', () => {
  it('writes a finite value and touches the record', () => {
    const r = updateMetricValue(base(), 'm1', 250, 2000);
    expect(r.metric.m1).toMatchObject({ value: 250 });
    expect(r.metric.m1?.updatedAt).toBe('1970-01-01T00:00:02.000Z');
  });

  it('returns the same records for NaN, an unchanged value or an unknown metric', () => {
    const r = base();
    expect(updateMetricValue(r, 'm1', Number.NaN, 1)).toBe(r);
    expect(updateMetricValue(r, 'm1', 100, 1)).toBe(r);
    expect(updateMetricValue(r, 'missing', 1, 1)).toBe(r);
  });
});
