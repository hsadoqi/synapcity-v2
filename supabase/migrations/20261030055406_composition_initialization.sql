-- Every Dashboard has exactly one composition from the moment it exists, at
-- revision 1 (owner decision D4; amends ADR-0016 decisions 1 and 2). A trigger
-- creates it in the same transaction as the Dashboard insert, so there is one
-- save path (an update at `revision + 1`) and a missing row is a visible
-- failure, never an empty canvas. Existing Dashboards are backfilled.
--
-- The default document below must equal `createComposition()` in
-- `@synapcity/domain-dashboards`; a unit test compares this literal with it and
-- a database test compares the trigger's output with it. Change one, change
-- both, in a new migration (this file is immutable once merged).
--
-- The revision trigger (dashboard_revisions) fires on the composition insert,
-- so a new Dashboard gets an 'initial' revision and a backfilled one a
-- 'backfill' revision from the same code. That is why revisions precede this
-- migration.

begin;

create function private.create_default_composition()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.dashboard_compositions
    (dashboard_id, owner_id, composition, schema_version, revision)
  values (
    new.id,
    new.owner_id,
    '{"settings":{"columns":3,"cardRadius":8,"showWidgetTitles":true},"widgets":[],"layouts":{"lg":[],"md":[],"sm":[]}}'::jsonb,
    1,
    1
  );
  return null;
end;
$$;

revoke execute on function private.create_default_composition()
  from public, anon, authenticated;

create trigger dashboards_create_composition
  after insert on public.dashboards
  for each row execute function private.create_default_composition();

-- Set-based, idempotent backfill. The revision trigger records each as
-- 'backfill', because its Dashboard was created before this transaction.
insert into public.dashboard_compositions
  (dashboard_id, owner_id, composition, schema_version, revision)
select
  d.id,
  d.owner_id,
  '{"settings":{"columns":3,"cardRadius":8,"showWidgetTitles":true},"widgets":[],"layouts":{"lg":[],"md":[],"sm":[]}}'::jsonb,
  1,
  1
from public.dashboards d
where not exists (
  select 1 from public.dashboard_compositions c where c.dashboard_id = d.id
);

commit;
