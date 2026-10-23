-- Behavioral regression checks for ADR-0013's Document and Dashboard records.
-- Run only on a disposable local database after applying the migrations, as
-- the database administrator:
-- psql -X -v ON_ERROR_STOP=1 -f supabase/tests/documents-and-dashboards.sql <local-connection>
-- Both tables share one contract, so every check runs once per table.
-- All synthetic users and records below are rolled back. No pgTAP dependency.
\set ON_ERROR_STOP on

begin;

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'content-test-a@example.test'),
  ('22222222-2222-4222-8222-222222222222', 'content-test-b@example.test');

insert into public.documents (id, owner_id, name, created_at, updated_at) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   '11111111-1111-4111-8111-111111111111', 'Owner A',
   '2020-01-01T00:00:00Z', '2020-01-01T00:00:00Z'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
   '22222222-2222-4222-8222-222222222222', 'Owner B',
   '2020-01-01T00:00:00Z', '2020-01-01T00:00:00Z');
insert into public.dashboards (id, owner_id, name, created_at, updated_at) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   '11111111-1111-4111-8111-111111111111', 'Owner A',
   '2020-01-01T00:00:00Z', '2020-01-01T00:00:00Z'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
   '22222222-2222-4222-8222-222222222222', 'Owner B',
   '2020-01-01T00:00:00Z', '2020-01-01T00:00:00Z');

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);

do $$
declare
  t text;
  default_icon text;
  r record;
  changed integer;
  column_name text;
begin
  foreach t in array array['documents', 'dashboards'] loop
    default_icon := case t when 'documents' then 'file-text' else 'layout-dashboard' end;

    execute format('select count(*) as n from public.%I', t) into r;
    if r.n <> 1 then
      raise exception '%: RLS must expose only the current owner''s records', t;
    end if;

    execute format('insert into public.%I (name) values (%L) returning *', t, 'Created by A') into r;
    if r.owner_id <> auth.uid() or r.id is null
       or r.icon <> default_icon or r.tags <> '{}'::text[] or r.description is not null
       or r.created_at is null or r.updated_at <> r.created_at then
      raise exception '%: creation defaults must supply identity, owner, icon, tags and timestamps', t;
    end if;

    execute format(
      'update public.%I set name = %L, description = %L, icon = %L, tags = %L
       where id = %L returning *',
      t, 'Edited by A', 'Owned content', 'book-open', array['reading', 'notes'],
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') into r;
    get diagnostics changed = row_count;
    if changed <> 1 or r.name <> 'Edited by A' or r.icon <> 'book-open'
       or r.tags <> array['reading', 'notes']
       or r.created_at <> '2020-01-01T00:00:00Z'::timestamptz
       or r.updated_at <= '2020-01-01T00:00:00Z'::timestamptz then
      raise exception '%: owner updates must work and refresh only updated_at', t;
    end if;

    execute format('update public.%I set name = %L where id = %L',
      t, 'Cross-owner write', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
    get diagnostics changed = row_count;
    if changed <> 0 then
      raise exception '%: RLS must prevent updates to another owner''s records', t;
    end if;

    execute format('delete from public.%I where id = %L',
      t, 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
    get diagnostics changed = row_count;
    if changed <> 0 then
      raise exception '%: RLS must prevent deleting another owner''s records', t;
    end if;

    foreach column_name in array array['id', 'owner_id', 'created_at', 'updated_at'] loop
      if has_column_privilege(format('public.%I', t), column_name, 'INSERT')
         or has_column_privilege(format('public.%I', t), column_name, 'UPDATE') then
        raise exception '%: server-managed column % must not be client-writable', t, column_name;
      end if;
    end loop;

    begin
      execute format('insert into public.%I (owner_id, name) values (%L, %L)',
        t, '22222222-2222-4222-8222-222222222222', 'Forged owner');
      raise exception '%: an explicit forged owner must be refused', t;
    exception when insufficient_privilege then null;
    end;

    begin
      execute format('update public.%I set owner_id = %L where id = %L',
        t, '22222222-2222-4222-8222-222222222222', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
      raise exception '%: ownership transfer must be refused', t;
    exception when insufficient_privilege then null;
    end;

    begin
      execute format('insert into public.%I (name) values (%L)', t, E' \t\n');
      raise exception '%: a blank name must be refused', t;
    exception when check_violation then null;
    end;

    begin
      execute format('insert into public.%I (name, icon) values (%L, %L)', t, 'Bad icon', '<svg />');
      raise exception '%: SVG markup must not be accepted as an icon identifier', t;
    exception when check_violation then null;
    end;

    begin
      execute format('insert into public.%I (name, tags) values (%L, array[%L, null])', t, 'Null tag', 'valid');
      raise exception '%: null tag elements must be refused', t;
    exception when check_violation then null;
    end;

    begin
      execute format('insert into public.%I (name, tags) values (%L, null)', t, 'Null tags');
      raise exception '%: a null tags array must be refused', t;
    exception when not_null_violation then null;
    end;

    begin
      execute format('insert into public.%I (name, tags) values (%L, array[[%L]])', t, 'Nested tags', 'nested');
      raise exception '%: nested tag arrays must be refused', t;
    exception when check_violation or feature_not_supported then null;
    end;

    execute format('delete from public.%I where name = %L', t, 'Created by A');
    get diagnostics changed = row_count;
    if changed <> 1 then
      raise exception '%: owners must be able to delete their own records', t;
    end if;
  end loop;
end;
$$;

-- An authenticated role without an identity still has no row access.
select set_config('request.jwt.claim.sub', '', true);
do $$
declare
  t text;
  n integer;
begin
  foreach t in array array['documents', 'dashboards'] loop
    execute format('select count(*) from public.%I', t) into n;
    if n <> 0 then
      raise exception '%: a missing identity must expose no rows', t;
    end if;
    begin
      execute format('insert into public.%I (name) values (%L)', t, 'Missing identity');
      raise exception '%: a missing identity must not be allowed to insert', t;
    exception when insufficient_privilege or not_null_violation then null;
    end;
  end loop;
end;
$$;

reset role;
set local role anon;
do $$
declare
  t text;
begin
  foreach t in array array['documents', 'dashboards'] loop
    begin
      execute format('select 1 from public.%I', t);
      raise exception '%: anonymous reads must be refused', t;
    exception when insufficient_privilege then null;
    end;
    begin
      execute format('insert into public.%I (name) values (%L)', t, 'Anonymous insert');
      raise exception '%: anonymous writes must be refused', t;
    exception when insufficient_privilege then null;
    end;
  end loop;
end;
$$;

reset role;
delete from auth.users where id = '11111111-1111-4111-8111-111111111111';
do $$
begin
  if exists (select 1 from public.documents where owner_id = '11111111-1111-4111-8111-111111111111')
     or exists (select 1 from public.dashboards where owner_id = '11111111-1111-4111-8111-111111111111')
     or (select count(*) from public.documents) <> 1
     or (select count(*) from public.dashboards) <> 1 then
    raise exception 'Account deletion must remove only its owned documents and dashboards';
  end if;
end;
$$;

rollback;
\echo 'Document and dashboard SQL behavior checks passed (all synthetic data rolled back).'
