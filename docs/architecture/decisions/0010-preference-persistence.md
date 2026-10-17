# ADR-0010: Preference persistence (account and device preferences)

**Status:** Proposed
**Date:** 2026-10-17
**Deciders:** Hanaa Sadoqi (repository owner). Not yet approved.

## Context

The settings page (`apps/web/src/features/settings`) stores every preference in one browser `localStorage` entry, `synapcity-preferences`, validated by the Zod `settingsSchema` (`types/settings.ts`). Sections: `regional`, `appearance`, `theme`, `notifications`, `privacy`. Import and export use the same schema (`lib/settings.ts`).

That is enough for one browser, and it breaks in three ways:

1. Preferences do not follow the person. A second browser or device starts from the defaults.
2. The server cannot read them. Planned work needs it: interface translation (confirmed by the owner on 2026-10-17), and emails or notifications sent in the person's language and timezone.
3. Consent cannot be enforced. `privacy` choices that live only in the browser cannot be honoured by anything server-side.

Some preferences describe the screen in front of the person rather than the person. Colour mode, text size and contrast are the examples. They also have to apply before the first paint, which the boot script in `apps/web/src/app/layout.tsx` does from `localStorage`. A network round trip cannot.

The owner asked on 2026-10-17 for only some preferences to be stored in the database. This ADR proposes where the line falls.

It addresses part of two candidate decisions in the [index](README.md): "Theme editor and preference persistence" and "Persistence, API, routing and state management". It does not settle either in full.

## Decision

If accepted:

### 1. Split preferences into account and device scope

| Scope       | Sections and fields                                                                                                                              | Stored in                                         | Why                                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Account** | `regional` (all), `notifications` (all), `privacy` (all), `theme.headingFont`, `theme.bodyFont`, `theme.codeFont`                                | Supabase, one row per user; a local copy as cache | Belongs to the person; the server needs regional, notification and privacy values; fonts are taste, not a property of the device |
| **Device**  | `theme.mode`, `appearance` (`fontSize`, `contrastMode`, `showBorders`, `animationsEnabled`, `reducedMotion`; `colorScheme` mirrors `theme.mode`) | `localStorage` only                               | Depends on the screen and surroundings; must apply before first paint; a dark office and a bright phone want different values    |

Signed-out visitors keep everything in `localStorage`, as today.

### 2. One table, `public.user_preferences`, holding a validated JSON document

```sql
create table public.user_preferences (
  user_id         uuid primary key references auth.users (id) on delete cascade,
  preferences     jsonb not null default '{}'::jsonb,
  schema_version  smallint not null default 1,
  device_timezone text,
  updated_at      timestamptz not null default now(),
  constraint user_preferences_is_object check (jsonb_typeof(preferences) = 'object'),
  constraint user_preferences_size check (pg_column_size(preferences) <= 16384)
);
```

- `preferences` holds only the **account** sections, in the same shape the Zod schema already parses. The application validates every write with `settingsSchema` (one source of truth for fields and enums). The database checks the outer shape and size only.
- `schema_version` lets a later change migrate stored documents. This one does what `firstDayOfWeek`'s preprocess does in code today.
- `device_timezone` is the last IANA zone a signed-in browser reported. It is needed because `regional.timezone` may be `'system'` ("follow the device"), which a server job cannot resolve. Server code uses `regional.timezone` when it is a real zone, otherwise `device_timezone`, otherwise `UTC`.
- Row-level security follows `profiles`: owner-only `select` and `update`, explicit grants, the shared `set_updated_at()` trigger. Rows are created by an `insert` policy limited to the owner. The signup trigger stays untouched, so an existing user gets a row on their first save.

A separate table, rather than columns on `profiles`, keeps identity and preferences apart, as ADR-0007 keeps auth metadata and `profiles` apart. Preference writes are also frequent and small, and profile reads should not carry them.

A JSON document, rather than one column per field, follows the existing schema. Fields are added often (fonts were added this week). The schema already handles defaults for missing fields, and import, export and storage share one validator. The cost: SQL cannot easily constrain individual values. That is acceptable while every write goes through server code that runs the Zod schema.

### 3. Reads and writes

