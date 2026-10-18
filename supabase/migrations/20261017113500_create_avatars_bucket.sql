-- Profile avatars: a public-read Storage bucket with owner-only writes.
-- Approved by the repository owner (2026-10-17): public-read bucket, files
-- under {user_id}/, 2 MB limit, PNG/JPEG/WebP only (no SVG: it can carry
-- script). Not applied by the repo tooling: it was run by hand in the Supabase
-- dashboard SQL editor, as with the profiles migration, and the three
-- policies were confirmed present afterwards.

-- 1. Bucket. Public means an object is served by URL without any policy, so
--    the browser can load <img src>. It does NOT allow listing.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152, -- 2 MiB
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do nothing;

-- 2. Owner-only policies on storage.objects, scoped to this bucket and to the
--    caller's own folder (the first path segment is their user id).
--    SELECT is limited to the owner's folder so the app can list and replace
--    its own old files; a broad SELECT on a public bucket would let anyone
--    list every user's files (Supabase advisor 0025).
--    There is no UPDATE policy: the app uploads a new unique name and deletes
--    the old one, so it never overwrites.
create policy avatars_select_own on storage.objects
  for select to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy avatars_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy avatars_delete_own on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
