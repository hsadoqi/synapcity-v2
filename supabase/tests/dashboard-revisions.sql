-- Dashboard revisions (S1): creation, backfill, immutability, the checkpoint
-- policy (gap, span, dedupe, full-state hash), metadata pre-images, pruning,
-- atomicity, cascades, isolation, and the grants on the capture functions.
-- Run through `pnpm db:test` on a disposable local database; it needs
-- `supabase/tests/_helpers.sql`. Everything is rolled back.
--
-- Time is fixed inside a transaction, so the policy is shrunk with
-- test_helpers.redefine_policy() instead of waiting; the values in the
-- migration are 5 minutes, 30 minutes and 500.
\set ON_ERROR_STOP on

begin;

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'revisions-a@example.test'),
  ('22222222-2222-4222-8222-222222222222', 'revisions-b@example.test');

-- ---------------------------------------------------------------------------
-- 1. Creation: a Dashboard inserted by a client has one composition at
--    revision 1 and one 'initial' revision of its full state.
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);

-- Clients cannot choose the id, so it is found by name afterwards.
insert into public.dashboards (name, description, icon, tags) values
  ('Created', 'About it', 'folder', array['x', 'y']);

reset role;
select set_config('test.created', id::text, true) from public.dashboards where name = 'Created';

do $$
declare
  r record;
  n integer;
begin
  select count(*) into n from public.dashboard_revisions
   where dashboard_id = current_setting('test.created')::uuid;
  if n <> 1 then raise exception 'a new Dashboard must have exactly one revision (saw %)', n; end if;

  select * into r from public.dashboard_revisions
   where dashboard_id = current_setting('test.created')::uuid;
  if r.sequence <> 1 or r.source <> 'initial' or r.schema_version <> 1 then
    raise exception 'the first revision must be sequence 1, initial, version 1 (got %, %, %)',
      r.sequence, r.source, r.schema_version;
  end if;
  if r.name <> 'Created' or r.description <> 'About it' or r.icon <> 'folder'
     or r.tags <> array['x', 'y'] then
    raise exception 'a revision must hold the Dashboard''s name, description, icon and tags';
  end if;
  if r.owner_id <> '11111111-1111-4111-8111-111111111111'
     or r.created_by <> '11111111-1111-4111-8111-111111111111' then
    raise exception 'owner and created_by must be the creating user';
  end if;
  if r.content_bytes <> octet_length(r.composition::text) then
    raise exception 'content_bytes must be octet_length(composition::text)';
  end if;
  if r.content_hash <> private.dashboard_state_hash(
       r.schema_version, r.composition, r.name, r.description, r.icon, r.tags) then
    raise exception 'content_hash must be the hash of the full state';
  end if;
end;
$$;

-- The hash covers the whole state: changing any one field changes it.
do $$
declare
  base bytea := private.dashboard_state_hash(1, '{"a":1}', 'n', 'd', 'i', array['t']);
begin
  if base is distinct from private.dashboard_state_hash(1, '{"a": 1}', 'n', 'd', 'i', array['t']) then
    raise exception 'equal states (key spacing aside) must hash equally';
  end if;
  if base = private.dashboard_state_hash(2, '{"a":1}', 'n', 'd', 'i', array['t'])
     or base = private.dashboard_state_hash(1, '{"a":2}', 'n', 'd', 'i', array['t'])
     or base = private.dashboard_state_hash(1, '{"a":1}', 'N', 'd', 'i', array['t'])
     or base = private.dashboard_state_hash(1, '{"a":1}', 'n', 'D', 'i', array['t'])
     or base = private.dashboard_state_hash(1, '{"a":1}', 'n', null, 'i', array['t'])
     or base = private.dashboard_state_hash(1, '{"a":1}', 'n', 'd', 'j', array['t'])
     or base = private.dashboard_state_hash(1, '{"a":1}', 'n', 'd', 'i', array['u'])
     or base = private.dashboard_state_hash(1, '{"a":1}', 'n', 'd', 'i', array['t', 'u']) then
    raise exception 'every field of the state must change the hash';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Backfill: a Dashboard that existed before the migrations has no
