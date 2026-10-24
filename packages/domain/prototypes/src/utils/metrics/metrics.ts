import type { PrototypeRecords } from '../../types';
import { putRecord, touchRecord } from '../record-tables';

/**
 * Writes a stat's value. A non-finite value, or one equal to the current value,
 * returns `records` unchanged.
 */
export function updateMetricValue(
  records: PrototypeRecords,
  metricId: string,
  value: number,
  now: number,
): PrototypeRecords {
  const metric = records.metric[metricId];
  if (!metric || !Number.isFinite(value) || metric.value === value) {
    return records;
  }
  return putRecord(records, 'metric', {
    ...touchRecord(metric, now),
    value,
  });
}
