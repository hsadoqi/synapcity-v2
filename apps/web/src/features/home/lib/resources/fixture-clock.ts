/** The clock the resource fixtures are dated against. */
export const FIXTURE_NOW = new Date('2026-10-10T12:00:00Z');

/** An ISO timestamp `days` before the fixture clock. */
export function daysAgo(days: number) {
  return new Date(
    FIXTURE_NOW.getTime() - days * 24 * 60 * 60 * 1000,
  ).toISOString();
}
