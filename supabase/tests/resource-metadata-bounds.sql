-- Resource metadata bounds (S2, owner decision D5) on spaces, documents and
-- dashboards, plus the participation `position` check: every limit at and one
-- over, the tag rules, NOT VALID versus VALIDATE, and the tag function's
-- grants. The same boundary values are exercised through the Data API by the
-- shared-vector test in @synapcity/server-data (test:db), which also runs them
-- through the zod schemas' own test. Run through `pnpm db:test`. Rolled back.
\set ON_ERROR_STOP on

begin;

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'bounds-a@example.test');

-- Inserting each kind either succeeds or raises check_violation.
create function pg_temp.try_insert(
  t text, p_name text, p_description text, p_icon text, p_tags text[]
) returns boolean language plpgsql as $$
begin
  execute format(
    'insert into public.%I (owner_id, name, description, icon, tags) values ($1::uuid, $2, $3, coalesce($4, ''folder''), coalesce($5, ''{}''))',
    t
  ) using '11111111-1111-4111-8111-111111111111', p_name, p_description, p_icon, p_tags;
  return true;
exception when check_violation then
  return false;
end;
$$;

do $$
declare
  t text;
  many text[];
begin
  foreach t in array array['spaces', 'documents', 'dashboards'] loop
    -- name: 120 characters in, 121 out; counted in code points, not bytes or UTF-16 units
    if not pg_temp.try_insert(t, repeat('a', 120), null, null, null) then raise exception '% name 120 must pass', t; end if;
    if pg_temp.try_insert(t, repeat('a', 121), null, null, null) then raise exception '% name 121 must fail', t; end if;
    if not pg_temp.try_insert(t, repeat('😀', 120), null, null, null) then raise exception '% 120 emoji (480 bytes) must pass', t; end if;
    if pg_temp.try_insert(t, repeat('😀', 121), null, null, null) then raise exception '% 121 emoji must fail', t; end if;
    if not pg_temp.try_insert(t, repeat('é', 120), null, null, null) then raise exception '% 120 accented must pass', t; end if;

    -- description: 2000 in, 2001 out, absent in
    if not pg_temp.try_insert(t, 'n', repeat('d', 2000), null, null) then raise exception '% description 2000 must pass', t; end if;
    if pg_temp.try_insert(t, 'n', repeat('d', 2001), null, null) then raise exception '% description 2001 must fail', t; end if;
    if not pg_temp.try_insert(t, 'n', null, null, null) then raise exception '% null description must pass', t; end if;
    if not pg_temp.try_insert(t, 'n', repeat('😀', 2000), null, null) then raise exception '% 2000 emoji description must pass', t; end if;
    if pg_temp.try_insert(t, 'n', repeat('😀', 2001), null, null) then raise exception '% 2001 emoji description must fail', t; end if;

    -- icon: 64 in, 65 out (the existing pattern still applies)
    if not pg_temp.try_insert(t, 'n', null, repeat('a', 64), null) then raise exception '% icon 64 must pass', t; end if;
    if pg_temp.try_insert(t, 'n', null, repeat('a', 65), null) then raise exception '% icon 65 must fail', t; end if;
    if pg_temp.try_insert(t, 'n', null, 'Not-An-Icon', null) then raise exception '% icon shape must still be checked', t; end if;

    -- tags: 20 in, 21 out
    select array_agg('t' || g) into many from generate_series(1, 20) g;
    if not pg_temp.try_insert(t, 'n', null, null, many) then raise exception '% 20 tags must pass', t; end if;
    select array_agg('t' || g) into many from generate_series(1, 21) g;
    if pg_temp.try_insert(t, 'n', null, null, many) then raise exception '% 21 tags must fail', t; end if;

    -- each tag: 1 to 50 characters, trimmed
    if not pg_temp.try_insert(t, 'n', null, null, array[repeat('a', 50)]) then raise exception '% tag of 50 must pass', t; end if;
    if pg_temp.try_insert(t, 'n', null, null, array[repeat('a', 51)]) then raise exception '% tag of 51 must fail', t; end if;
    if not pg_temp.try_insert(t, 'n', null, null, array[repeat('😀', 50)]) then raise exception '% tag of 50 emoji must pass', t; end if;
    if pg_temp.try_insert(t, 'n', null, null, array[repeat('😀', 51)]) then raise exception '% tag of 51 emoji must fail', t; end if;
    if pg_temp.try_insert(t, 'n', null, null, array['']) then raise exception '% empty tag must fail', t; end if;
    if pg_temp.try_insert(t, 'n', null, null, array[' padded']) then raise exception '% leading space must fail', t; end if;
    if pg_temp.try_insert(t, 'n', null, null, array['padded ']) then raise exception '% trailing space must fail', t; end if;
    if pg_temp.try_insert(t, 'n', null, null, array['   ']) then raise exception '% blank tag must fail', t; end if;
    if not pg_temp.try_insert(t, 'n', null, null, array['two words']) then raise exception '% inner space must pass', t; end if;

    -- no two tags equal ignoring case
    if pg_temp.try_insert(t, 'n', null, null, array['Work', 'work']) then raise exception '% case-insensitive duplicate must fail', t; end if;
    if pg_temp.try_insert(t, 'n', null, null, array['a', 'a']) then raise exception '% exact duplicate must fail', t; end if;
    if not pg_temp.try_insert(t, 'n', null, null, array['a', 'b']) then raise exception '% distinct tags must pass', t; end if;
    if not pg_temp.try_insert(t, 'n', null, null, '{}') then raise exception '% no tags must pass', t; end if;
  end loop;
