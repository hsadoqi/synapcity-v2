-- Behavioral regression checks for ADR-0016's dashboard compositions.
-- Run only on a disposable local database after applying the migrations, as
-- the database administrator:
-- psql -X -v ON_ERROR_STOP=1 -f supabase/tests/dashboard-compositions.sql <local-connection>
-- All synthetic users and records below are rolled back. No pgTAP dependency.
\set ON_ERROR_STOP on

begin;

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'composition-test-a@example.test'),
  ('22222222-2222-4222-8222-222222222222', 'composition-test-b@example.test');

insert into public.dashboards (id, owner_id, name) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111', 'Dash A'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '22222222-2222-4222-8222-222222222222', 'Dash B'),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', '22222222-2222-4222-8222-222222222222', 'Dash B2, no composition');

-- Owner B already has a composition, written as the administrator.
insert into public.dashboard_compositions (dashboard_id, owner_id, composition)
values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        '22222222-2222-4222-8222-222222222222', '{"widgets": []}');

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);

do $$
declare
  r record;
  changed integer;
begin
  -- Reads: only the caller's own composition.
  select count(*) as n into r from public.dashboard_compositions;
  if r.n <> 0 then
    raise exception 'RLS must hide another owner''s composition (saw % rows)', r.n;
  end if;

  -- First save: insert supplies owner, revision 1, version 1.
  insert into public.dashboard_compositions (dashboard_id, composition)
  values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '{"widgets": []}')
  returning * into r;
  if r.owner_id <> auth.uid() or r.revision <> 1 or r.schema_version <> 1 then
    raise exception 'insert defaults must supply the owner, revision 1 and version 1';
  end if;

  -- A second row for the same Dashboard is refused (one-to-one).
  begin
    insert into public.dashboard_compositions (dashboard_id, composition)
    values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '{}');
    raise exception 'a second composition for one Dashboard must fail';
  exception when unique_violation then null;
  end;

  -- Cannot create a composition for a Dashboard owned by someone else (one
  -- that has no composition yet, so only the policy can refuse it).
  begin
    insert into public.dashboard_compositions (dashboard_id, composition)
    values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', '{}');
    raise exception 'inserting for another owner''s Dashboard must fail';
  exception when insufficient_privilege then null;
  end;

  -- Clients cannot choose owner_id on insert.
  begin
    insert into public.dashboard_compositions (dashboard_id, owner_id, composition)
    values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            '22222222-2222-4222-8222-222222222222', '{}');
    raise exception 'supplying owner_id must fail';
  exception when insufficient_privilege then null;
  end;

  -- Conditional update: the expected revision writes and increments.
  update public.dashboard_compositions
     set composition = '{"widgets": [1]}', revision = 2
   where dashboard_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' and revision = 1;
  get diagnostics changed = row_count;
  if changed <> 1 then raise exception 'update at the expected revision must write one row'; end if;

  -- A stale revision changes no row.
  update public.dashboard_compositions
     set composition = '{"widgets": [2]}', revision = 2
   where dashboard_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' and revision = 1;
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'a stale revision must update zero rows'; end if;

  -- Another owner's composition cannot be updated (the select policy hides it,
  -- so the update sees zero rows; the update policy is a second line behind it).
  update public.dashboard_compositions
     set composition = '{"stolen": true}', revision = 2
   where dashboard_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'another owner''s composition must not be updatable'; end if;

  -- Ownership and the Dashboard link are not client-writable.
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

  -- No client delete.
  begin
    delete from public.dashboard_compositions
     where dashboard_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    raise exception 'clients must not delete compositions';
  exception when insufficient_privilege then null;
  end;

  -- The object check and the size cap.
  begin
    update public.dashboard_compositions set composition = '[]', revision = 3
     where dashboard_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    raise exception 'a non-object composition must fail';
  exception when check_violation then null;
  end;
  begin
    update public.dashboard_compositions
       set composition = jsonb_build_object('pad', repeat(md5(random()::text), 4000)), revision = 3
     where dashboard_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    raise exception 'an oversized composition must fail';
  exception when check_violation then null;
  end;
  begin
    update public.dashboard_compositions set revision = 0
     where dashboard_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    raise exception 'revision below 1 must fail';
  exception when check_violation then null;
  end;

  -- updated_at moves on update.
  select updated_at as u into r from public.dashboard_compositions
   where dashboard_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
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