--    composition and no revision; the migration's statement creates both, once.
-- ---------------------------------------------------------------------------
insert into public.dashboards (id, owner_id, name) values
  ('b2b2b2b2-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'Existing');
-- It was created long before this transaction, so its revision is a backfill.
update public.dashboards set created_at = '2000-01-01'
 where id = 'b2b2b2b2-0000-4000-8000-000000000002';

-- Stage the "before" state: no revision, no composition.
select test_helpers.staged_backfill('public.dashboard_revisions',
  $f$ dashboard_id = 'b2b2b2b2-0000-4000-8000-000000000002' $f$, 'select 1');
do $$
declare removed bigint;
begin
  -- The composition backfill statement of composition_initialization.
  removed := test_helpers.staged_backfill('public.dashboard_compositions',
    $f$ dashboard_id = 'b2b2b2b2-0000-4000-8000-000000000002' $f$,
    $b$ insert into public.dashboard_compositions
          (dashboard_id, owner_id, composition, schema_version, revision)
        select d.id, d.owner_id,
               '{"settings":{"columns":3,"cardRadius":8,"showWidgetTitles":true},"widgets":[],"layouts":{"lg":[],"md":[],"sm":[]}}'::jsonb,
               1, 1
          from public.dashboards d
         where not exists (
           select 1 from public.dashboard_compositions c where c.dashboard_id = d.id) $b$);
  if removed <> 1 then raise exception 'the staged state must have had one composition'; end if;
end;
$$;

do $$
declare
  r record;
  n integer;
begin
  select count(*) into n from public.dashboard_compositions
   where dashboard_id = 'b2b2b2b2-0000-4000-8000-000000000002' and revision = 1;
  if n <> 1 then raise exception 'the backfill must create the composition at revision 1'; end if;

  select * into r from public.dashboard_revisions
   where dashboard_id = 'b2b2b2b2-0000-4000-8000-000000000002';
  if not found or r.source <> 'backfill' or r.sequence <> 1
     or r.created_by <> '11111111-1111-4111-8111-111111111111' then
    raise exception 'a backfilled composition must get one backfill revision authored by the owner';
  end if;
end;
$$;

-- Idempotent: running the same statement again changes nothing.
do $$
declare removed bigint; n integer;
begin
  removed := test_helpers.staged_backfill('public.dashboard_compositions', 'false',
    $b$ insert into public.dashboard_compositions
          (dashboard_id, owner_id, composition, schema_version, revision)
        select d.id, d.owner_id, '{}'::jsonb, 1, 1
          from public.dashboards d
         where not exists (
           select 1 from public.dashboard_compositions c where c.dashboard_id = d.id) $b$);
  select count(*) into n from public.dashboard_revisions
   where dashboard_id = 'b2b2b2b2-0000-4000-8000-000000000002';
  if removed <> 0 or n <> 1 then raise exception 'a backfill rerun must change nothing'; end if;
end;
$$;

-- The revision backfill of dashboard_revisions (compositions that exist but
-- have no revision) is idempotent too.
do $$
declare n integer; m integer;
begin
  perform test_helpers.staged_backfill('public.dashboard_revisions',
    $f$ dashboard_id = current_setting('test.created')::uuid $f$,
    $b$ insert into public.dashboard_revisions (
          dashboard_id, owner_id, sequence, source, schema_version, composition,
          name, description, icon, tags, content_bytes, content_hash, created_by)
        select c.dashboard_id, c.owner_id, 1, 'backfill', c.schema_version, c.composition,
               d.name, d.description, d.icon, d.tags, octet_length(c.composition::text),
               private.dashboard_state_hash(c.schema_version, c.composition, d.name,
                                            d.description, d.icon, d.tags), c.owner_id
          from public.dashboard_compositions c
          join public.dashboards d on d.id = c.dashboard_id
         where not exists (
           select 1 from public.dashboard_revisions r where r.dashboard_id = c.dashboard_id) $b$);
  select count(*) into n from public.dashboard_revisions
   where dashboard_id = current_setting('test.created')::uuid and source = 'backfill';
  if n <> 1 then raise exception 'the revision backfill must restore one backfill revision'; end if;
  m := test_helpers.staged_backfill('public.dashboard_revisions', 'false', 'select 1');
  select count(*) into n from public.dashboard_revisions
   where dashboard_id = current_setting('test.created')::uuid;
  if n <> 1 then raise exception 'rerunning the revision backfill must add nothing'; end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Immutability and access: revisions are read-only for clients and cannot
--    be edited by anyone.
-- ---------------------------------------------------------------------------
do $$
begin
  begin
    update public.dashboard_revisions set name = 'edited'
     where dashboard_id = current_setting('test.created')::uuid;
    raise exception 'even the administrator must not edit a revision';
  exception when sqlstate '23001' then null;
  end;
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);

