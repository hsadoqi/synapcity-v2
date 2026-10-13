-- ADR-0006: clear the Supabase security advisor warnings 0028 and 0029.
--
-- public.rls_auto_enable() is Supabase's own function behind the `ensure_rls`
-- event trigger, which turns on row level security for every new table. It is
-- SECURITY DEFINER and, by default, executable by PUBLIC (and so by anon and
-- authenticated) through /rest/v1/rpc/rls_auto_enable. It is only meant to be
-- run by the database as an event trigger, so the API roles lose EXECUTE.
--
-- PUBLIC must be revoked too: every role inherits from it, so revoking only
-- anon and authenticated leaves the function callable.
--
-- Safe to run more than once. Verified by creating a probe table afterwards
-- and checking that RLS was still enabled on it (rolled back, nothing kept).
-- Supabase manages this function, so a platform change could restore the
-- grants; if the advisor warns again, run this file again.

revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
