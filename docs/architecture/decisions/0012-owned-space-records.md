# ADR-0012: Owned Space records and serializable icon identifiers

**Status:** Accepted  
**Date:** 2026-10-17  
**Deciders:** Hanaa Sadoqi (repository owner), by direct approval to draft the migration and add ownership, selection of Lucide icon names, and explicit selection of account-deletion cascade.

## Context

The owner requested an app-local spaces feature with a schema, inferred types and fixtures, then approved required timestamps and string-array tags. The next approved step is a migration draft and ownership field, including an icon stored as a Lucide name. The owner explicitly chose that deleting an account permanently deletes its owned Space records, matching profiles and account preferences.

`Space` remains a provisional term in [the glossary](../../glossary.md). This is an owner-approved exception for this bounded implementation, not a final naming decision. This foundation does not change [the accepted quick-capture first slice](../../product/first-slice.md), which excludes Spaces from its proof.

## Decision

- Store standalone records in `public.spaces`: database-generated UUID `id`; UUID `owner_id` referencing `auth.users.id`; `name`; nullable `description`; Lucide-name `icon`; `text[]` tags; and non-null `created_at`/`updated_at` timestamps with time zone.
- Ownership defaults to `auth.uid()`. Authenticated clients may insert and update only `name`, `description`, `icon`, and `tags`; they cannot supply or change IDs, ownership or timestamps. Owner-only select/insert/update RLS and explicit column grants apply together. Anonymous access and standalone Space deletion are not granted.
- Use `ON DELETE CASCADE` for the owner foreign key. This is the specifically approved account-deletion behavior, not a decision about content membership or the lifecycle of related Documents. No content relationships exist in this migration.
- Default icon to `folder` and tags to an empty array. Validate icon identifiers as lowercase kebab-case text, never executable SVG or React values. Do not import the entire Lucide catalog into the runtime schema. Catalog membership is a rendering concern: future rendering must handle unavailable/renamed identifiers with a fallback, and future pickers must offer installed names. Tests verify fixture names against installed Lucide 1.55.0.
- Keep tags as a single-dimensional array of non-null strings. Empty arrays, duplicate labels and empty-string labels are permitted, matching the approved plain `string[]` contract; taxonomy and normalization are not adopted.
- Use database defaults for timestamps and the existing `public.set_updated_at()` trigger function for updates. Index `owner_id` for owner filtering and account-deletion lookups.
- Keep saved `ownerId`, `createdAt` and `updatedAt` in the feature contract, while create/update schemas contain editable fields only. The future database adapter must map snake_case names and map a null SQL description to the feature's optional description. Runtime schemas validate data; generated database types will describe the actual database once this migration is applied and introspected.

## Scope

This adopts the bounded storage/ownership contract and an **unapplied migration draft**. It does not assert that a Spaces table exists in the linked Supabase project. The feature remains app-local under `apps/web/src/features/spaces`; fixtures remain under `lib/fixtures` and are not production records.

## What this does NOT decide

- The final noun for contextual environments or their internal organization.
- A change to the first product slice, content containment, Document membership, or other relationships.
- A Space deletion/archive/restore feature, ownership transfer, sharing or collaboration.
- An icon picker, rendering/loading strategy, or guarantee that every well-formed identifier exists in every Lucide version.
- API endpoints, query/caching architecture, route data-source replacement, new packages or dependencies.

## Unresolved

- Application of the migration to Supabase requires a separate reviewed deployment step.
- Request-bound database adapter, generated database types, row mapping and live RLS verification remain future integration work. The current `getSpace` still calls the existing provisional `/api/spaces/:id` URL; this change does not create its handler or replace its source.
- Content relationships and standalone Space lifecycle remain open. Any later cascade involving content requires a separate decision.

## Governance boundary

The owner approved this narrow persisted contract, Lucide-name representation and account-deletion cascade. Applying the migration, broadening access, permitting ownership transfer, adopting another lifecycle or changing the first slice needs explicit authorization. No existing or hosted database is modified by this task.

## Integration expectations

- Migration: `supabase/migrations/20261018013000_create_spaces.sql`; depends on the profiles migration's timestamp function and Supabase Auth roles/functions.
- SQL regression checks: `supabase/tests/spaces.sql`, using `psql -X -v ON_ERROR_STOP=1 -f supabase/tests/spaces.sql <local-connection>` against a disposable migrated database as its administrator. The script rolls back its synthetic users and records; it is not a pgTAP suite and is not wired into the root verification command.
- Zod and inferred types remain the runtime feature contract. No React/Lucide runtime import belongs in `shared`; catalog imports are confined to fixture tests.
- Current app IDs remain opaque strings so existing provisional route fixtures retain their IDs; actual database-generated record IDs and owner IDs are UUIDs. Fixture owners are synthetic UUIDs, never authorization claims.

## Verification expectations

Exercise the real migration on disposable PostgreSQL with synthetic Supabase-compatible roles and `auth.uid()`. Check owner and anonymous access, cross-owner reads/writes, permitted edits, immutable metadata, defaults, timestamp refresh, constraints and account-delete isolation. Deliberately weaken RLS, column grants, the timestamp trigger and the owner cascade to establish that the checks detect those regressions.

This harness proves PostgreSQL behavior under its supplied roles/claim helper; it does not prove hosted Auth, JWT validation, PostgREST or deployed grants. The repository declares PostgreSQL 15 in `supabase/config.toml`; local PostgreSQL 16 checks, if used, must be reported with that version difference and cannot substitute for matching-version Supabase verification. Run the repository's proportional feature checks and root `pnpm verify`, reporting blockers and gates not reached.

## Reconsideration conditions

Revisit this decision when final terminology is chosen, content relationships are introduced, sharing/transfer is needed, tag semantics become richer, or icon rendering needs a constrained catalog. Review the destructive scope before adding any foreign key that could cause account deletion to delete additional content.
