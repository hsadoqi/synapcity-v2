# @synapcity/domain-time

Owns: the temporal value shapes that several domains store and exchange. An instant, a calendar date, a time of day and a duration, as validated ISO 8601 strings. It knows nothing about records, preferences or calendars: callers compose these into their own contracts.

Runtime: portable TypeScript. The only runtime dependency is `zod`, for the schemas; no workspace dependencies. Category rules: [domain README](../README.md) and [ADR-0014](../../../docs/architecture/decisions/0014-multi-app-package-boundaries.md).

Why its own package: the instant is used by `domain-records` (the saved-record times), `domain-prototypes` (event and activity times) and `domain-preferences` (consent times), and the calendar date by `domain-prototypes` (habit days). None of those owns the others, so the shape lives beside them rather than inside one (workspace conventions: a different consumer set).

## Public interface

`@synapcity/domain-time` (root entry):

| Export                               | Meaning                                                                                                                                                   |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `instantSchema`, `Instant`           | One point on the global timeline: date, time and a UTC offset (`Z` or `±HH:MM`). Accepts the `+00:00` PostgREST returns for `timestamptz`. Not normalized |
| `calendarDateSchema`, `CalendarDate` | A day label, `YYYY-MM-DD`, that exists. No time and no zone                                                                                               |
| `timeOfDaySchema`, `TimeOfDay`       | A wall-clock time, `HH:MM[:SS[.fff]]`, with no date and no offset                                                                                         |
| `durationSchema`, `Duration`         | An ISO 8601 duration (`PT5M`, `P1DT2H`, `P1W`), never negative. It accepts calendar units (`P1M`), whose length depends on an anchor date                 |

## Rules

- Schemas validate and keep the string as given. Two instants for the same moment can differ as strings, and string order is not time order across offsets: compare instants with `Date.parse`, never with `<` on the strings.
- Zoned date-times, intervals and recurrence are not here. They wait for a product decision on calendar and scheduling scope.
- A domain that needs a temporal field composes one of these schemas into its own contract (`createdAt: instantSchema`); it does not redefine the format.

## Scripts

`lint`, `check-types`, `test`, `test:coverage`. Tests sit beside the schemas (`*.test.ts`).