- **Read:** the settings route's server component reads the row with the request's Supabase client and passes the account preferences to `SettingsProvider`, the same way it already passes `name`. The provider merges them as authoritative over the local copy.
- **Write:** account-scope changes go through a server action that parses with `settingsSchema`, upserts the row and returns the stored value. Device-scope changes stay local. The provider keeps updating local state and `localStorage` immediately, so the interface does not wait on the network.
- **Conflict rule:** the database wins for account scope. The local copy is a cache, and it is replaced by what the server returns. There is no multi-device merge beyond last write wins, which is acceptable for single-user, low-frequency settings.
- **First sign-in adoption:** if a signed-in user has no row and the local copy holds account preferences that differ from the defaults, the first load writes them up once. Choices made before signing in are kept, not reset.
- **Failure:** if a write fails, the local value stays applied, the status line says the change was not saved to the account, and the next successful write supersedes it.

### 4. Not stored on the server

Device-scope preferences, the old `account` key that `withoutStoredAccount` already strips, and nothing from `auth.users` (email stays there, as in `profiles`).

## Scope

The scope split, the `user_preferences` table and its access policy, and the read, write and reconciliation rules above, for the existing `settingsSchema` sections.

## What this does NOT decide

- The general persistence, API or state-management architecture of the product. This is one table for one capability.
- How translation is implemented (library, message format, routing by locale). This ADR makes `regional.language` available to the server and nothing more.
- A shared date, time and number formatting helper that reads these preferences. It is related, but its owning module is a separate choice.
- The theme editor and any `--font-preference-*` override beyond the three font fields.
- Syncing device-scope preferences across devices, or "per-device profiles".
- Notification delivery, and what each `privacy` flag enforces server-side.
- Any change to `profiles`, signup, or account deletion beyond the cascade.

## Unresolved

- Whether `appearance` accessibility settings (`contrastMode`, `reducedMotion`, `fontSize`) should be account scope instead. A person with low vision may want them everywhere; the proposal keeps them on the device because the operating system already reports reduced motion and contrast per device. Owner's call.
- Whether to keep theme fonts in account scope. The proposal says yes. The boot script then needs the cached local copy to avoid a flash of the default fonts on a new device until the first load completes.
- Whether migrations are applied by hand in the dashboard, as the existing ones say, or with `supabase db push` once the project is linked.
- Whether export and import should label which preferences are account and which are device, or keep one flat file as today.

## Governance boundary

The owner approves this ADR before the migration is written or run, as the project rules require for persisted schemas. After acceptance, adding a field to an existing account section needs no new ADR: it is a Zod change, plus a `schema_version` migration only if stored values change meaning. Moving a section between scopes, adding a table, or changing the access policy needs an amendment here.

## Integration expectations

- The migration follows `supabase/migrations/20261013162633_create_profiles.sql`: owner-only RLS, `(select auth.uid())` in policies, explicit `revoke` and `grant`, `security invoker` functions, and `set search_path = ''`.
- Server reads use the existing request-scoped Supabase server client; nothing reads preferences in the browser with the Data API.
- `SettingsProvider` keeps its public shape (`settings`, `updateSettings`, `status`, `isReady`). Consumers do not learn where a value is stored.
- The boot script and `localStorage` key stay as they are for device scope and as the cache for account scope.
- Account deletion keeps working through `on delete cascade`.

## Verification expectations

- A SQL test or manual check that a user cannot select, insert or update another user's row, and that `anon` has no access.
- Unit tests for the scope split: each `settingsSchema` field is classified exactly once, so a new field fails a test until it is placed. This mirrors `settings-coverage.dom.test.tsx`.
- Provider tests for: server value overriding a stale local copy; first-sign-in adoption; a failed write keeping the local value and reporting it; signed-out behaviour unchanged.
- The existing import, export and storage tests still pass.
- A manual two-browser check: change the language in one, reload the other, see it follow; change colour mode in one, see the other unchanged.

## Reconsideration conditions

- Querying by a single preference becomes common (for example "everyone in this timezone"). Then promote that field to a typed column.
- Device-scope sync is requested.
- Preferences grow per context (per workspace or per document) rather than per person.
- A general persistence or API decision supersedes the server-action write path.
