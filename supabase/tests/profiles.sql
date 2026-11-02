-- profiles (ADR-0006): owner-only reads and updates, two writable columns, an
-- immutable id, no client insert or delete, no anonymous access.
-- Run through `pnpm db:test`. Rolled back.
\set ON_ERROR_STOP on

begin;

-- The signup trigger creates each profile.
insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-4111-8111-111111111111', 'profiles-a@example.test', '{"name":"Ada"}'),
  ('22222222-2222-4222-8222-222222222222', 'profiles-b@example.test', '{"name":"Bob"}');

-- Age A's row so "updated_at moves" can be seen inside one transaction.
set local session_replication_role = replica;
update public.profiles set updated_at = '2000-01-01'
 where id = '11111111-1111-4111-8111-111111111111';
set local session_replication_role = origin;

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);

do $$
declare
  n integer;
  changed integer;
  stamp timestamptz;
begin
  -- Reads: own row only.
  select count(*) into n from public.profiles;
  if n <> 1 then raise exception 'a user must see only their own profile (saw %)', n; end if;
  if (select display_name from public.profiles) is distinct from 'Ada' then
    raise exception 'the signup trigger must have set the display name';
  end if;

  -- Updates: the two columns, on own row, and updated_at moves.
  update public.profiles set display_name = 'Ada L.', avatar_url = 'https://example.test/a.png'
   where id = auth.uid();
  get diagnostics changed = row_count;
  if changed <> 1 then raise exception 'updating own profile must write one row'; end if;
  select updated_at into stamp from public.profiles where id = auth.uid();
  if stamp <= '2000-01-01'::timestamptz then raise exception 'updated_at must move on update'; end if;

  -- Another person's profile is invisible to update.
  update public.profiles set display_name = 'stolen'
   where id = '22222222-2222-4222-8222-222222222222';
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'another profile must not be updatable'; end if;

  -- Column grants: only display_name and avatar_url.
  begin
    update public.profiles set id = '33333333-3333-4333-8333-333333333333' where id = auth.uid();
    raise exception 'the id must be immutable';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.profiles set created_at = '2000-01-01' where id = auth.uid();
    raise exception 'created_at must not be writable';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.profiles set updated_at = '2000-01-01' where id = auth.uid();
    raise exception 'updated_at must not be writable';
  exception when insufficient_privilege then null;
  end;

  -- Checks.
  begin
    update public.profiles set display_name = repeat('x', 81) where id = auth.uid();
    raise exception 'a display name over 80 characters must fail';
  exception when check_violation then null;
  end;
  update public.profiles set display_name = repeat('x', 80) where id = auth.uid();
  begin
    update public.profiles set avatar_url = 'http://example.test/a.png' where id = auth.uid();
    raise exception 'a non-https avatar must fail';
  exception when check_violation then null;
  end;
  begin
    update public.profiles set avatar_url = 'https://' || repeat('x', 2041) where id = auth.uid();
    raise exception 'an avatar URL over 2048 characters must fail';
  exception when check_violation then null;
  end;

  -- No client insert or delete.
  begin
    insert into public.profiles (id) values ('44444444-4444-4444-8444-444444444444');
    raise exception 'a client must not insert a profile';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from public.profiles where id = auth.uid();
    raise exception 'a client must not delete a profile';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;

set local role anon;
do $$
begin
  begin
    perform 1 from public.profiles;
    raise exception 'anon must not read profiles';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;

-- The grants and policies themselves. Behaviour alone cannot show every one:
-- the UPDATE policy sits behind the SELECT policy, and the id column grant
-- behind the policy's WITH CHECK, so each is also asserted as it is defined.
do $$
declare pol record;
begin
  for pol in select policyname, qual, with_check from pg_policies
              where schemaname = 'public' and tablename = 'profiles' loop
    if pol.policyname = 'profiles_select_own'
       and (pol.qual is null or pol.qual not like '%auth.uid()%' or pol.qual not like '%= id%') then
      raise exception 'profiles_select_own must compare auth.uid() with id (got %)', pol.qual;
    end if;
    if pol.policyname = 'profiles_update_own'
       and (pol.qual is null or pol.qual not like '%auth.uid()%' or pol.qual not like '%= id%'
            or pol.with_check is null or pol.with_check not like '%auth.uid()%' or pol.with_check not like '%= id%') then
      raise exception 'profiles_update_own must pin both sides to auth.uid() = id (got % / %)', pol.qual, pol.with_check;
    end if;
  end loop;
  if (select count(*) from pg_policies where schemaname = 'public' and tablename = 'profiles') <> 2 then
    raise exception 'profiles must have exactly its select and update policies';
  end if;
  if has_column_privilege('authenticated', 'public.profiles', 'id', 'UPDATE')
     or has_column_privilege('authenticated', 'public.profiles', 'created_at', 'UPDATE')
     or has_column_privilege('authenticated', 'public.profiles', 'updated_at', 'UPDATE') then
    raise exception 'only display_name and avatar_url may be writable columns';
  end if;
  if not has_column_privilege('authenticated', 'public.profiles', 'display_name', 'UPDATE')
     or not has_column_privilege('authenticated', 'public.profiles', 'avatar_url', 'UPDATE') then
    raise exception 'display_name and avatar_url must be writable';
  end if;
  if has_table_privilege('authenticated', 'public.profiles', 'INSERT')
     or has_table_privilege('authenticated', 'public.profiles', 'DELETE')
     or has_table_privilege('anon', 'public.profiles', 'SELECT') then
    raise exception 'profiles grants are wrong';
  end if;
  if not (select relrowsecurity from pg_class where oid = 'public.profiles'::regclass) then
    raise exception 'row-level security must be on for profiles';
  end if;
  if exists (select 1 from pg_policies where tablename = 'profiles' and cmd in ('INSERT', 'DELETE')) then
    raise exception 'profiles must have no insert or delete policy';
  end if;
end;
$$;

rollback;
\echo profiles: all checks passed
