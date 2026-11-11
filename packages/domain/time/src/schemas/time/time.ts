import { z } from 'zod';

/*
 * The four temporal shapes Synapcity stores and exchanges, as ISO 8601 strings.
 * Each is a different concept, and none converts into another without more
 * information (a time zone, an anchor date):
 *
 * - an instant is one point on the global timeline;
 * - a calendar date is a day label with no time and no zone;
 * - a time of day is a wall-clock time with no date and no zone;
 * - a duration is a length of time.
 *
 * The schemas validate and keep the string exactly as given; they never
 * normalize it. Two instants that name the same moment can be different
 * strings (`...Z` and `...+00:00`), and string order is not time order across
 * offsets, so compare instants by parsing them, never as strings.
 */

/**
 * An instant: date, time and a UTC offset (`Z` or `±HH:MM`). PostgreSQL's
 * `timestamptz` comes back from PostgREST as `...+00:00` and `toISOString()`
 * writes `...Z`; both are accepted. A time with no offset is not an instant.
 */
export const instantSchema = z.iso.datetime({ offset: true });

/** A calendar date, `YYYY-MM-DD`, that exists (no 30 February). */
export const calendarDateSchema = z.iso.date();

/** A time of day, `HH:MM` with optional seconds and fraction, and no offset. */
export const timeOfDaySchema = z.iso.time();

/** An ISO 8601 duration such as `PT5M` or `P1DT2H`; never negative. */
export const durationSchema = z.iso.duration();
