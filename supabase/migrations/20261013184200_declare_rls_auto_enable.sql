-- Declares public.rls_auto_enable() and its ensure_rls event trigger in the
-- migration history. The hosted project gained both outside migrations
-- (checked 2026-10-27: owned by postgres, not part of an extension, created by
-- none of the migrations, the body of the Row Level Security guide's
-- example), and the next migration, 20261013184213, revokes EXECUTE on the
-- function. Without this file a fresh database stops at that revoke.
--
-- Guarded: where the function or the trigger already exists (the hosted
-- project), this changes nothing, so the function's grants and body stay as
-- they are. Timestamped before 20261013184213 so a fresh database creates the
-- function first; on the hosted project it is applied once with
-- `supabase db push --include-all` and does nothing there.
--
-- The function body is the hosted definition copied verbatim (hence its own
-- casing and indentation), so a fresh database's pg_get_functiondef matches
-- the hosted one exactly.

do $do$
begin
  if to_regprocedure('public.rls_auto_enable()') is null then
    create function public.rls_auto_enable()
      returns event_trigger
      language plpgsql
      security definer
      set search_path to 'pg_catalog'
    as $fn$
DECLARE
  cmd record;
  tbl name;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        SELECT c.relname INTO tbl FROM pg_catalog.pg_class c WHERE c.oid = cmd.objid;
        EXECUTE format('alter table if exists %I.%I enable row level security', cmd.schema_name, tbl);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$fn$;
  end if;

  if not exists (select 1 from pg_catalog.pg_event_trigger where evtname = 'ensure_rls') then
    create event trigger ensure_rls
      on ddl_command_end
      when tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      execute function public.rls_auto_enable();
  end if;
end
$do$;
