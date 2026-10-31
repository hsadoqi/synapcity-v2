-- ADR-0016: one composition (settings, widgets, layouts) per Dashboard, in its
-- own table so layout edits do not move the Dashboard's own `updated_at`.
-- Drafted at the owner's request; NOT applied by repository tooling. Review and
-- apply separately, as with ADR-0012 and ADR-0013.
--
-- The row is created on the first save, not with the Dashboard: a Dashboard
-- without one reads as an empty composition. `public.dashboards` is unchanged.
-- `composition` is validated by the app (dashboardCompositionSchema); the
-- database checks only that it is a JSON object of bounded size.
-- `revision` makes every write conditional (`where revision = :expected`), so a
-- stale tab changes no row instead of overwriting newer work.

begin;

create table public.dashboard_compositions (
  dashboard_id   uuid primary key
                   references public.dashboards (id) on delete cascade,
  owner_id       uuid not null default auth.uid()
                   references auth.users (id) on delete cascade,
  composition    jsonb not null,
  schema_version integer not null default 1,
  revision       bigint not null default 1,
  updated_at     timestamptz not null default now(),
  constraint dashboard_compositions_is_object
    check (jsonb_typeof(composition) = 'object'),
  -- 64 KB; a delegated value (ADR-0016).
  constraint dashboard_compositions_size
    check (pg_column_size(composition) <= 65536),
  constraint dashboard_compositions_schema_version check (schema_version >= 1),
  constraint dashboard_compositions_revision check (revision >= 1)
);

-- Supports RLS and the foreign key's account-delete lookup.
create index dashboard_compositions_owner_id_idx
  on public.dashboard_compositions (owner_id);

alter table public.dashboard_compositions enable row level security;

create policy dashboard_compositions_select_own on public.dashboard_compositions
  for select to authenticated
  using ((select auth.uid()) = owner_id);

-- The caller must own the Dashboard too. The subquery runs under the caller's
-- own row-level security, so another person's Dashboard is not even visible.
create policy dashboard_compositions_insert_own on public.dashboard_compositions
  for insert to authenticated
  with check (
    (select auth.uid()) = owner_id
    and exists (
      select 1 from public.dashboards d
      where d.id = dashboard_id and d.owner_id = (select auth.uid())
    )
  );

create policy dashboard_compositions_update_own on public.dashboard_compositions
  for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

-- No delete policy or grant: a composition goes with its Dashboard (cascade)
-- or its account. Clients never supply owner_id; it defaults to the session.
revoke all on public.dashboard_compositions from public, anon, authenticated;
grant select on public.dashboard_compositions to authenticated;
grant insert (dashboard_id, composition, schema_version, revision)
  on public.dashboard_compositions to authenticated;
grant update (composition, schema_version, revision)
  on public.dashboard_compositions to authenticated;

create trigger dashboard_compositions_set_updated_at
  before update on public.dashboard_compositions
  for each row execute function public.set_updated_at();

commit;