do $$
declare n integer;
begin
  select count(*) into n from public.dashboard_revisions;
  if n <> 2 then raise exception 'the owner must see own revisions only (saw %)', n; end if;
  begin
    insert into public.dashboard_revisions (dashboard_id, owner_id, sequence, source, schema_version,
      composition, name, icon, tags, content_bytes, content_hash)
    values (current_setting('test.created')::uuid, '11111111-1111-4111-8111-111111111111', 99,
      'initial', 1, '{}', 'x', 'folder', '{}', 2, '\x00');
    raise exception 'a client must not insert a revision';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.dashboard_revisions set name = 'x';
    raise exception 'a client must not update a revision';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from public.dashboard_revisions;
    raise exception 'a client must not delete a revision';
  exception when insufficient_privilege then null;
  end;
end;
$$;

select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);
do $$
declare n integer;
begin
  select count(*) into n from public.dashboard_revisions;
  if n <> 0 then raise exception 'another owner must see no revisions (saw %)', n; end if;
end;
$$;
reset role;

set local role anon;
do $$
begin
  begin
    perform 1 from public.dashboard_revisions;
    raise exception 'anon must not read revisions';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;

-- ---------------------------------------------------------------------------
-- 4. The checkpoint policy. Default values first: a save within the gap takes
--    no revision.
-- ---------------------------------------------------------------------------
insert into public.dashboards (id, owner_id, name) values
  ('c3c3c3c3-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', 'Policy');

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
update public.dashboard_compositions set composition = '{"v":"A"}', revision = 2
 where dashboard_id = 'c3c3c3c3-0000-4000-8000-000000000003';
reset role;

do $$
declare n integer;
begin
  select count(*) into n from public.dashboard_revisions
   where dashboard_id = 'c3c3c3c3-0000-4000-8000-000000000003';
  if n <> 1 then
    raise exception 'a save within the gap must not create a revision (saw %)', n;
  end if;
end;
$$;

-- Gap = 0: the save freezes the stored head (the pre-image), not the new state.
select test_helpers.redefine_policy('dashboard_revision_policy',
  $p$ select interval '0', interval '30 minutes', 500 $p$);

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
update public.dashboard_compositions set composition = '{"v":"B"}', revision = 3
 where dashboard_id = 'c3c3c3c3-0000-4000-8000-000000000003';
reset role;

do $$
declare r record; n integer;
begin
  select count(*) into n from public.dashboard_revisions
   where dashboard_id = 'c3c3c3c3-0000-4000-8000-000000000003';
  if n <> 2 then raise exception 'a save after the gap must freeze the head (saw % revisions)', n; end if;
  select * into r from public.dashboard_revisions
   where dashboard_id = 'c3c3c3c3-0000-4000-8000-000000000003' and sequence = 2;
  if r.composition <> '{"v":"A"}'::jsonb or r.source <> 'checkpoint' then
    raise exception 'the checkpoint must hold the previous head ("A"), got % (%)', r.composition, r.source;
  end if;
  if r.created_by <> '11111111-1111-4111-8111-111111111111' then
    raise exception 'a checkpoint is authored by the saving user';
  end if;
end;
$$;

