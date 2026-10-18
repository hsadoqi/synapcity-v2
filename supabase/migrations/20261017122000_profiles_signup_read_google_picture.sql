-- Signup trigger: also read Google's `picture` key.
-- Approved by the repository owner (2026-10-17). Not applied by the repo
-- tooling: run it in the Supabase dashboard SQL editor, as with the earlier
-- migrations.
--
-- Why: GitHub supplies the profile image as `avatar_url`, Google as
-- `picture`. The original trigger read only `avatar_url`, so a Google
-- account's `profiles.avatar_url` started empty while the header (which reads
-- the token claims) still showed the photo.
--
-- This replaces the function body only. CREATE OR REPLACE keeps the function
-- owner and the trigger that calls it. It changes new signups only: existing
-- rows are not touched. The rest of the function is unchanged from
-- 20261013162633_create_profiles.sql: it must never raise (an error here
-- aborts the whole signup), so untrusted metadata is cleaned, not rejected.

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta   jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  dname  text  := nullif(left(btrim(coalesce(meta ->> 'full_name', meta ->> 'name', '')), 80), '');
  avatar text  := coalesce(meta ->> 'avatar_url', meta ->> 'picture');
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

-- Same lockdown as the original: only the trigger may run it.
revoke execute on function private.handle_new_user() from public, anon, authenticated;
