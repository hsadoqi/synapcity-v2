-- Support for the SQL tests; not a test. `pnpm db:test` runs this file before
-- the test files and drops the schema after them, so it exists only during a
-- run. No migration creates it and nothing in `public` or `private` depends on
-- it. Run as the database administrator, then `reset role` inside a test before
-- calling the functions that change policy or data.
\set ON_ERROR_STOP on

drop schema if exists test_helpers cascade;
create schema test_helpers;
revoke all on schema test_helpers from public, anon, authenticated;

-- Redefines a zero-argument policy function in the `private` schema (revision
-- policy values live in one such function, so a test can shrink a gap, a span
-- or a cap without waiting) and keeps its return type. Call it inside the
-- test's own transaction: the redefinition rolls back with it. A policy is
-- never read from a runtime setting, because any session can change one.
create function test_helpers.redefine_policy(fn_name text, body text)
returns void
language plpgsql
as $$
declare
  returns_clause text;
begin
  select pg_get_function_result(p.oid) into returns_clause
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'private' and p.proname = fn_name and p.pronargs = 0;
  if returns_clause is null then
    raise exception 'private.%() does not exist', fn_name;
  end if;
  execute format(
    'create or replace function private.%I() returns %s language sql stable set search_path = '''' as %L',
    fn_name, returns_clause, body
  );
end;
$$;

-- Simulates a backfill against rows that existed before the migration that
-- fills them: deletes the rows matching `delete_filter`, runs the backfill
-- statement (given as text), and returns how many rows were deleted. Run as the
-- administrator inside a transaction that rolls back, so the table is restored.
create function test_helpers.staged_backfill(
  target regclass, delete_filter text, backfill_sql text
)
returns bigint
language plpgsql
as $$
declare
  removed bigint;
begin
  execute format('delete from %s where %s', target, delete_filter);
  get diagnostics removed = row_count;
  execute backfill_sql;
  return removed;
end;
$$;

-- Acts as an authenticated user for the rest of the transaction.
create function test_helpers.as_user(uid uuid)
returns void
language plpgsql
as $$
begin
  perform set_config('request.jwt.claim.sub', uid::text, true);
  perform set_config('role', 'authenticated', true);
end;
$$;

\echo test_helpers: ready
