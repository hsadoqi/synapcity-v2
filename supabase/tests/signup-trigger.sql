-- private.handle_new_user (the signup trigger): a profile for every new user,
-- from the three metadata shapes the providers send, and it never raises (an
-- error here would abort the whole signup).
-- Run through `pnpm db:test`. Rolled back.
\set ON_ERROR_STOP on

begin;

insert into auth.users (id, email, raw_user_meta_data) values
  -- password signup: a name, no image
  ('a0000000-0000-4000-8000-000000000001', 'signup-password@example.test', '{"name":"Ada Password"}'),
  -- Google: full_name and picture
  ('a0000000-0000-4000-8000-000000000002', 'signup-google@example.test', '{"full_name":"Grace Google","picture":"https://lh3.example.test/p.png"}'),
  -- GitHub: name and avatar_url
  ('a0000000-0000-4000-8000-000000000003', 'signup-github@example.test', '{"name":"Linus GitHub","avatar_url":"https://avatars.example.test/u.png"}'),
  -- both keys: avatar_url wins
  ('a0000000-0000-4000-8000-000000000004', 'signup-both@example.test', '{"avatar_url":"https://a.example.test/1.png","picture":"https://b.example.test/2.png"}'),
  -- untrusted: not https, too long, name too long, whitespace name
  ('a0000000-0000-4000-8000-000000000005', 'signup-http@example.test', '{"name":"H","picture":"http://insecure.example.test/p.png"}'),
  ('a0000000-0000-4000-8000-000000000006', 'signup-long@example.test', jsonb_build_object('name', repeat('n', 200), 'avatar_url', 'https://' || repeat('x', 2041))),
  ('a0000000-0000-4000-8000-000000000007', 'signup-blank@example.test', '{"name":"   ","full_name":"  "}'),
  -- no metadata at all, and an odd shape
  ('a0000000-0000-4000-8000-000000000008', 'signup-none@example.test', null),
  ('a0000000-0000-4000-8000-000000000009', 'signup-odd@example.test', '{"name":{"nested":true},"avatar_url":42}');

do $$
declare
  p record;
  n integer;
begin
  select count(*) into n from public.profiles where id::text like 'a0000000-%';
  if n <> 9 then raise exception 'every signup must get a profile (saw % of 9)', n; end if;

  select * into p from public.profiles where id = 'a0000000-0000-4000-8000-000000000001';
  if p.display_name is distinct from 'Ada Password' or p.avatar_url is not null then
    raise exception 'password signup: name only';
  end if;

  select * into p from public.profiles where id = 'a0000000-0000-4000-8000-000000000002';
  if p.display_name is distinct from 'Grace Google' or p.avatar_url is distinct from 'https://lh3.example.test/p.png' then
    raise exception 'Google signup must read full_name and picture';
  end if;

  select * into p from public.profiles where id = 'a0000000-0000-4000-8000-000000000003';
  if p.display_name is distinct from 'Linus GitHub' or p.avatar_url is distinct from 'https://avatars.example.test/u.png' then
    raise exception 'GitHub signup must read name and avatar_url';
  end if;

  select * into p from public.profiles where id = 'a0000000-0000-4000-8000-000000000004';
  if p.avatar_url is distinct from 'https://a.example.test/1.png' then
    raise exception 'avatar_url must win over picture';
  end if;

  select * into p from public.profiles where id = 'a0000000-0000-4000-8000-000000000005';
  if p.avatar_url is not null then raise exception 'a non-https image must be dropped, not stored'; end if;

  select * into p from public.profiles where id = 'a0000000-0000-4000-8000-000000000006';
  if char_length(p.display_name) <> 80 then raise exception 'a long name must be cut to 80 (got %)', char_length(p.display_name); end if;
  if p.avatar_url is not null then raise exception 'an over-long image URL must be dropped'; end if;

  select * into p from public.profiles where id = 'a0000000-0000-4000-8000-000000000007';
  if p.display_name is not null then raise exception 'a blank name must become null'; end if;

  select * into p from public.profiles where id = 'a0000000-0000-4000-8000-000000000008';
  if not found then raise exception 'a signup without metadata still gets a profile'; end if;
end;
$$;

-- Only the trigger may run it; it holds an empty search_path.
do $$
declare f record;
begin
  select p.oid, p.prosecdef, p.proconfig into f
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'private' and p.proname = 'handle_new_user';
  if has_function_privilege('authenticated', f.oid, 'EXECUTE')
     or has_function_privilege('anon', f.oid, 'EXECUTE') then
    raise exception 'clients must not execute the signup trigger function';
  end if;
  if not f.prosecdef or not coalesce(f.proconfig @> array['search_path=""'], false) then
    raise exception 'the signup trigger must be SECURITY DEFINER with an empty search_path';
  end if;
end;
$$;

rollback;
\echo signup-trigger: all checks passed
