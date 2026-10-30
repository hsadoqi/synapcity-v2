-- Behavioral regression checks for ADR-0016's dashboard compositions, as
-- amended by the persistence work (S1): a composition is created with its
-- Dashboard, clients cannot insert or delete one, `revision` rises by exactly 1,
-- and the size and version backstops hold.
-- Run through `pnpm db:test` on a disposable local database after applying the
-- migrations; it needs `supabase/tests/_helpers.sql`. All synthetic users and
-- records are rolled back. No pgTAP dependency.
\set ON_ERROR_STOP on

begin;

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'composition-test-a@example.test'),
  ('22222222-2222-4222-8222-222222222222', 'composition-test-b@example.test');

-- Inserting a Dashboard creates its composition and first revision (triggers).
insert into public.dashboards (id, owner_id, name) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111', 'Dash A'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '22222222-2222-4222-8222-222222222222', 'Dash B'),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', '22222222-2222-4222-8222-222222222222', 'Dash B2');

-- Every Dashboard has exactly one composition at revision 1, version 1, equal to
-- the default (`createComposition()`; a unit test compares the literal too).
do $$
declare
  n integer;
  r record;
begin
  select count(*) into n from public.dashboard_compositions;
  if n <> 3 then raise exception 'each Dashboard must have one composition (saw % for 3)', n; end if;

  select * into r from public.dashboard_compositions
   where dashboard_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  if r.revision <> 1 or r.schema_version is distinct from 1 or r.owner_id is distinct from '11111111-1111-4111-8111-111111111111' then
    raise exception 'a new composition must be revision 1, version 1, owned by the Dashboard owner';
  end if;
  if r.composition <>
     '{"settings":{"columns":3,"cardRadius":8,"showWidgetTitles":true},"widgets":[],"layouts":{"lg":[],"md":[],"sm":[]}}'::jsonb then
    raise exception 'the default composition must equal createComposition()';
  end if;
end;
$$;

-- Age A's composition so "updated_at moves" can be observed (`now()` is fixed
-- inside a transaction). Triggers are off for this one administrator write, so
-- the stamp trigger does not overwrite it.
set local session_replication_role = replica;
update public.dashboard_compositions set updated_at = '2000-01-01'
 where dashboard_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
set local session_replication_role = origin;

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);

do $$
declare
  r record;
  changed integer;
  before_update timestamptz;
  after_update timestamptz;
  padded text;
