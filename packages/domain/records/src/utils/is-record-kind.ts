import { RECORD_KINDS } from '../constants';

/** True when `value` is one of the persisted record kinds, for input from outside. */
export function isRecordKind(
  value: unknown,
): value is (typeof RECORD_KINDS)[number] {
  return (RECORD_KINDS as readonly unknown[]).includes(value);
}
