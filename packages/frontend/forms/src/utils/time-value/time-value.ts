const TIME_VALUE = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;

/**
 * A time of day as a form holds it: 24-hour `HH:mm`, or `HH:mm:ss` when the
 * field steps in seconds. Nothing chosen is `''`.
 */
export function isTimeValue(value: unknown): value is string {
  return typeof value === 'string' && TIME_VALUE.test(value);
}

/** The value if it is a valid time, else `''`, so an unusable value never reaches the control. */
export function toTimeValue(value: unknown): string {
  return isTimeValue(value) ? value : '';
}

/** Seconds since midnight, or `undefined` if the text is not a time. */
export function timeToSeconds(value: unknown): number | undefined {
  if (!isTimeValue(value)) return undefined;
  const [hours, minutes, seconds] = value.split(':').map(Number);
  return (hours ?? 0) * 3600 + (minutes ?? 0) * 60 + (seconds ?? 0);
}

/** Whether the field shows seconds: a step of less than a minute asks for them. */
export function stepShowsSeconds(step: number | undefined): boolean {
  return step !== undefined && step < 60;
}
