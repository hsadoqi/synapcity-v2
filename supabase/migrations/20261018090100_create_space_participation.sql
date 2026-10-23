-- ADR-0013: contextual participation of Documents and Dashboards in Spaces.
-- Drafted at the owner's request; NOT applied by repository tooling.
-- Participation is not ownership: an item may be in zero, one or many Spaces,
-- once per Space. Removing a row removes the item from that Space only.
-- Participation is not a link; links between items are a separate record.
-- Also allows standalone Space deletion, which removes only participation rows.

begin;

create table public.space_documents (
  space_id    uuid not null references public.spaces (id) on delete cascade,
  document_id uuid not null references public.documents (id) on delete cascade,
  owner_id    uuid not null default auth.uid()
                references auth.users (id) on delete cascade,
  -- Per-Space presentation: how the item appears in this Space only.
  pinned      boolean not null default false,
  position    integer,
  added_at    timestamptz not null default now(),
  primary key (space_id, document_id)
);

create table public.space_dashboards (
  space_id     uuid not null references public.spaces (id) on delete cascade,
  dashboard_id uuid not null references public.dashboards (id) on delete cascade,
  owner_id     uuid not null default auth.uid()
                 references auth.users (id) on delete cascade,
  pinned       boolean not null default false,
  position     integer,
  added_at     timestamptz not null default now(),
  primary key (space_id, dashboard_id)
);

-- The primary key serves "items in a Space"; these serve "Spaces of an item",
-- the item-delete cascade, owner filtering and the account-delete lookup.
create index space_documents_document_id_idx on public.space_documents (document_id);
create index space_documents_owner_id_idx on public.space_documents (owner_id);
create index space_dashboards_dashboard_id_idx on public.space_dashboards (dashboard_id);
create index space_dashboards_owner_id_idx on public.space_dashboards (owner_id);

alter table public.space_documents enable row level security;
alter table public.space_dashboards enable row level security;

-- Inserts must own the row, the Space and the item. The subqueries run under
-- the caller's own RLS on spaces/documents/dashboards, so they only see rows
-- the caller owns.
create policy space_documents_select_own on public.space_documents
  for select to authenticated
  using ((select auth.uid()) = owner_id);
create policy space_documents_insert_own on public.space_documents
  for insert to authenticated
  with check (
    (select auth.uid()) = owner_id
    and exists (
      select 1 from public.spaces s
      where s.id = space_id and s.owner_id = (select auth.uid())
    )
    and exists (
      select 1 from public.documents d
      where d.id = document_id and d.owner_id = (select auth.uid())
    )
  );
create policy space_documents_update_own on public.space_documents
  for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy space_documents_delete_own on public.space_documents
  for delete to authenticated
  using ((select auth.uid()) = owner_id);

create policy space_dashboards_select_own on public.space_dashboards
  for select to authenticated
  using ((select auth.uid()) = owner_id);
create policy space_dashboards_insert_own on public.space_dashboards
  for insert to authenticated
  with check (
    (select auth.uid()) = owner_id
    and exists (
      select 1 from public.spaces s
      where s.id = space_id and s.owner_id = (select auth.uid())
    )
    and exists (
      select 1 from public.dashboards d
      where d.id = dashboard_id and d.owner_id = (select auth.uid())
    )
  );
create policy space_dashboards_update_own on public.space_dashboards
  for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy space_dashboards_delete_own on public.space_dashboards
  for delete to authenticated
  using ((select auth.uid()) = owner_id);

-- Clients pick the pair once and may change only presentation afterwards.
-- Moving a row to another Space or item is a delete plus an insert.
revoke all on public.space_documents from public, anon, authenticated;
grant select, delete on public.space_documents to authenticated;
grant insert (space_id, document_id, pinned, position)
  on public.space_documents to authenticated;
grant update (pinned, position)
  on public.space_documents to authenticated;

revoke all on public.space_dashboards from public, anon, authenticated;
grant select, delete on public.space_dashboards to authenticated;
grant insert (space_id, dashboard_id, pinned, position)
  on public.space_dashboards to authenticated;
grant update (pinned, position)
  on public.space_dashboards to authenticated;

-- Standalone Space deletion (ADR-0013 amends ADR-0012). The cascades above
-- remove the Space's participation rows; documents and dashboards remain.
create policy spaces_delete_own on public.spaces
  for delete to authenticated
  using ((select auth.uid()) = owner_id);
grant delete on public.spaces to authenticated;

commit;
