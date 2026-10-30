-- Dashboard revisions: immutable, complete, restorable snapshots of a
-- Dashboard's state, written by the database in the same transaction as the
-- change (owner decision D8). "Revision" in `dashboard_revisions` and
-- `private.capture_dashboard_revision` is a working label until the glossary
-- naming step runs; the compare-and-swap counter on `dashboard_compositions`
-- is a different number and keeps its column name.
--
-- A revision holds the whole state: composition, schema_version, and the
-- Dashboard's name, description, icon and tags. It is never written by a
-- client: clients can only read their own.
--
-- When a revision is taken (values live in one function, private.dashboard_
-- revision_policy(), which tests redefine inside a rolled-back transaction; a
-- runtime setting would let any session change them):
--   * initial / backfill: when a composition is created. 'initial' if its
--     Dashboard was created in the same transaction, else 'backfill'.
--   * checkpoint, by pre-image: a save that arrives after a quiet gap (5
--     minutes since the head was last written) first freezes the stored head,
--     the previous burst's final state, before overwriting it. A burst that
--     runs past the span (30 minutes since the latest revision) freezes the
--     head too, if it differs from that revision. The database clock decides.
--   * a Dashboard rename or icon/tag edit freezes the old head only if that
--     exact state is in no revision. It never snapshots the new state.
--   * a state equal (SHA-256 of the full state) to the latest revision's is not
--     stored again.
-- At most 500 revisions are kept per Dashboard: the oldest are pruned, the
-- newest never.
--
-- Both capture paths take the same lock before choosing a sequence: the
-- composition row. The composition path already holds it; the metadata path
-- takes it after its own Dashboard row. The composition path never locks the
-- Dashboard row, so the lock order is fixed and the two cannot deadlock.

begin;

create table public.dashboard_revisions (
  id             uuid primary key default gen_random_uuid(),
  dashboard_id   uuid not null
                   references public.dashboards (id) on delete cascade,
  owner_id       uuid not null
                   references auth.users (id) on delete cascade,
  -- Counts revisions of one Dashboard; unrelated to the composition's
  -- compare-and-swap `revision`.
  sequence       bigint not null,
  source         text not null
                   check (source in ('initial', 'checkpoint', 'backfill')),
  schema_version integer not null,
  composition    jsonb not null,
  name           text not null,
  description    text,
  icon           text not null,
  tags           text[] not null,
  -- octet_length(composition::text), the figure the size backstop uses.
  content_bytes  integer not null,
  -- SHA-256 of the canonical full state (private.dashboard_state_hash).
  content_hash   bytea not null,
  created_by     uuid,
  created_at     timestamptz not null default now(),
  constraint dashboard_revisions_sequence_positive check (sequence >= 1),
  constraint dashboard_revisions_dashboard_sequence unique (dashboard_id, sequence)
);

-- The unique constraint's index serves "latest first" scans backward. This one
-- supports the account-delete cascade's lookup by owner.
create index dashboard_revisions_owner_id_idx
  on public.dashboard_revisions (owner_id);

alter table public.dashboard_revisions enable row level security;

create policy dashboard_revisions_select_own on public.dashboard_revisions
  for select to authenticated
  using ((select auth.uid()) = owner_id);

-- Read-only for clients: no insert, update or delete privilege, no policy.
revoke all on public.dashboard_revisions from public, anon, authenticated;
grant select on public.dashboard_revisions to authenticated;

-- Nothing edits a revision. No grant exists; this guards administrator
-- mistakes. DELETE is not blocked: pruning and cascades need it.
create function private.reject_revision_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'dashboard revisions are immutable'
    using errcode = '23001';
end;
$$;

revoke execute on function private.reject_revision_update()
  from public, anon, authenticated;

create trigger dashboard_revisions_immutable
  before update on public.dashboard_revisions
  for each row execute function private.reject_revision_update();

-- The policy values. Tests redefine this inside a rolled-back transaction.
create function private.dashboard_revision_policy()
returns table (gap interval, span interval, cap integer)
language sql
stable
set search_path = ''
as $$
  select interval '5 minutes', interval '30 minutes', 500
