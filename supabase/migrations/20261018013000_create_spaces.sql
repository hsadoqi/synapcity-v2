-- ADR-0012: owner-scoped Space records. Drafted at the owner's request;
-- NOT applied by repository tooling. Review and apply separately.
-- Icon values are Lucide kebab-case identifiers, not SVG or React components.

begin;

create table public.spaces (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid()
                references auth.users (id) on delete cascade,
  name        text not null,
  description text,
  icon        text not null default 'folder',
  tags        text[] not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint spaces_name_nonblank check (name ~ '[^[:space:]]'),
  constraint spaces_icon_identifier check (icon ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint spaces_tags_one_dimension check (
    coalesce(array_ndims(tags), 1) = 1
  ),
  constraint spaces_tags_no_null_elements check (
    array_position(tags, null) is null
  )
);

-- Supports owner filtering, RLS and the foreign key's account-delete lookup.
create index spaces_owner_id_idx on public.spaces (owner_id);

alter table public.spaces enable row level security;

create policy spaces_select_own on public.spaces
  for select to authenticated
  using ((select auth.uid()) = owner_id);

create policy spaces_insert_own on public.spaces
  for insert to authenticated
  with check ((select auth.uid()) = owner_id);

create policy spaces_update_own on public.spaces
  for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

-- Both row policies and column grants apply. Clients cannot choose or change
-- IDs, ownership or timestamps. No standalone Space DELETE is adopted here;
-- only deleting the owning account cascades to its Space records.
revoke all on public.spaces from public, anon, authenticated;
grant select on public.spaces to authenticated;
grant insert (name, description, icon, tags)
  on public.spaces to authenticated;
grant update (name, description, icon, tags)
  on public.spaces to authenticated;

-- Reuse the timestamp function introduced by the profiles migration.
create trigger spaces_set_updated_at
  before update on public.spaces
  for each row execute function public.set_updated_at();

commit;