-- Dedupe: saving the same content again freezes B once; a further identical
-- save finds B already latest and adds nothing. The sequence has no gap.
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
update public.dashboard_compositions set composition = '{"v":"B"}', revision = 4
 where dashboard_id = 'c3c3c3c3-0000-4000-8000-000000000003';
update public.dashboard_compositions set composition = '{"v":"B"}', revision = 5
 where dashboard_id = 'c3c3c3c3-0000-4000-8000-000000000003';
reset role;

do $$
declare n integer; mx bigint;
begin
  select count(*), max(sequence) into n, mx from public.dashboard_revisions
   where dashboard_id = 'c3c3c3c3-0000-4000-8000-000000000003';
  if n <> 3 or mx <> 3 then
    raise exception 'an unchanged save must add no revision (saw % revisions, max sequence %)', n, mx;
  end if;
end;
$$;

-- Span: with a long gap but span = 0, a head that differs from the latest
-- revision is frozen; one that equals it is not.
select test_helpers.redefine_policy('dashboard_revision_policy',
  $p$ select interval '1 day', interval '0', 500 $p$);

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
update public.dashboard_compositions set composition = '{"v":"C"}', revision = 6
 where dashboard_id = 'c3c3c3c3-0000-4000-8000-000000000003';
reset role;

do $$
declare n integer;
begin
  -- The head was B and the latest revision is B: nothing to freeze.
  select count(*) into n from public.dashboard_revisions
   where dashboard_id = 'c3c3c3c3-0000-4000-8000-000000000003';
  if n <> 3 then raise exception 'span: a head equal to the latest revision must not be frozen (saw %)', n; end if;
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
update public.dashboard_compositions set composition = '{"v":"D"}', revision = 7
 where dashboard_id = 'c3c3c3c3-0000-4000-8000-000000000003';
reset role;

do $$
declare n integer; r record;
begin
  select count(*) into n from public.dashboard_revisions
   where dashboard_id = 'c3c3c3c3-0000-4000-8000-000000000003';
  select * into r from public.dashboard_revisions
   where dashboard_id = 'c3c3c3c3-0000-4000-8000-000000000003' and sequence = 4;
  if n <> 4 or r.composition <> '{"v":"C"}'::jsonb then
    raise exception 'span: a differing head must be frozen once past the span (saw %, %)', n, r.composition;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Full-state hash and metadata edits (V-3): rename, then save.
-- ---------------------------------------------------------------------------
select test_helpers.redefine_policy('dashboard_revision_policy',
  $p$ select interval '0', interval '30 minutes', 500 $p$);

insert into public.dashboards (id, owner_id, name) values
  ('d4d4d4d4-0000-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111', 'Alpha');

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);

reset role;

-- A rename right after creation: the head equals the initial revision, so
-- there is nothing to freeze. A second rename freezes the interim state.
insert into public.dashboards (id, owner_id, name) values
  ('a7a7a7a7-0000-4000-8000-000000000007', '11111111-1111-4111-8111-111111111111', 'One');
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
update public.dashboards set name = 'Two' where id = 'a7a7a7a7-0000-4000-8000-000000000007';
reset role;
do $$
declare n integer;
begin
  select count(*) into n from public.dashboard_revisions
   where dashboard_id = 'a7a7a7a7-0000-4000-8000-000000000007';
  if n <> 1 then raise exception 'a rename of an already captured head must not add a revision (saw %)', n; end if;
end;
$$;
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
update public.dashboards set name = 'Three' where id = 'a7a7a7a7-0000-4000-8000-000000000007';
reset role;
do $$
declare n integer; r record;
begin
  select count(*) into n from public.dashboard_revisions
   where dashboard_id = 'a7a7a7a7-0000-4000-8000-000000000007';
  select * into r from public.dashboard_revisions
   where dashboard_id = 'a7a7a7a7-0000-4000-8000-000000000007' and sequence = 2;
  if n <> 2 or r.name <> 'Two' then
    raise exception 'renaming twice must freeze the uncaptured interim state (saw %, %)', n, r.name;
  end if;
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
update public.dashboard_compositions set composition = '{"v":"A"}', revision = 2
 where dashboard_id = 'd4d4d4d4-0000-4000-8000-000000000004';
