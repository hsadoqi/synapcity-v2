-- Account deletion: a function a signed-in person can call to delete THEIR OWN
-- account. Approved in principle by the repository owner (2026-10-17); not
-- applied by the repo tooling. Run it in the Supabase dashboard SQL editor, as
-- with the earlier migrations. IRREVERSIBLE once called: there is no undo.
--
-- Why a function: the app has no service-role key (apps/web/src/lib/env.ts
-- forbids it), and the browser-facing key cannot delete from auth.users. A
-- SECURITY DEFINER function runs with its owner's rights, so it can, and it is
-- therefore the one place that must refuse everything it should refuse.
--
-- What it refuses:
--   * no session (auth.uid() is null);
--   * a session that did not sign in by an emailed link in the last 10 minutes
--     (the `amr` claim lists how and when each sign-in happened). Typing a
--     password, an old session or a stolen cookie is not enough: the person has
--     to have the inbox. Keep the method list in step with
--     `LINK_SIGN_IN_METHODS` in
--     apps/web/src/features/auth/shared/recent-link-sign-in/recent-link-sign-in.ts.
-- It deletes the row of auth.uid() and nobody else's: there is no argument, so
-- there is no id to forge. Rows that reference auth.users with ON DELETE
-- CASCADE (public.profiles) go with it. Avatar files are NOT deleted here:
-- Supabase blocks deleting storage objects from SQL, so the app removes them
-- through the Storage API first.

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;

  if not exists (
    select 1
    from jsonb_array_elements(coalesce(auth.jwt() -> 'amr', '[]'::jsonb)) as entry
    where jsonb_typeof(entry) = 'object'
      and entry ->> 'method' in ('otp', 'magiclink')
      and (entry ->> 'timestamp') ~ '^[0-9]+$'
      and (entry ->> 'timestamp')::bigint >= extract(epoch from now())::bigint - 600
  ) then
    raise exception 'sign in with an emailed link to delete the account'
      using errcode = '42501';
  end if;

  delete from auth.users where id = uid;
end;
$$;

-- Callable by a signed-in person only. Never by an anonymous visitor.
revoke execute on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;
