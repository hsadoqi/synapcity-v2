/*
 * A duration is a length of time with no start or zone: what a countdown shows.
 * Hours are not capped at 23, so 100 hours reads as 100, not 4 days and 4 hours.
 */

const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = 60 * MS_PER_SECOND;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;

export interface DurationParts {
  hours: number;
  minutes: number;
  seconds: number;
}

/** Splits milliseconds into whole hours, minutes and seconds. Negative or non-finite input is no time left. */
export function splitDuration(ms: number): DurationParts {
  const total = Number.isFinite(ms) ? Math.max(0, ms) : 0;
  return {
    hours: Math.floor(total / MS_PER_HOUR),
    minutes: Math.floor((total % MS_PER_HOUR) / MS_PER_MINUTE),
    seconds: Math.floor((total % MS_PER_MINUTE) / MS_PER_SECOND),
  };
}

/** Pads a whole number to at least two digits, flooring fractions and clamping below zero. */
export function padTwo(value: number): string {
  return String(Math.max(0, Math.floor(value))).padStart(2, '0');
}

const CLOCK_DURATION = /^(\d+):(\d{2}):(\d{2})$/;

/**
 * Reads `HH:MM:SS` as seconds, or returns `null` for anything else. Minutes and
 * seconds must be below 60; the text is rejected rather than coerced to zero,
 * so a typo does not turn into a countdown that is already finished.
 */
export function parseClockDuration(text: string): number | null {
  const match = CLOCK_DURATION.exec(text);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3]);
  if (minutes >= 60 || seconds >= 60) return null;
  return hours * 3_600 + minutes * 60 + seconds;
}
