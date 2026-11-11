/**
 * How long `profiles.account_deletion_started_at` keeps blocking new avatars
 * after it was last set. The same 15 minutes are written into the
 * `avatars_insert_own` Storage policy
 * (`20261111200000_profile_setup_and_deletion_marker.sql`). It is longer than
 * any request that can still act on the marker (Vercel's 300 s function limit,
 * the 8 s statement timeout), so a deletion that dies part-way never blocks
 * the account for long.
 */
const DELETION_MARKER_WINDOW_MS = 15 * 60 * 1000;

/** Whether a deletion marker read from the profile row is still active. */
export function deletionMarkerActive(
  startedAt: string | null | undefined,
  now: number,
): boolean {
  if (!startedAt) return false;
  const started = Date.parse(startedAt);
  if (Number.isNaN(started)) return false;
  return now - started < DELETION_MARKER_WINDOW_MS;
}

/**
 * The PostgREST filter a write uses to apply only while no deletion is active,
 * judged at `now`. The database stamps the marker with its own clock; the few
 * seconds two clocks may differ are small next to the window, and the Storage
 * policy applies the same rule with the database clock.
 */
export function noActiveDeletionFilter(now: number): string {
  const cutoff = new Date(now - DELETION_MARKER_WINDOW_MS).toISOString();
  return `account_deletion_started_at.is.null,account_deletion_started_at.lt."${cutoff}"`;
}
