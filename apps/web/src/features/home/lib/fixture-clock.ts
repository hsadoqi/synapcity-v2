/**
 * The one clock every home fixture is dated against, so "2h ago" and
 * "Updated today" labels read the same whatever the real date is.
 */
export const FIXTURE_NOW = new Date('2026-10-10T10:45:00Z');

/** An ISO timestamp `days` before the fixture clock. */
export function daysAgo(days: number) {
  return new Date(
    FIXTURE_NOW.getTime() - days * 24 * 60 * 60 * 1000,
  ).toISOString();
}