begin
  -- Reads: only the caller's own composition.
  select count(*) as n into r from public.dashboard_compositions;
  if r.n <> 1 then
    raise exception 'RLS must show only the caller''s own composition (saw % rows)', r.n;
  end if;

  -- Clients cannot insert: not for their own Dashboard, not for another's.
  begin
    insert into public.dashboard_compositions (dashboard_id, composition)
    values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '{}');
    raise exception 'a client insert for an existing composition must fail';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.dashboard_compositions (dashboard_id, composition)
    values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', '{}');
    raise exception 'a client insert for another owner''s Dashboard must fail';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.dashboard_compositions (dashboard_id, owner_id, composition)
    values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            '22222222-2222-4222-8222-222222222222', '{}');
    raise exception 'supplying owner_id on insert must fail';
  exception when insufficient_privilege then null;
  end;

  -- No client delete.
  begin
    delete from public.dashboard_compositions
     where dashboard_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    raise exception 'clients must not delete compositions';
  exception when insufficient_privilege then null;
  end;

  -- Conditional update: the expected revision writes and increments by 1, and
  -- updated_at moves forward.
  select updated_at into before_update from public.dashboard_compositions
   where dashboard_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  if before_update <> '2000-01-01'::timestamptz then
    raise exception 'the test could not age updated_at (got %)', before_update;
  end if;
  update public.dashboard_compositions
     set composition = '{"widgets": [1]}', revision = 2
   where dashboard_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' and revision = 1;
  get diagnostics changed = row_count;
  if changed <> 1 then raise exception 'update at the expected revision must write one row'; end if;
  select updated_at into after_update from public.dashboard_compositions
   where dashboard_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  if after_update <= before_update then
    raise exception 'updated_at must move forward on update (% -> %)', before_update, after_update;
  end if;

  -- A stale expected revision matches no row, so nothing is written.
  update public.dashboard_compositions
     set composition = '{"widgets": [2]}', revision = 2
   where dashboard_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' and revision = 1;
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'a stale revision must update zero rows'; end if;

  -- A direct caller cannot jump, rewind, repeat or omit the revision: the
  -- database raises the conflict code (PT409), whatever the WHERE clause says.
  begin
    update public.dashboard_compositions set composition = '{"a":1}', revision = 99
     where dashboard_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    raise exception 'a revision jump must fail';
  exception when sqlstate 'PT409' then null;
  end;
  begin
    update public.dashboard_compositions set composition = '{"a":1}', revision = 1
     where dashboard_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    raise exception 'a revision rewind must fail';
  exception when sqlstate 'PT409' then null;
  end;
  begin
    update public.dashboard_compositions set composition = '{"a":1}', revision = 2
     where dashboard_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    raise exception 'repeating the stored revision must fail';
  exception when sqlstate 'PT409' then null;
  end;
  begin
    update public.dashboard_compositions set composition = '{"a":1}'
     where dashboard_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    raise exception 'an update that does not raise the revision must fail';
  exception when sqlstate 'PT409' then null;
  end;
  begin
    update public.dashboard_compositions set composition = '{"a":1}', revision = 0
     where dashboard_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    raise exception 'revision 0 must fail';
  exception when sqlstate 'PT409' then null;
  end;

  -- Another owner's composition cannot be updated (the select policy hides it,
  -- so the update sees zero rows; the update policy is a second line behind it).
  update public.dashboard_compositions
     set composition = '{"stolen": true}', revision = 2
   where dashboard_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'another owner''s composition must not be updatable'; end if;

  -- Ownership, the Dashboard link and the stamp are not client-writable.
  begin
    update public.dashboard_compositions set owner_id = '22222222-2222-4222-8222-222222222222'
     where dashboard_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    raise exception 'changing owner_id must fail';
  exception when insufficient_privilege then
    -- The column grant refuses it before any policy is asked.
    if sqlerrm not like 'permission denied%' then
      raise exception 'owner_id must be refused by the column grant, got: %', sqlerrm;
    end if;
  end;
  begin
    update public.dashboard_compositions set updated_at = '2000-01-01'
     where dashboard_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    raise exception 'changing updated_at must fail';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.dashboard_compositions set dashboard_id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
     where dashboard_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    raise exception 'changing dashboard_id must fail';
  exception when insufficient_privilege then null;
  end;

  -- The object check, the version check and the size backstop (all at the
  -- correct next revision, so the +1 rule is not what refuses them).
  begin
    update public.dashboard_compositions set composition = '[]', revision = 3
     where dashboard_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    raise exception 'a non-object composition must fail';
  exception when check_violation then null;
  end;
  begin
    update public.dashboard_compositions set schema_version = 2, revision = 3
     where dashboard_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    raise exception 'schema_version 2 must be refused';
  exception when check_violation then null;
  end;
  begin
    update public.dashboard_compositions set schema_version = 0, revision = 3
     where dashboard_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    raise exception 'schema_version 0 must be refused';
  exception when check_violation then null;
  end;

  -- `jsonb::text` of {"p": "<n a's>"} is 9 bytes of framing plus n.
  padded := jsonb_build_object('p', repeat('a', 131063))::text;
  if octet_length(padded) <> 131072 then
    raise exception 'test setup: expected 131072 bytes, got %', octet_length(padded);
  end if;
  update public.dashboard_compositions
     set composition = padded::jsonb, revision = 3
   where dashboard_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  get diagnostics changed = row_count;
  if changed <> 1 then raise exception '131072 bytes must be accepted'; end if;

  begin
    update public.dashboard_compositions
       set composition = jsonb_build_object('p', repeat('a', 131064)), revision = 4
     where dashboard_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    raise exception '131073 bytes must be refused';
  exception when check_violation then null;
  end;

  -- The limit counts bytes, not characters: 65530 two-byte characters and 3
  -- ASCII ones are exactly 131072 bytes; one more two-byte character is over.
  padded := jsonb_build_object('p', repeat('é', 65530) || 'aaa')::text;
  if octet_length(padded) <> 131072 or char_length(padded) >= 131072 then
    raise exception 'test setup: multibyte boundary is wrong (% bytes)', octet_length(padded);
  end if;
  update public.dashboard_compositions
     set composition = padded::jsonb, revision = 4
   where dashboard_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  get diagnostics changed = row_count;
  if changed <> 1 then raise exception 'a multibyte document of 131072 bytes must be accepted'; end if;
  begin
    update public.dashboard_compositions
       set composition = jsonb_build_object('p', repeat('é', 65531) || 'aaa'), revision = 5
     where dashboard_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    raise exception 'a multibyte document over 131072 bytes must be refused';
  exception when check_violation then null;
  end;

  -- A compressible 200 KB payload was accepted by the old pg_column_size check
  -- because TOAST compressed it; the text-size backstop refuses it.
  begin
    update public.dashboard_compositions
       set composition = jsonb_build_object('p', repeat('abcdefgh', 25000)), revision = 5
     where dashboard_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    raise exception 'a compressible 200 KB document must be refused';
  exception when check_violation then null;
  end;
end;
$$;

-- Anonymous callers see and write nothing.
reset role;
set local role anon;
do $$
begin
  begin
    perform 1 from public.dashboard_compositions;
    raise exception 'anon must not read compositions';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;

-- The grants themselves, not only their effect.
do $$
begin
  if has_table_privilege('authenticated', 'public.dashboard_compositions', 'INSERT')
     or has_table_privilege('authenticated', 'public.dashboard_compositions', 'DELETE') then
    raise exception 'authenticated must hold no INSERT or DELETE on compositions';
  end if;
  if has_column_privilege('authenticated', 'public.dashboard_compositions', 'composition', 'INSERT') then
    raise exception 'authenticated must hold no column INSERT on compositions';
  end if;
  if not has_column_privilege('authenticated', 'public.dashboard_compositions', 'revision', 'UPDATE') then
    raise exception 'authenticated must still update revision';
  end if;
  if exists (
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'dashboard_compositions' and cmd = 'INSERT'
  ) then
    raise exception 'no INSERT policy may remain on compositions';
  end if;
  if has_function_privilege('authenticated', 'private.enforce_revision_increment()', 'EXECUTE') then
    raise exception 'authenticated must not execute the revision trigger function';
  end if;
end;
$$;

-- Deleting a Dashboard deletes its composition; deleting an account deletes both.
do $$
declare n integer;
begin
  delete from public.dashboards where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  select count(*) into n from public.dashboard_compositions
   where dashboard_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  if n <> 0 then raise exception 'deleting a Dashboard must delete its composition'; end if;

  delete from auth.users where id = '22222222-2222-4222-8222-222222222222';
  select count(*) into n from public.dashboard_compositions
   where owner_id = '22222222-2222-4222-8222-222222222222';
  if n <> 0 then raise exception 'deleting an account must delete its compositions'; end if;
end;
$$;

rollback;
\echo dashboard-compositions: all checks passed
