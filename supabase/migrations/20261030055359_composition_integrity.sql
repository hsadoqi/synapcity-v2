-- Dashboard composition integrity (database release 1, with dashboard_revisions
-- and composition_initialization). Forward-only: migration 20261029100000 is
-- not edited. Amends ADR-0016 decisions 1 to 3.
--
--   * The size backstop measures the text form of the document (128 KiB of
--     `jsonb::text`), not `pg_column_size`, which depends on TOAST compression
--     and let a compressible 200 KB document through. The application contract
--     stays 64 KiB of compact JSON (`parsePersistableComposition`); `jsonb::text`
--     adds spacing, so the two cannot match exactly and the database figure is
--     a backstop with room to spare.
--   * Only document version 1 is accepted.
--   * `revision` must rise by exactly 1 on every update (compare-and-swap in the
--     database). A stale writer, direct Data API caller included, cannot jump,
--     rewind or repeat a revision. The conflict has its own SQLSTATE, outside
--     the classes PostgREST maps to HTTP 500.
--   * Clients can no longer insert a composition: it is created with its
--     Dashboard (composition_initialization).
--
-- The table is empty on every persistent database when this ships (migration
-- 20261029100000 is undeployed), so the new checks are validated immediately.

begin;

alter table public.dashboard_compositions
  drop constraint dashboard_compositions_size,
  drop constraint dashboard_compositions_schema_version;

alter table public.dashboard_compositions
  add constraint dashboard_compositions_text_size
    check (octet_length(composition::text) <= 131072),
  add constraint dashboard_compositions_schema_version
    check (schema_version in (1));

-- Raised as SQLSTATE PT409: the `PT` prefix lets PostgREST answer with the
-- HTTP status in the digits (409), and supabase-js exposes it as `error.code`.
-- The usual serialization code (40001) maps to HTTP 500, so it is not used.
create function private.enforce_revision_increment()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.revision is distinct from old.revision + 1 then
    raise exception 'composition revision conflict'
      using errcode = 'PT409',
            detail = format('stored revision %s, attempted %s', old.revision, new.revision);
  end if;
  return new;
end;
$$;

revoke execute on function private.enforce_revision_increment()
  from public, anon, authenticated;

-- Named so it sorts before the other BEFORE UPDATE triggers on this table
-- (revision capture, then the updated_at stamp): triggers fire in name order.
create trigger dashboard_compositions_10_revision
  before update on public.dashboard_compositions
  for each row execute function private.enforce_revision_increment();

-- Compositions are created by the database with their Dashboard. A client may
-- not insert one (no policy, no privilege); an update is still limited to the
-- document, its version and its revision.
drop policy dashboard_compositions_insert_own on public.dashboard_compositions;
revoke insert on public.dashboard_compositions from authenticated;

commit;
