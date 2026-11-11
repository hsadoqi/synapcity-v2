-- Profiles: structured names, a bio and a profile-completion timestamp.
-- Forward-only. Supabase Auth keeps owning email, verification, credentials,
-- identities and sessions; public.profiles keeps owning profile data, keyed by
-- auth.users.id.
--
-- 1. Four nullable columns. Adding a nullable column with no default rewrites
--    nothing, so existing rows keep every value and start with the new fields
--    null: no first name is invented and no one is marked complete.
--    first_name is nullable here because an OAuth provider may not supply one;
--    the email/password registration form and its server validation require it.
--    display_name stays an optional, user-set override and is not derived from
--    the new columns.
alter table public.profiles
  add column first_name           text,
  add column last_name            text,
  add column bio                  text,
  add column profile_completed_at timestamptz;

-- 2. Checks. A name, when present, holds a non-whitespace character and at most
--    80 characters; a bio at most 500. A completed profile has a first name
--    (which the first-name check then makes valid). The existing display_name
--    and avatar_url checks are unchanged.
alter table public.profiles
  add constraint profiles_first_name_valid check (
    first_name is null
    or (first_name ~ '[^[:space:]]' and char_length(first_name) <= 80)
  ),
  add constraint profiles_last_name_valid check (
    last_name is null
    or (last_name ~ '[^[:space:]]' and char_length(last_name) <= 80)
  ),
  add constraint profiles_bio_length check (char_length(bio) <= 500),
  add constraint profiles_completed_requires_first_name check (
    profile_completed_at is null or first_name is not null
  );

-- 3. The owner may edit the new columns on their own row. RLS is unchanged
--    (owner-only select and update, no insert or delete policy), and there is
--    still no client INSERT or DELETE.
grant update (first_name, last_name, bio, profile_completed_at)
  on public.profiles to authenticated;

-- 4. Signup trigger: also copy structured first_name and last_name from the
--    signup metadata. A name is copied only when it is a JSON string that,
--    trimmed, passes the column check; anything else becomes null, so a
--    profile is still created when either is absent or invalid. No name is
--    derived from full_name, name, display_name or username.
--    The display-name and avatar prefill are unchanged from
--    20261017122000_profiles_signup_read_google_picture.sql. CREATE OR REPLACE
--    keeps the owner, SECURITY DEFINER, the empty search_path and the trigger.
--    It must never raise (an error here aborts the whole signup), so untrusted
--    metadata is cleaned, not rejected.
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
  fname  text  := case when jsonb_typeof(meta -> 'first_name') = 'string'
                       then btrim(meta ->> 'first_name') end;
  lname  text  := case when jsonb_typeof(meta -> 'last_name') = 'string'
                       then btrim(meta ->> 'last_name') end;
begin
  insert into public.profiles (id, display_name, avatar_url, first_name, last_name)
  values (
    new.id,
    dname,
    case when avatar ~ '^https://' and char_length(avatar) <= 2048 then avatar end,
    case when fname ~ '[^[:space:]]' and char_length(fname) <= 80 then fname end,
    case when lname ~ '[^[:space:]]' and char_length(lname) <= 80 then lname end
  );
  return new;
end;
$$;

-- Same lockdown as before: only the trigger may run it.
revoke execute on function private.handle_new_user() from public, anon, authenticated;