-- Head is now (A, Alpha): in no revision. Renaming freezes it, under the OLD name.
update public.dashboards set name = 'Beta' where id = 'd4d4d4d4-0000-4000-8000-000000000004';
reset role;

do $$
declare n integer; r record;
begin
  select count(*) into n from public.dashboard_revisions
   where dashboard_id = 'd4d4d4d4-0000-4000-8000-000000000004';
  select * into r from public.dashboard_revisions
   where dashboard_id = 'd4d4d4d4-0000-4000-8000-000000000004' and sequence = 2;
  if n <> 2 or r.name <> 'Alpha' or r.composition <> '{"v":"A"}'::jsonb then
    raise exception 'a rename must freeze the old head under the old name (saw % revisions, %, %)',
      n, r.name, r.composition;
  end if;
  if exists (select 1 from public.dashboard_revisions
              where dashboard_id = 'd4d4d4d4-0000-4000-8000-000000000004' and name = 'Beta') then
    raise exception 'a rename must never snapshot the new state';
  end if;
end;
$$;

-- Then a save: its pre-image is (A, Beta), which differs from every revision
-- (the stored (A, Alpha) carries the old name), so the rename is not lost.
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
update public.dashboard_compositions set composition = '{"v":"B"}', revision = 3
 where dashboard_id = 'd4d4d4d4-0000-4000-8000-000000000004';
reset role;

do $$
declare n integer; r record;
begin
  select * into r from public.dashboard_revisions
   where dashboard_id = 'd4d4d4d4-0000-4000-8000-000000000004' and sequence = 3;
  select count(*) into n from public.dashboard_revisions
   where dashboard_id = 'd4d4d4d4-0000-4000-8000-000000000004';
  if n <> 3 or r.name <> 'Beta' or r.composition <> '{"v":"A"}'::jsonb then
    raise exception 'rename then save must give revision 3 = (A, Beta) (saw %, %, %)', n, r.name, r.composition;
  end if;
end;
$$;

-- Icon, tag and description edits are metadata edits too; pin does not count.
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
update public.dashboards set icon = 'star' where id = 'd4d4d4d4-0000-4000-8000-000000000004';
update public.dashboards set tags = array['t'] where id = 'd4d4d4d4-0000-4000-8000-000000000004';
update public.dashboards set description = 'd' where id = 'd4d4d4d4-0000-4000-8000-000000000004';
reset role;
do $$
declare n integer;
begin
  select count(*) into n from public.dashboard_revisions
   where dashboard_id = 'd4d4d4d4-0000-4000-8000-000000000004';
  -- (B, Beta, folder...) was the uncaptured head; each later edit's old state
  -- is the previous edit's new state, which no revision holds yet.
  if n <> 6 then raise exception 'icon, tag and description edits each freeze the old head (saw %)', n; end if;
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
update public.dashboards set pinned_at = now() where id = 'd4d4d4d4-0000-4000-8000-000000000004';
update public.dashboards set pinned_at = null where id = 'd4d4d4d4-0000-4000-8000-000000000004';
reset role;
do $$
declare n integer;
begin
  select count(*) into n from public.dashboard_revisions
   where dashboard_id = 'd4d4d4d4-0000-4000-8000-000000000004';
  if n <> 6 then raise exception 'pinning must never create a revision (saw %)', n; end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. Retention: only the newest `cap` revisions are kept; the newest never goes.
-- ---------------------------------------------------------------------------
select test_helpers.redefine_policy('dashboard_revision_policy',
  $p$ select interval '0', interval '30 minutes', 3 $p$);

