-- ADR-0006: profiles for Supabase Auth users.
-- Reviewed by the repository owner before being run. Not applied by the repo
-- tooling: run it in the Supabase dashboard SQL editor (or `supabase db push`
-- once the project is linked).

-- 1. Table. id mirrors auth.users, so there is no generated key.
--    Email stays in auth.users and is not duplicated here.
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint profiles_display_name_length check (char_length(display_name) <= 80),
  constraint profiles_avatar_url_https check (
    avatar_url is null
    or (avatar_url ~ '^https://' and char_length(avatar_url) <= 2048)
  )
);

-- 2. RLS: owner only. There is no INSERT policy (the signup trigger creates
--    rows) and no DELETE policy (rows go with their auth.users row).
alter table public.profiles enable row level security;

create policy profiles_select_own on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

create policy profiles_update_own on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- 3. Explicit grants, least privilege. New tables are not exposed to the Data
--    API by default, and users may edit only these two columns.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, avatar_url) on public.profiles to authenticated;

-- 4. Keep updated_at honest.
create function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- 5. Create a profile on signup.
--    SECURITY DEFINER is needed because the auth service role has no INSERT on
--    profiles, so the function lives in a private schema that the Data API does
--    not expose. It must never raise: an error here aborts the whole signup, so
--    metadata (user-editable, untrusted) is cleaned instead of rejected.
create schema if not exists private;

create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta   jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  dname  text  := nullif(left(btrim(coalesce(meta ->> 'full_name', meta ->> 'name', '')), 80), '');
  avatar text  := meta ->> 'avatar_url';
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    dname,
    case when avatar ~ '^https://' and char_length(avatar) <= 2048 then avatar end
  );
  return new;
end;
$$;

revoke execute on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- 6. One-off: profiles for users that already exist.
insert into public.profiles (id)
select id from auth.users
on conflict do nothing;
