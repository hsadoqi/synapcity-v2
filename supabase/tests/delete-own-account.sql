-- public.delete_own_account: a signed-in person can delete THEIR OWN account,
-- only after a recent emailed-link sign-in, and nothing else. Also the cascade:
-- everything the account owns goes with it, with no orphan rows.
-- Run through `pnpm db:test`. Rolled back.
\set ON_ERROR_STOP on

begin;

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'delete-a@example.test'),
  ('22222222-2222-4222-8222-222222222222', 'delete-b@example.test');

-- Both accounts own one of everything.
insert into public.user_preferences (user_id, preferences) values
  ('11111111-1111-4111-8111-111111111111', '{}'),
  ('22222222-2222-4222-8222-222222222222', '{}');
insert into public.spaces (id, owner_id, name) values
  ('a1000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'A space'),
  ('b1000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'B space');
insert into public.documents (id, owner_id, name) values
  ('a2000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'A doc'),
  ('b2000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'B doc');
insert into public.dashboards (id, owner_id, name) values
  ('a3000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'A dash'),
  ('b3000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'B dash');
insert into public.space_documents (space_id, document_id, owner_id) values
  ('a1000000-0000-4000-8000-000000000001', 'a2000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111');
insert into public.space_dashboards (space_id, dashboard_id, owner_id) values
  ('a1000000-0000-4000-8000-000000000001', 'a3000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111');

-- Each case acts as A with the claims given and reports the SQLSTATE it ended with.
create function pg_temp.call_as(claims jsonb) returns text language plpgsql as $$
begin
  perform set_config('request.jwt.claims', claims::text, true);
  perform set_config('request.jwt.claim.sub', coalesce(claims ->> 'sub', ''), true);
  perform set_config('role', 'authenticated', true);
  begin
    perform public.delete_own_account();
    return 'deleted';
  exception when others then
    return sqlstate;
  end;
end;
$$;

do $$
declare
  now_s bigint := extract(epoch from now())::bigint;
  a text := '11111111-1111-4111-8111-111111111111';
  outcome text;
  n integer;
begin
  -- No session: refused with 28000.
  outcome := pg_temp.call_as('{}'::jsonb);
  if outcome <> '28000' then raise exception 'no session must be refused with 28000 (got %)', outcome; end if;

  -- A session without a recent emailed-link sign-in: refused with 42501.
  foreach outcome in array array[
    pg_temp.call_as(jsonb_build_object('sub', a)),
    pg_temp.call_as(jsonb_build_object('sub', a, 'amr', jsonb_build_array(jsonb_build_object('method', 'password', 'timestamp', now_s)))),
    pg_temp.call_as(jsonb_build_object('sub', a, 'amr', jsonb_build_array(jsonb_build_object('method', 'otp', 'timestamp', now_s - 601)))),
    pg_temp.call_as(jsonb_build_object('sub', a, 'amr', jsonb_build_array(jsonb_build_object('method', 'otp', 'timestamp', 'yesterday')))),
    pg_temp.call_as(jsonb_build_object('sub', a, 'amr', jsonb_build_array(jsonb_build_object('method', 'otp')))),
    pg_temp.call_as(jsonb_build_object('sub', a, 'amr', jsonb_build_array('otp')))
  ] loop
    if outcome <> '42501' then raise exception 'a weak session must be refused with 42501 (got %)', outcome; end if;
  end loop;

  -- A claim that is not an array at all (Supabase never issues one) still
  -- deletes nothing. It fails with 22023 (the array walk cannot read a scalar)
  -- rather than the clean 42501: refused, and noted, not relied on.
  outcome := pg_temp.call_as(jsonb_build_object('sub', a, 'amr', 'otp'));
  if outcome = 'deleted' then raise exception 'a scalar amr claim must never allow deletion'; end if;
  if outcome not in ('42501', '22023') then raise exception 'unexpected outcome for a scalar amr: %', outcome; end if;

  -- Nothing was deleted by the refusals. (Read as the administrator again.)
  perform set_config('role', current_setting('session_authorization'), true);
  select count(*) into n from auth.users where id in (a::uuid, '22222222-2222-4222-8222-222222222222'::uuid);
  if n <> 2 then raise exception 'a refused call must delete nothing'; end if;

  -- A recent emailed link (otp, or magiclink) deletes the caller.
  perform set_config('role', 'authenticated', true);
  outcome := pg_temp.call_as(jsonb_build_object('sub', a, 'amr', jsonb_build_array(
    jsonb_build_object('method', 'password', 'timestamp', now_s - 99999),
    jsonb_build_object('method', 'magiclink', 'timestamp', now_s - 599))));
  if outcome <> 'deleted' then raise exception 'a recent magiclink must allow deletion (got %)', outcome; end if;
end;
$$;
reset role;

-- Only the caller went; everything of theirs went with them; B is intact.
do $$
declare
  a text := '11111111-1111-4111-8111-111111111111';
  b text := '22222222-2222-4222-8222-222222222222';
begin
  if exists (select 1 from auth.users where id = a::uuid) then raise exception 'the caller must be deleted'; end if;
  if not exists (select 1 from auth.users where id = b::uuid) then raise exception 'another account must survive'; end if;
  if exists (select 1 from public.profiles where id = a::uuid)
     or exists (select 1 from public.user_preferences where user_id = a::uuid)
     or exists (select 1 from public.spaces where owner_id = a::uuid)
     or exists (select 1 from public.documents where owner_id = a::uuid)
     or exists (select 1 from public.dashboards where owner_id = a::uuid)
     or exists (select 1 from public.dashboard_compositions where owner_id = a::uuid)
     or exists (select 1 from public.dashboard_revisions where owner_id = a::uuid)
     or exists (select 1 from public.space_documents where owner_id = a::uuid)
     or exists (select 1 from public.space_dashboards where owner_id = a::uuid) then
    raise exception 'everything the account owned must go with it';
  end if;
  if not exists (select 1 from public.profiles where id = b::uuid)
     or not exists (select 1 from public.spaces where owner_id = b::uuid)
     or not exists (select 1 from public.dashboard_compositions where owner_id = b::uuid)
     or not exists (select 1 from public.dashboard_revisions where owner_id = b::uuid) then
    raise exception 'another account''s data must be untouched';
  end if;
end;
$$;

-- Function hygiene: signed-in only, definer with an empty search_path.
do $$
declare f record;
begin
  select p.oid, p.prosecdef, p.proconfig into f
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'delete_own_account';
  if not has_function_privilege('authenticated', f.oid, 'EXECUTE') then raise exception 'signed-in users must be able to call it'; end if;
  if has_function_privilege('anon', f.oid, 'EXECUTE') then raise exception 'anon must not be able to call it'; end if;
  if not f.prosecdef or not coalesce(f.proconfig @> array['search_path=""'], false) then
    raise exception 'delete_own_account must be SECURITY DEFINER with an empty search_path';
  end if;
end;
$$;

rollback;
\echo delete-own-account: all checks passed