insert into public.dashboards (id, owner_id, name) values
  ('e5e5e5e5-0000-4000-8000-000000000005', '11111111-1111-4111-8111-111111111111', 'Pruned');

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
update public.dashboard_compositions set composition = '{"v":1}', revision = 2 where dashboard_id = 'e5e5e5e5-0000-4000-8000-000000000005';
update public.dashboard_compositions set composition = '{"v":2}', revision = 3 where dashboard_id = 'e5e5e5e5-0000-4000-8000-000000000005';
update public.dashboard_compositions set composition = '{"v":3}', revision = 4 where dashboard_id = 'e5e5e5e5-0000-4000-8000-000000000005';
update public.dashboard_compositions set composition = '{"v":4}', revision = 5 where dashboard_id = 'e5e5e5e5-0000-4000-8000-000000000005';
update public.dashboard_compositions set composition = '{"v":5}', revision = 6 where dashboard_id = 'e5e5e5e5-0000-4000-8000-000000000005';
reset role;

do $$
declare n integer; lo bigint; hi bigint; newest jsonb;
begin
  select count(*), min(sequence), max(sequence) into n, lo, hi from public.dashboard_revisions
   where dashboard_id = 'e5e5e5e5-0000-4000-8000-000000000005';
  select composition into newest from public.dashboard_revisions
   where dashboard_id = 'e5e5e5e5-0000-4000-8000-000000000005' and sequence = hi;
  -- The first save's pre-image equals the initial revision (deduped), so
  -- the four later saves leave sequences 1 to 5; the newest 3 are 3 to 5.
  if n <> 3 or hi <> 5 or lo <> 3 then
    raise exception 'with cap 3 the oldest are pruned (saw % revisions, sequences % to %)', n, lo, hi;
  end if;
  if newest <> '{"v":4}'::jsonb then
    raise exception 'the newest revision must be kept (got %)', newest;
  end if;
end;
$$;

-- A cap of 0 still keeps the newest revision.
select test_helpers.redefine_policy('dashboard_revision_policy',
  $p$ select interval '0', interval '30 minutes', 0 $p$);
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
update public.dashboard_compositions set composition = '{"v":6}', revision = 7 where dashboard_id = 'e5e5e5e5-0000-4000-8000-000000000005';
reset role;
do $$
declare n integer; hi bigint;
begin
  select count(*), max(sequence) into n, hi from public.dashboard_revisions
   where dashboard_id = 'e5e5e5e5-0000-4000-8000-000000000005';
  if n <> 1 or hi <> 6 then raise exception 'a cap of 0 must still keep the newest (saw %, %)', n, hi; end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. Atomicity: a write that fails, conflicts or matches nothing creates no
--    revision, even though the pre-image trigger runs before the checks.
-- ---------------------------------------------------------------------------
select test_helpers.redefine_policy('dashboard_revision_policy',
  $p$ select interval '0', interval '30 minutes', 500 $p$);

insert into public.dashboards (id, owner_id, name) values
  ('f6f6f6f6-0000-4000-8000-000000000006', '11111111-1111-4111-8111-111111111111', 'Atomic');
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
update public.dashboard_compositions set composition = '{"v":"A"}', revision = 2 where dashboard_id = 'f6f6f6f6-0000-4000-8000-000000000006';

do $$
begin
  -- Fails a CHECK after the pre-image was captured.
  begin
    update public.dashboard_compositions set schema_version = 2, revision = 3
     where dashboard_id = 'f6f6f6f6-0000-4000-8000-000000000006';
    raise exception 'schema_version 2 must fail';
  exception when check_violation then null;
  end;
  begin
    update public.dashboard_compositions set composition = '[]', revision = 3
     where dashboard_id = 'f6f6f6f6-0000-4000-8000-000000000006';
    raise exception 'a non-object composition must fail';
  exception when check_violation then null;
  end;
  -- The +1 rule refuses before capture.
  begin
    update public.dashboard_compositions set composition = '{"v":"X"}', revision = 9
     where dashboard_id = 'f6f6f6f6-0000-4000-8000-000000000006';
    raise exception 'a revision jump must fail';
  exception when sqlstate 'PT409' then null;
  end;
end;
$$;

-- A lost compare-and-swap race matches zero rows: no trigger, no revision.
update public.dashboard_compositions set composition = '{"v":"X"}', revision = 2
 where dashboard_id = 'f6f6f6f6-0000-4000-8000-000000000006' and revision = 1;
reset role;