end;
$$;

-- position: null or non-negative on both participation tables.
insert into public.spaces (id, owner_id, name) values
  ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'S');
insert into public.documents (id, owner_id, name) values
  ('dddddddd-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'D');
insert into public.dashboards (id, owner_id, name) values
  ('bbbbbbbb-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'B');

do $$
declare p integer;
begin
  foreach p in array array[null, 0, 1, 2147483647] loop
    delete from public.space_documents;
    delete from public.space_dashboards;
    insert into public.space_documents (space_id, document_id, owner_id, position)
    values ('aaaaaaaa-0000-4000-8000-000000000001', 'dddddddd-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', p);
    insert into public.space_dashboards (space_id, dashboard_id, owner_id, position)
    values ('aaaaaaaa-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', p);
  end loop;
  begin
    update public.space_documents set position = -1;
    raise exception 'a negative document position must fail';
  exception when check_violation then null;
  end;
  begin
    update public.space_dashboards set position = -1;
    raise exception 'a negative dashboard position must fail';
  exception when check_violation then null;
  end;
end;
$$;

-- NOT VALID versus VALIDATE: a row that already violates a new constraint is
-- accepted when the constraint is added NOT VALID, new writes are refused, and
-- VALIDATE fails until the row is fixed. (Rebuilt here from scratch, because
-- the migrations already validated the real constraints.)
do $$
declare n integer;
begin
  alter table public.documents drop constraint documents_name_length;
  insert into public.documents (id, owner_id, name)
  values ('eeeeeeee-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', repeat('x', 200));

  alter table public.documents
    add constraint documents_name_length check (char_length(name) <= 120) not valid;
  if (select convalidated from pg_constraint where conname = 'documents_name_length') then
    raise exception 'a NOT VALID constraint must report convalidated = false';
  end if;

  -- The old row survived; a new violating write does not.
  select count(*) into n from public.documents where id = 'eeeeeeee-0000-4000-8000-000000000001';
  if n <> 1 then raise exception 'the existing violating row must remain'; end if;
  begin
    insert into public.documents (owner_id, name) values ('11111111-1111-4111-8111-111111111111', repeat('x', 121));
    raise exception 'a new violating insert must fail under NOT VALID';
  exception when check_violation then null;
  end;
  -- An update of the old row must bring it inside the limit.
  begin
    update public.documents set name = repeat('y', 150) where id = 'eeeeeeee-0000-4000-8000-000000000001';
    raise exception 'an update to another violating value must fail';
  exception when check_violation then null;
  end;

  -- VALIDATE refuses while a violator exists, and nothing is truncated.
  begin
    alter table public.documents validate constraint documents_name_length;
    raise exception 'VALIDATE must fail while a violating row exists';
  exception when check_violation then null;
  end;
  select count(*) into n from public.documents
   where id = 'eeeeeeee-0000-4000-8000-000000000001' and char_length(name) = 200;
  if n <> 1 then raise exception 'nothing may be truncated by the constraint or VALIDATE'; end if;

  update public.documents set name = 'fixed' where id = 'eeeeeeee-0000-4000-8000-000000000001';
  alter table public.documents validate constraint documents_name_length;
  if not (select convalidated from pg_constraint where conname = 'documents_name_length') then
    raise exception 'VALIDATE must succeed once the row is fixed';
  end if;
end;
$$;

-- The migrations leave every constraint validated.
do $$
declare n integer;
begin
  select count(*) into n from pg_constraint
   where (conname ~ '^(spaces|documents|dashboards)_(name_length|description_length|icon_length|tags_valid)$'
          or conname ~ '^space_(documents|dashboards)_position_nonnegative$')
     and not convalidated
     and conname <> 'documents_name_length';
  if n <> 0 then raise exception '% metadata constraints are still NOT VALID', n; end if;
end;
$$;

-- The tag function: callable by signed-in clients only, an empty search_path,
-- a pure boolean (no table access).
do $$
declare f record;
begin
  select p.oid, p.provolatile, p.prosecdef, p.proconfig into f
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'resource_tags_valid';
  if not has_function_privilege('authenticated', f.oid, 'EXECUTE') then
    raise exception 'authenticated must be able to run the tag check (it runs in their writes)';
  end if;
  if has_function_privilege('anon', f.oid, 'EXECUTE') then
    raise exception 'anon must not be able to run the tag check';
  end if;
  if f.provolatile <> 'i' or f.prosecdef or f.proconfig is null
     or not (f.proconfig @> array['search_path=""']) then
    raise exception 'resource_tags_valid must be immutable, SECURITY INVOKER, with an empty search_path';
  end if;
end;
$$;

-- A signed-in client gets the same answers through its own role.
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
do $$
begin
  insert into public.spaces (name, tags) values ('ok', array['a']);
  begin
    insert into public.spaces (name, tags) values ('bad', array['A', 'a']);
    raise exception 'a client duplicate tag must fail';
  exception when check_violation then null;
  end;
  begin
    insert into public.spaces (name) values (repeat('x', 121));
    raise exception 'a client over-long name must fail';
  exception when check_violation then null;
  end;
end;
$$;
reset role;

rollback;
\echo resource-metadata-bounds: all checks passed
