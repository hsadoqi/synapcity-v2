-- ADR-0013: standalone, owner-scoped Document and Dashboard records.
-- Drafted at the owner's request; NOT applied by repository tooling.
-- Neither table has a space_id: a Space never owns content. Participation in
-- Spaces is a separate record (see the space participation migration).
-- Columns mirror public.spaces (ADR-0012). Body, editor state, widgets and
-- layouts are not decided and are not stored here.

begin;

create table public.documents (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid()
                references auth.users (id) on delete cascade,
  name        text not null,
  description text,
  icon        text not null default 'file-text',
  tags        text[] not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint documents_name_nonblank check (name ~ '[^[:space:]]'),
  constraint documents_icon_identifier check (icon ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint documents_tags_one_dimension check (
    coalesce(array_ndims(tags), 1) = 1
  ),
  constraint documents_tags_no_null_elements check (
    array_position(tags, null) is null
  )
);

create table public.dashboards (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid()
                references auth.users (id) on delete cascade,
  name        text not null,
  description text,
  icon        text not null default 'layout-dashboard',
  tags        text[] not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint dashboards_name_nonblank check (name ~ '[^[:space:]]'),
  constraint dashboards_icon_identifier check (icon ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint dashboards_tags_one_dimension check (
    coalesce(array_ndims(tags), 1) = 1
  ),
  constraint dashboards_tags_no_null_elements check (
    array_position(tags, null) is null
  )
);

-- Supports owner filtering, RLS and the foreign key's account-delete lookup.
create index documents_owner_id_idx on public.documents (owner_id);
create index dashboards_owner_id_idx on public.dashboards (owner_id);

alter table public.documents enable row level security;
alter table public.dashboards enable row level security;

create policy documents_select_own on public.documents
  for select to authenticated
  using ((select auth.uid()) = owner_id);
create policy documents_insert_own on public.documents
  for insert to authenticated
  with check ((select auth.uid()) = owner_id);
create policy documents_update_own on public.documents
  for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
-- Hard delete, the simplest behavior for now (ADR-0013). Deleting an item
-- removes its participation rows in every Space through their cascade.
create policy documents_delete_own on public.documents
  for delete to authenticated
  using ((select auth.uid()) = owner_id);

create policy dashboards_select_own on public.dashboards
  for select to authenticated
  using ((select auth.uid()) = owner_id);
create policy dashboards_insert_own on public.dashboards
  for insert to authenticated
  with check ((select auth.uid()) = owner_id);
create policy dashboards_update_own on public.dashboards
  for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy dashboards_delete_own on public.dashboards
  for delete to authenticated
  using ((select auth.uid()) = owner_id);

-- Row policies and column grants apply together. Clients cannot choose or
-- change IDs, ownership or timestamps.
revoke all on public.documents from public, anon, authenticated;
grant select, delete on public.documents to authenticated;
grant insert (name, description, icon, tags)
  on public.documents to authenticated;
grant update (name, description, icon, tags)
  on public.documents to authenticated;

revoke all on public.dashboards from public, anon, authenticated;
grant select, delete on public.dashboards to authenticated;
grant insert (name, description, icon, tags)
  on public.dashboards to authenticated;
grant update (name, description, icon, tags)
  on public.dashboards to authenticated;

-- Reuse the timestamp function introduced by the profiles migration.
create trigger documents_set_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();
create trigger dashboards_set_updated_at
  before update on public.dashboards
  for each row execute function public.set_updated_at();

commit;
