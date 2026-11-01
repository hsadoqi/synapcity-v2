-- Proves the F5 test helpers (supabase/tests/_helpers.sql) do what the later
-- slices rely on: a policy function can be redefined inside a rolled-back
-- transaction, and a backfill can be staged against rows that already exist.
-- Run as the database administrator after `_helpers.sql` (pnpm db:test does).
\set ON_ERROR_STOP on

begin;

-- 1. Policy redefinition, on a throwaway function with the shape of a policy
--    function (returns a row of values, zero arguments, in `private`).
create function private.harness_probe_policy()
returns table (gap interval, cap integer)
language sql stable set search_path = ''
as $$ select interval '5 minutes', 500 $$;

do $$
declare
  r record;
begin
  select * into r from private.harness_probe_policy();
  if r.gap <> interval '5 minutes' or r.cap <> 500 then
    raise exception 'the probe policy must start with its migration values';
  end if;

  perform test_helpers.redefine_policy(
    'harness_probe_policy', $body$ select interval '0', 3 $body$
  );

  select * into r from private.harness_probe_policy();
  if r.gap <> interval '0' or r.cap <> 3 then
    raise exception 'redefine_policy must change the values (got % and %)', r.gap, r.cap;
  end if;

  -- A function that does not exist, or has arguments, is refused loudly.
  begin
    perform test_helpers.redefine_policy('no_such_policy', 'select 1');
    raise exception 'redefining a missing function must fail';
  exception when raise_exception then
    if sqlerrm not like 'private.no_such_policy() does not exist' then
      raise exception 'unexpected error: %', sqlerrm;
    end if;
  end;
end;
$$;

-- 2. Staged backfill: rows that existed before a migration have no value yet.
insert into auth.users (id, email)
values ('99999999-9999-4999-8999-999999999999', 'harness-helpers@example.test');
insert into public.spaces (id, owner_id, name)
values ('99999999-0000-4000-8000-000000000001',
        '99999999-9999-4999-8999-999999999999', 'Existing before the migration');

do $$
declare
  removed bigint;
  n integer;
begin
  -- The "backfill" is any idempotent statement; this one re-creates the row.
  removed := test_helpers.staged_backfill(
    'public.spaces',
    $f$ id = '99999999-0000-4000-8000-000000000001' $f$,
    $b$ insert into public.spaces (id, owner_id, name)
        select '99999999-0000-4000-8000-000000000001',
               '99999999-9999-4999-8999-999999999999', 'Backfilled'
         where not exists (
           select 1 from public.spaces
            where id = '99999999-0000-4000-8000-000000000001') $b$
  );
  if removed <> 1 then
    raise exception 'staged_backfill must report the rows it deleted (got %)', removed;
  end if;
  select count(*) into n from public.spaces
   where id = '99999999-0000-4000-8000-000000000001' and name = 'Backfilled';
  if n <> 1 then
    raise exception 'the backfill statement must have run after the delete';
  end if;

  -- Idempotent: running it again changes nothing.
  removed := test_helpers.staged_backfill(
    'public.spaces', 'false',
    $b$ insert into public.spaces (id, owner_id, name)
        select '99999999-0000-4000-8000-000000000001',
               '99999999-9999-4999-8999-999999999999', 'Again'
         where not exists (
           select 1 from public.spaces
            where id = '99999999-0000-4000-8000-000000000001') $b$
  );
  select count(*) into n from public.spaces
   where id = '99999999-0000-4000-8000-000000000001' and name = 'Backfilled';
  if removed <> 0 or n <> 1 then
    raise exception 'a backfill rerun must delete and change nothing';
  end if;
end;
$$;

-- 3. as_user acts as that person for the rest of the transaction.
do $$
declare n integer;
begin
  perform test_helpers.as_user('99999999-9999-4999-8999-999999999999');
  select count(*) into n from public.spaces;
  if n <> 1 then raise exception 'as_user must see the user''s own Space (saw %)', n; end if;
  perform set_config('role', 'postgres', true);
end;
$$;

rollback;

-- Everything above rolled back, including the redefinition.
do $$
begin
  if to_regprocedure('private.harness_probe_policy()') is not null then
    raise exception 'the probe policy function must not survive the rollback';
  end if;
end;
$$;

\echo harness-helpers: all checks passed
