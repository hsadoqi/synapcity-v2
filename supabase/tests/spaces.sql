-- Behavioral regression checks for ADR-0012 (as amended by ADR-0013). Run only on a disposable local
-- database after applying the migrations, as the database administrator:
-- psql -X -v ON_ERROR_STOP=1 -f supabase/tests/spaces.sql <local-connection>
-- All synthetic users and records below are rolled back. No pgTAP dependency.
\set ON_ERROR_STOP on

begin;

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'spaces-test-a@example.test'),
  ('22222222-2222-4222-8222-222222222222', 'spaces-test-b@example.test');

insert into public.spaces (id, owner_id, name, created_at, updated_at) values
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
  record public.spaces%rowtype;
  changed integer;
  column_name text;
begin
  if (select count(*) from public.spaces) <> 1 then
    raise exception 'RLS must expose only the current owner''s records';
  end if;

  insert into public.spaces (name) values ('Created by A') returning * into record;
  if record.owner_id <> auth.uid() or record.id is null
     or record.icon <> 'folder' or record.tags <> '{}'::text[]
     or record.created_at is null or record.updated_at <> record.created_at then
    raise exception 'Creation defaults must supply identity, owner, icon, tags and timestamps';
  end if;

  update public.spaces
  set name = 'Edited by A', description = 'Owned content',
      icon = 'book-open', tags = array['reading', 'notes']
  where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  returning * into record;
  get diagnostics changed = row_count;
  if changed <> 1 or record.name <> 'Edited by A' or record.icon <> 'book-open'
     or record.tags <> array['reading', 'notes']
     or record.created_at <> '2020-01-01T00:00:00Z'::timestamptz
     or record.updated_at <= '2020-01-01T00:00:00Z'::timestamptz then
    raise exception 'Owner updates must work and refresh only updated_at';
  end if;

  update public.spaces set name = 'Cross-owner write'
  where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  get diagnostics changed = row_count;
  if changed <> 0 then
    raise exception 'RLS must prevent updates to another owner''s records';
  end if;

  foreach column_name in array array['id', 'owner_id', 'created_at', 'updated_at'] loop
    if has_column_privilege('public.spaces', column_name, 'INSERT')
       or has_column_privilege('public.spaces', column_name, 'UPDATE') then
      raise exception 'Server-managed column % must not be client-writable', column_name;
    end if;
  end loop;

  begin
    insert into public.spaces (owner_id, name)
    values ('22222222-2222-4222-8222-222222222222', 'Forged owner');
    raise exception 'An explicit forged owner must be refused';
  exception when insufficient_privilege then null;
  end;

  begin
    update public.spaces set owner_id = '22222222-2222-4222-8222-222222222222'
    where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    raise exception 'Ownership transfer must be refused';
  exception when insufficient_privilege then null;
  end;

  -- ADR-0013 allows owners to delete their own Spaces; see
  -- space-participation.sql for the owner delete and its effect on content.
  delete from public.spaces where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  get diagnostics changed = row_count;
  if changed <> 0 then
    raise exception 'RLS must prevent deleting another owner''s Space';
  end if;

  begin
    insert into public.spaces (name) values (E' \t\n');
    raise exception 'A blank name must be refused';
  exception when check_violation then null;
  end;

  begin
    insert into public.spaces (name, icon) values ('Bad icon', '<svg />');
    raise exception 'SVG markup must not be accepted as an icon identifier';
  exception when check_violation then null;
  end;

  begin
    insert into public.spaces (name, tags) values ('Null tag', array['valid', null]);
    raise exception 'Null tag elements must be refused';
  exception when check_violation then null;
  end;

  begin
    insert into public.spaces (name, tags) values ('Null tags', null);
    raise exception 'A null tags array must be refused';
  exception when not_null_violation then null;
  end;

  begin
    insert into public.spaces (name, tags) values ('Nested tags', array[['nested']]);
    raise exception 'Nested tag arrays must be refused';
  exception when check_violation or feature_not_supported then null;
  end;
end;
$$;

-- A second authenticated user can read their own row, but cannot see A's rows.
select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);
do $$
begin
  if (select count(*) from public.spaces) <> 1
     or (select name from public.spaces) <> 'Owner B' then
    raise exception 'Owner B must see only the untouched Owner B row';
  end if;
end;
$$;

-- An authenticated role without an identity still has no row access.
select set_config('request.jwt.claim.sub', '', true);
do $$
begin
  if exists (select 1 from public.spaces) then
    raise exception 'A missing identity must expose no rows';
  end if;
  begin
    insert into public.spaces (name) values ('Missing identity');
    raise exception 'A missing identity must not be allowed to insert';
  exception when insufficient_privilege or not_null_violation then null;
  end;
end;
$$;

reset role;
set local role anon;
do $$
begin
  begin
    perform 1 from public.spaces;
    raise exception 'Anonymous reads must be refused';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.spaces (name) values ('Anonymous insert');
    raise exception 'Anonymous writes must be refused';
  exception when insufficient_privilege then null;
  end;
end;
$$;

reset role;
delete from auth.users where id = '11111111-1111-4111-8111-111111111111';
do $$
begin
  if exists (select 1 from public.spaces where owner_id = '11111111-1111-4111-8111-111111111111')
     or (select count(*) from public.spaces) <> 1
     or not exists (select 1 from public.spaces where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb') then
    raise exception 'Account deletion must remove only its owned Spaces';
  end if;
end;
$$;

rollback;
\echo 'Spaces SQL behavior checks passed (all synthetic data rolled back).'
