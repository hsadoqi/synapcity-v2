-- Profiles: a skipped-setup timestamp and an account-deletion marker, both
-- stamped by the database clock; the avatar upload policy refuses new files
-- while a deletion is under way. Forward-only.
--
-- Profile setup has three states, derived from two timestamps:
--   completed   profile_completed_at is set (needs a first name, as before)
--   skipped     profile_setup_skipped_at is set and the profile is not completed
--   incomplete  neither is set
-- profile_completed_at stays the only completion marker.
--
-- account_deletion_started_at marks a deletion in progress. It is active for
-- 15 minutes after it was last set, which is longer than any request that can
-- act on it (a 300 s function limit, an 8 s statement timeout), so a deletion
-- that dies part-way never blocks the account for long.

-- 1. Two nullable columns. Nothing is rewritten; existing rows start null.
alter table public.profiles
  add column profile_setup_skipped_at    timestamptz,
  add column account_deletion_started_at timestamptz;

-- 2. The owner may set them on their own row. RLS is unchanged (owner-only
--    select and update, no insert or delete).
grant update (profile_setup_skipped_at, account_deletion_started_at)
  on public.profiles to authenticated;

-- 3. Clients may set these timestamps but not choose their values, the same
--    guarantee as stamp_user_state() (20261018100000):
--    - profile_completed_at and profile_setup_skipped_at take the server clock
--      when they go from null to a value, and keep their first value if a
--      client sends another one. Clearing to null stays possible, as the
--      completion column already allowed.
--    - account_deletion_started_at takes the server clock on every non-null
--      write, so a retried deletion restarts its window. Clearing is allowed.
create function public.stamp_profile_lifecycle()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.profile_completed_at is not null
     and new.profile_completed_at is distinct from old.profile_completed_at then
    new.profile_completed_at = coalesce(old.profile_completed_at, now());
  end if;
  if new.profile_setup_skipped_at is not null
     and new.profile_setup_skipped_at is distinct from old.profile_setup_skipped_at then
    new.profile_setup_skipped_at = coalesce(old.profile_setup_skipped_at, now());
  end if;
  if new.account_deletion_started_at is not null
     and new.account_deletion_started_at is distinct from old.account_deletion_started_at then
    new.account_deletion_started_at = now();
  end if;
  return new;
end;
$$;

create trigger profiles_stamp_lifecycle
  before update on public.profiles
  for each row execute function public.stamp_profile_lifecycle();

-- 4. Avatar uploads: as before, only into the caller's own folder, and now only
--    while the caller has a profile with no active deletion marker. An upload
--    checked after the marker is set, or after the account is gone, is refused
--    by Storage itself. The 15-minute window matches section 3's comment and
--    the server's avatar commit.
drop policy avatars_insert_own on storage.objects;
create policy avatars_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.profiles p
       where p.id = (select auth.uid())
         and (p.account_deletion_started_at is null
              or p.account_deletion_started_at < now() - interval '15 minutes')
    )
  );

-- 5. Backfill, preserving today's behavior: anyone who already finished or
--    dismissed the old setup step (user_metadata.profile_confirmed = true) is
--    recorded as skipped, not completed, because that flag never proved a first
--    name was confirmed. The metadata itself is left as it is.
update public.profiles p
   set profile_setup_skipped_at = now()
  from auth.users u
 where u.id = p.id
   and u.raw_user_meta_data -> 'profile_confirmed' = 'true'::jsonb
   and p.profile_completed_at is null
   and p.profile_setup_skipped_at is null;