do $$
declare n integer; c jsonb; rev bigint;
begin
  select count(*) into n from public.dashboard_revisions
   where dashboard_id = 'f6f6f6f6-0000-4000-8000-000000000006';
  select composition, revision into c, rev from public.dashboard_compositions
   where dashboard_id = 'f6f6f6f6-0000-4000-8000-000000000006';
  if n <> 1 then raise exception 'failed writes must create no revision (saw %)', n; end if;
  if c <> '{"v":"A"}'::jsonb or rev <> 2 then raise exception 'failed writes must leave the head untouched'; end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 8. Grants and function hygiene (INV-2): the capture functions are not
--    callable by clients, run with an empty search_path, and the trigger
--    functions that bypass row security are SECURITY DEFINER on purpose.
-- ---------------------------------------------------------------------------
do $$
declare f record;
begin
  for f in
    select p.oid, p.proname, p.prosecdef, p.proconfig
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'private'
       and p.proname in (
         'enforce_revision_increment', 'reject_revision_update',
         'dashboard_revision_policy', 'dashboard_state_hash',
         'capture_dashboard_revision', 'capture_initial_revision',
         'capture_checkpoint_revision', 'capture_metadata_preimage',
         'create_default_composition')
  loop
    if has_function_privilege('authenticated', f.oid, 'EXECUTE')
       or has_function_privilege('anon', f.oid, 'EXECUTE') then
      raise exception 'private.% must not be executable by clients', f.proname;
    end if;
    if f.proconfig is null or not (f.proconfig @> array['search_path=""']) then
      raise exception 'private.% must set an empty search_path', f.proname;
    end if;
    if f.proname in ('capture_dashboard_revision', 'capture_initial_revision',
                     'capture_checkpoint_revision', 'capture_metadata_preimage',
                     'create_default_composition') and not f.prosecdef then
      raise exception 'private.% must be SECURITY DEFINER', f.proname;
    end if;
    if f.proname in ('enforce_revision_increment', 'reject_revision_update',
                     'dashboard_revision_policy', 'dashboard_state_hash') and f.prosecdef then
      raise exception 'private.% must be SECURITY INVOKER', f.proname;
    end if;
  end loop;
  if has_table_privilege('authenticated', 'public.dashboard_revisions', 'INSERT')
     or has_table_privilege('authenticated', 'public.dashboard_revisions', 'UPDATE')
     or has_table_privilege('authenticated', 'public.dashboard_revisions', 'DELETE')
     or has_table_privilege('anon', 'public.dashboard_revisions', 'SELECT') then
    raise exception 'dashboard_revisions grants are wrong';
  end if;
  if not (select relrowsecurity from pg_class where oid = 'public.dashboard_revisions'::regclass) then
    raise exception 'row-level security must be on for dashboard_revisions';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 9. Cascades: no orphan compositions or revisions after a Dashboard or an
--    account is deleted.
-- ---------------------------------------------------------------------------
do $$
declare n integer;
begin
  delete from public.dashboards where id = 'f6f6f6f6-0000-4000-8000-000000000006';
  select count(*) into n from public.dashboard_revisions where dashboard_id = 'f6f6f6f6-0000-4000-8000-000000000006';
  if n <> 0 then raise exception 'deleting a Dashboard must delete its revisions'; end if;

  delete from auth.users where id = '11111111-1111-4111-8111-111111111111';
  select count(*) into n from public.dashboard_revisions where owner_id = '11111111-1111-4111-8111-111111111111';
  if n <> 0 then raise exception 'deleting an account must delete its revisions'; end if;
  select count(*) into n from public.dashboard_compositions where owner_id = '11111111-1111-4111-8111-111111111111';
  if n <> 0 then raise exception 'deleting an account must delete its compositions'; end if;
  select count(*) into n from public.dashboard_revisions r
   where not exists (select 1 from public.dashboards d where d.id = r.dashboard_id);
  if n <> 0 then raise exception 'no revision may be left without its Dashboard'; end if;
end;
$$;

rollback;
\echo dashboard-revisions: all checks passed
