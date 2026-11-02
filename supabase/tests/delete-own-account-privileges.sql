-- Privilege and hygiene contract for public.delete_own_account(). Run only on a
-- disposable local database after applying the migrations, as the database
-- administrator:
-- psql -X -v ON_ERROR_STOP=1 -f supabase/tests/delete-own-account-privileges.sql <local-connection>
-- Everything below is rolled back. No pgTAP dependency.
\set ON_ERROR_STOP on

begin;

do $$
declare
  f record;
  overloads integer;
begin
  select count(*) into overloads
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'delete_own_account';
  if overloads <> 1 then
    raise exception 'expected exactly one public.delete_own_account, found %', overloads;
  end if;

  select p.oid, p.proowner::regrole::text as owner, p.prosecdef, p.proconfig
    into f
    from pg_proc p
   where p.oid = 'public.delete_own_account()'::regprocedure;

  -- Signed-in users can call it; nobody else outside the platform roles can.
  if not has_function_privilege('authenticated', f.oid, 'EXECUTE') then
    raise exception 'authenticated must be able to execute delete_own_account';
  end if;
  if has_function_privilege('anon', f.oid, 'EXECUTE') then
    raise exception 'anon must not be able to execute delete_own_account';
  end if;
  if exists (
    select 1 from aclexplode((select proacl from pg_proc where oid = f.oid)) a
     where a.grantee = 0 and a.privilege_type = 'EXECUTE'
  ) then
    raise exception 'PUBLIC must not hold EXECUTE on delete_own_account';
  end if;

  -- Ownership and definer contract unchanged.
  if f.owner <> 'postgres' then
    raise exception 'delete_own_account must be owned by postgres, found %', f.owner;
  end if;
  if not f.prosecdef or not coalesce(f.proconfig @> array['search_path=""'], false) then
    raise exception 'delete_own_account must be SECURITY DEFINER with an empty search_path';
  end if;
end;
$$;

-- Deliberately weakened: without the grant the check above must fail.
revoke execute on function public.delete_own_account() from authenticated;
do $$
begin
  if has_function_privilege('authenticated', 'public.delete_own_account()'::regprocedure, 'EXECUTE') then
    raise exception 'weakening probe: revoking the grant was not observable';
  end if;
end;
$$;

-- The repair is exactly the forward migration's statement, and is idempotent.
grant execute on function public.delete_own_account() to authenticated;
grant execute on function public.delete_own_account() to authenticated;
do $$
begin
  if not has_function_privilege('authenticated', 'public.delete_own_account()'::regprocedure, 'EXECUTE')
     or has_function_privilege('anon', 'public.delete_own_account()'::regprocedure, 'EXECUTE') then
    raise exception 'the repair statement must restore authenticated only';
  end if;
end;
$$;

rollback;

\echo 'delete-own-account-privileges: all checks passed'
