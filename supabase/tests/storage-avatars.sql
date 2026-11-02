-- The avatars bucket as the migration defines it (owner decision D10: public
-- read by URL, owner-only writes in the user's own folder). Behaviour through
-- real clients is in the server-data database test; this file asserts the
-- definitions themselves, because the delete policy sits behind the select
-- policy (Storage needs to see an object to delete it), so a weakened delete
-- policy cannot be seen from behaviour alone.
-- Run through `pnpm db:test`. Read-only.
\set ON_ERROR_STOP on

do $$
declare
  b record;
  pol record;
  n integer;
  -- The catalog prints the expression its own way; compare with spaces and
  -- parentheses removed.
  expected text := 'bucket_id=''avatars''::textandstorage.foldernamename[1]=selectauth.uidasuid::text';
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
    -- and the first path segment to the caller's id, and nothing more lenient.
    if regexp_replace(lower(coalesce(pol.qual, pol.with_check)), '[\s()]', '', 'g') is distinct from expected then
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

\echo storage-avatars: all checks passed