$$;

revoke execute on function private.dashboard_revision_policy()
  from public, anon, authenticated;

-- The canonical full state. `jsonb` output has sorted keys and normalized
-- spacing, so equal states hash equally.
create function private.dashboard_state_hash(
  p_schema_version integer,
  p_composition    jsonb,
  p_name           text,
  p_description    text,
  p_icon           text,
  p_tags           text[]
)
returns bytea
language sql
immutable
set search_path = ''
as $$
  select sha256(convert_to(jsonb_build_object(
    'v', p_schema_version,
    'c', p_composition,
    'n', p_name,
    'd', p_description,
    'i', p_icon,
    't', to_jsonb(p_tags)
  )::text, 'UTF8'))
$$;

revoke execute on function private.dashboard_state_hash(integer, jsonb, text, text, text, text[])
  from public, anon, authenticated;

-- Stores one revision of the given state unless the latest revision already
-- holds it, then prunes. SECURITY DEFINER because clients may not write to the
-- table; it is reachable only from the triggers below.
create function private.capture_dashboard_revision(
  p_dashboard_id   uuid,
  p_owner_id       uuid,
  p_schema_version integer,
  p_composition    jsonb,
  p_name           text,
  p_description    text,
  p_icon           text,
  p_tags           text[],
  p_source         text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hash   bytea;
  v_latest bytea;
  v_next   bigint;
  v_cap    integer;
begin
  -- The shared capture lock (see the header). Already held on the composition
  -- path; the metadata path takes it here.
  perform 1
    from public.dashboard_compositions
   where dashboard_id = p_dashboard_id
     for update;

  v_hash := private.dashboard_state_hash(
    p_schema_version, p_composition, p_name, p_description, p_icon, p_tags
  );

  select r.content_hash into v_latest
    from public.dashboard_revisions r
   where r.dashboard_id = p_dashboard_id
   order by r.sequence desc
   limit 1;
  if v_latest is not distinct from v_hash then
    return;
  end if;

  select coalesce(max(r.sequence), 0) + 1 into v_next
    from public.dashboard_revisions r
   where r.dashboard_id = p_dashboard_id;

  insert into public.dashboard_revisions (
    dashboard_id, owner_id, sequence, source, schema_version, composition,
    name, description, icon, tags, content_bytes, content_hash, created_by
  ) values (
    p_dashboard_id, p_owner_id, v_next, p_source, p_schema_version, p_composition,
    p_name, p_description, p_icon, p_tags,
    octet_length(p_composition::text), v_hash,
    coalesce(auth.uid(), p_owner_id)
  );

  -- Keep the newest `cap` revisions. The newest is never pruned.
  select greatest(p.cap, 1) into v_cap from private.dashboard_revision_policy() p;
  delete from public.dashboard_revisions r
   where r.dashboard_id = p_dashboard_id
     and r.sequence <= v_next - v_cap;
end;
$$;

revoke execute on function private.capture_dashboard_revision(
  uuid, uuid, integer, jsonb, text, text, text, text[], text
) from public, anon, authenticated;

-- A composition is created: capture its first state. It reads the Dashboard's
-- name, description, icon and tags without locking the Dashboard row.
create function private.capture_initial_revision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  d record;
begin
  select dsh.name, dsh.description, dsh.icon, dsh.tags, dsh.created_at
    into d
    from public.dashboards dsh
   where dsh.id = new.dashboard_id;
  if not found then
    return null;
  end if;

  perform private.capture_dashboard_revision(
    new.dashboard_id, new.owner_id, new.schema_version, new.composition,
    d.name, d.description, d.icon, d.tags,
    -- Created in this transaction: a new Dashboard. Otherwise a backfill.
    case when d.created_at = now() then 'initial' else 'backfill' end
  );
  return null;
end;
$$;

revoke execute on function private.capture_initial_revision()
  from public, anon, authenticated;

create trigger dashboard_compositions_capture_initial
  after insert on public.dashboard_compositions
  for each row execute function private.capture_initial_revision();

-- A composition is about to be overwritten: freeze the stored head first when
-- the policy says the previous burst is over. Runs after the +1 check (trigger
-- names sort 10_ before 20_), so a rejected write captures nothing, and before
-- the updated_at stamp, so `old.updated_at` is still the previous write.
create function private.capture_checkpoint_revision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  p          record;
  d          record;
  latest     record;
  old_hash   bytea;
  quiet      boolean;
  overlong   boolean := false;
begin
  select * into p from private.dashboard_revision_policy();

  quiet := (now() - old.updated_at) >= p.gap;

  select dsh.name, dsh.description, dsh.icon, dsh.tags
    into d
    from public.dashboards dsh
   where dsh.id = old.dashboard_id;
  if not found then
    return new;
  end if;

  if not quiet then
    select r.created_at, r.content_hash into latest
      from public.dashboard_revisions r
     where r.dashboard_id = old.dashboard_id
     order by r.sequence desc
     limit 1;
    if found and (now() - latest.created_at) >= p.span then
      old_hash := private.dashboard_state_hash(
        old.schema_version, old.composition, d.name, d.description, d.icon, d.tags
      );
      overlong := old_hash is distinct from latest.content_hash;
    end if;
  end if;

  if quiet or overlong then
    perform private.capture_dashboard_revision(
      old.dashboard_id, old.owner_id, old.schema_version, old.composition,
      d.name, d.description, d.icon, d.tags, 'checkpoint'
    );
  end if;
  return new;
end;
$$;

revoke execute on function private.capture_checkpoint_revision()
  from public, anon, authenticated;

create trigger dashboard_compositions_20_capture_checkpoint
  before update on public.dashboard_compositions
  for each row execute function private.capture_checkpoint_revision();

-- A Dashboard's name, description, icon or tags are about to change: freeze the
-- old head if that exact state is in no revision. The new state is not
-- snapshotted; the next save or edit captures it as a pre-image.
create function private.capture_metadata_preimage()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  c record;
  h bytea;
begin
  -- The shared capture lock, taken here after this statement's lock on the
  -- Dashboard row. Selected once so the head cannot move under the check.
  select comp.owner_id, comp.schema_version, comp.composition
    into c
    from public.dashboard_compositions comp
   where comp.dashboard_id = old.id
     for update;
  if not found then
    return new;
  end if;

  h := private.dashboard_state_hash(
    c.schema_version, c.composition, old.name, old.description, old.icon, old.tags
  );
  if not exists (
    select 1 from public.dashboard_revisions r
     where r.dashboard_id = old.id and r.content_hash = h
  ) then
    perform private.capture_dashboard_revision(
      old.id, c.owner_id, c.schema_version, c.composition,
      old.name, old.description, old.icon, old.tags, 'checkpoint'
    );
  end if;
  return new;
end;
$$;

revoke execute on function private.capture_metadata_preimage()
  from public, anon, authenticated;

create trigger dashboards_capture_metadata_preimage
  before update of name, description, icon, tags on public.dashboards
  for each row execute function private.capture_metadata_preimage();

-- Existing compositions get one 'backfill' revision. Idempotent: a composition
-- that already has any revision is skipped. None exist on any persistent
-- database when this ships.
insert into public.dashboard_revisions (
  dashboard_id, owner_id, sequence, source, schema_version, composition,
  name, description, icon, tags, content_bytes, content_hash, created_by
)
select
  c.dashboard_id, c.owner_id, 1, 'backfill', c.schema_version, c.composition,
  d.name, d.description, d.icon, d.tags,
  octet_length(c.composition::text),
  private.dashboard_state_hash(
    c.schema_version, c.composition, d.name, d.description, d.icon, d.tags
  ),
  c.owner_id
from public.dashboard_compositions c
join public.dashboards d on d.id = c.dashboard_id
where not exists (
  select 1 from public.dashboard_revisions r where r.dashboard_id = c.dashboard_id
);

commit;
