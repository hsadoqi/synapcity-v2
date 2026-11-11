-- The avatars bucket as the migration defines it (owner decision D10: public
-- read by URL, owner-only writes in the user's own folder). Behaviour through
-- real clients is in the server-data database test; this file asserts the
-- definitions themselves, because the delete policy sits behind the select
-- policy (Storage needs to see an object to delete it), so a weakened delete
-- policy cannot be seen from behaviour alone.
-- Run through `pnpm db:test`. The definition checks are read-only; the
-- behaviour block at the end is rolled back.
\set ON_ERROR_STOP on

do $$
declare
  b record;
  pol record;
  n integer;
  -- The catalog prints the expression its own way; compare with spaces and
  -- parentheses removed.
  expected text := 'bucket_id=''avatars''::textandstorage.foldernamename[1]=selectauth.uidasuid::text';
  -- Insert also needs a profile with no deletion marker set in the last 15
  -- minutes (20261111200000_profile_setup_and_deletion_marker.sql).
  expected_insert text := expected
    || 'andexistsselect1fromprofilespwherep.id=selectauth.uidasuid'
    || 'andp.account_deletion_started_atisnullorp.account_deletion_started_at<now-''00:15:00''::interval';
begin
  select id, name, public, file_size_limit, allowed_mime_types into b
    from storage.buckets where id = 'avatars';
  if not found then raise exception 'the avatars bucket must exist'; end if;
  if b.public is distinct from true then raise exception 'avatars must be a public bucket (D10)'; end if;
  if b.file_size_limit is distinct from 2097152 then raise exception 'avatars must cap files at 2 MiB'; end if;
  if b.allowed_mime_types is distinct from array['image/png', 'image/jpeg', 'image/webp'] then
    raise exception 'avatars must allow PNG, JPEG and WebP only (no SVG), got %', b.allowed_mime_types;
  end if;

  -- Exactly the three owner-only policies; none for anon; none that updates.
  select count(*) into n from pg_policies
   where schemaname = 'storage' and tablename = 'objects'
     and (qual like '%avatars%' or with_check like '%avatars%');
  if n <> 3 then raise exception 'the avatars bucket must have exactly 3 policies (saw %)', n; end if;

  for pol in
    select policyname, cmd, roles, qual, with_check from pg_policies
     where schemaname = 'storage' and tablename = 'objects'
       and (qual like '%avatars%' or with_check like '%avatars%')
  loop
    if pol.roles <> array['authenticated']::name[] then
      raise exception '% must be for authenticated only (got %)', pol.policyname, pol.roles;
    end if;
    if pol.cmd = 'UPDATE' then raise exception 'no avatars policy may allow UPDATE (replacement is a new name)'; end if;
    -- SELECT and DELETE use USING; INSERT uses WITH CHECK. Each pins the bucket
    -- and the first path segment to the caller's id, and nothing more lenient;
    -- INSERT also refuses during an account deletion.
    if regexp_replace(lower(coalesce(pol.qual, pol.with_check)), '[\s()]', '', 'g')
       is distinct from (case when pol.cmd = 'INSERT' then expected_insert else expected end) then
      raise exception '% must pin the bucket and the caller''s own folder (got %)',
        pol.policyname, coalesce(pol.qual, pol.with_check);
    end if;
  end loop;

  foreach pol.policyname in array array['avatars_select_own', 'avatars_insert_own', 'avatars_delete_own'] loop
    if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = pol.policyname) then
      raise exception 'missing policy %', pol.policyname;
    end if;
  end loop;
end;
$$;

-- Behaviour of the insert policy's deletion clause, through the authenticated
-- role. Rolled back.
begin;
insert into auth.users (id, email) values
  ('55555555-5555-4555-8555-555555555555', 'avatars-marker@example.test');
set local role authenticated;
select set_config('request.jwt.claim.sub', '55555555-5555-4555-8555-555555555555', true);
do $$
begin
  insert into storage.objects (bucket_id, name)
  values ('avatars', '55555555-5555-4555-8555-555555555555/before.png');

  update public.profiles set account_deletion_started_at = now() where id = auth.uid();
  begin
    insert into storage.objects (bucket_id, name)
    values ('avatars', '55555555-5555-4555-8555-555555555555/during.png');
    raise exception 'an upload while a deletion is active must be refused';
  exception when insufficient_privilege then null;
  end;

  update public.profiles set account_deletion_started_at = null where id = auth.uid();
  insert into storage.objects (bucket_id, name)
  values ('avatars', '55555555-5555-4555-8555-555555555555/after.png');
end;
$$;
reset role;
-- An expired marker no longer blocks: age it past the window directly (the
-- stamping trigger would otherwise replace the value with now()).
set local session_replication_role = replica;
update public.profiles set account_deletion_started_at = now() - interval '16 minutes'
 where id = '55555555-5555-4555-8555-555555555555';
set local session_replication_role = origin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '55555555-5555-4555-8555-555555555555', true);
insert into storage.objects (bucket_id, name)
values ('avatars', '55555555-5555-4555-8555-555555555555/expired.png');
reset role;
rollback;

\echo storage-avatars: all checks passed
