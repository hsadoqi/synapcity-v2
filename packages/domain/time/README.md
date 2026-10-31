# @synapcity/domain-time

Owns: the temporal value shapes that several domains store and exchange. An instant, a calendar date, a time of day and a duration, as validated ISO 8601 strings, plus the pure conversions between a calendar-date or time-of-day string and the local `Date` or number a control works with. It knows nothing about records, preferences or calendars: callers compose these into their own contracts.

Runtime: portable TypeScript. The only runtime dependency is `zod`, for the schemas; no workspace dependencies. Category rules: [domain README](../README.md) and [ADR-0014](../../../docs/architecture/decisions/0014-multi-app-package-boundaries.md).

Why its own package: the instant is used by `domain-records` (the saved-record times), `domain-prototypes` (event and activity times) and `domain-preferences` (consent times), and the calendar date by `domain-prototypes` (habit days). None of those owns the others, so the shape lives beside them rather than inside one (workspace conventions: a different consumer set).

## Public interface

`@synapcity/domain-time` (root entry):

| Export                                                            | Meaning                                                                                                                                                                      |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `instantSchema`, `Instant`                                        | One point on the global timeline: date, time and a UTC offset (`Z` or `±HH:MM`). Accepts the `+00:00` PostgREST returns for `timestamptz`. Not normalized                    |
| `calendarDateSchema`, `CalendarDate`                              | A day label, `YYYY-MM-DD`, that exists. No time and no zone                                                                                                                  |
| `timeOfDaySchema`, `TimeOfDay`                                    | A wall-clock time, `HH:MM[:SS[.fff]]`, with no date and no offset                                                                                                            |
| `durationSchema`, `Duration`                                      | An ISO 8601 duration (`PT5M`, `P1DT2H`, `P1W`), never negative. It accepts calendar units (`P1M`), whose length depends on an anchor date                                    |
| `fromDateValue`, `toDateValue`                                    | A `yyyy-MM-dd` string to a local `Date` and back. The calendar parts are checked, not parsed as UTC, so the day never shifts across zones; an impossible date is `undefined` |
| `fromDateRangeValue`, `toDateRangeValue`, `DateRangeValue`        | The same for a `{ from, to }` range, where `to` is absent while only the start is picked; no valid start is `undefined`                                                      |
| `isTimeValue`, `toTimeValue`, `timeToSeconds`, `stepShowsSeconds` | A time input's 24-hour `HH:mm` (or `HH:mm:ss`) value: test it, fall back to `''`, convert to seconds since midnight, and whether a step asks for seconds                     |

## Rules

- Schemas validate and keep the string as given. Two instants for the same moment can differ as strings, and string order is not time order across offsets: compare instants with `Date.parse`, never with `<` on the strings.
- Zoned date-times, intervals and recurrence are not here. They wait for a product decision on calendar and scheduling scope.
- A domain that needs a temporal field composes one of these schemas into its own contract (`createdAt: instantSchema`); it does not redefine the format.

## Scripts

`lint`, `check-types`, `test`, `test:coverage`. Tests sit beside the schemas and values (`*.test.ts`).
