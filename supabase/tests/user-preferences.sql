-- user_preferences (ADR-0010): owner-only rows created on first save, a JSON
-- object of bounded size measured by its text, and the version check as it is
-- today (V-12: only a lower bound; the application validates the contents).
-- Run through `pnpm db:test`. Rolled back.
\set ON_ERROR_STOP on

begin;

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'prefs-a@example.test'),
  ('22222222-2222-4222-8222-222222222222', 'prefs-b@example.test');
insert into public.user_preferences (user_id, preferences)
values ('22222222-2222-4222-8222-222222222222', '{"theme":"dark"}');

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);

do $$
declare
  n integer;
  changed integer;
  padded text;
begin
  select count(*) into n from public.user_preferences;
  if n <> 0 then raise exception 'a user must not see another user''s preferences (saw %)', n; end if;

  -- First save inserts the caller's own row; the row is theirs.
  insert into public.user_preferences (user_id, preferences) values (auth.uid(), '{"theme":"light"}');
  select count(*) into n from public.user_preferences;
  if n <> 1 then raise exception 'the caller must see their own row'; end if;

  -- Cannot create or take over a row for someone else.
  begin
    insert into public.user_preferences (user_id, preferences)
    values ('33333333-3333-4333-8333-333333333333', '{}');
    raise exception 'inserting for another user must fail';
  exception when insufficient_privilege then null;
  end;
  update public.user_preferences set preferences = '{"x":1}'
   where user_id = '22222222-2222-4222-8222-222222222222';
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'another user''s preferences must not be updatable'; end if;
  begin
    update public.user_preferences set user_id = '22222222-2222-4222-8222-222222222222'
     where user_id = auth.uid();
    raise exception 'moving a row to another user must fail';
  exception when insufficient_privilege or unique_violation then null;
  end;

  -- Updates by the owner.
  update public.user_preferences set preferences = '{"theme":"dark"}', device_timezone = 'Europe/London'
   where user_id = auth.uid();
  get diagnostics changed = row_count;
  if changed <> 1 then raise exception 'updating own preferences must write one row'; end if;

  -- The object check.
  begin
    update public.user_preferences set preferences = '[]' where user_id = auth.uid();
    raise exception 'a non-object must fail';
  exception when check_violation then null;
  end;

  -- The size check measures the text (16 KiB): {"p": "<n>"} is 9 bytes of framing plus n.
  padded := jsonb_build_object('p', repeat('a', 16384 - 9))::text;
  if octet_length(padded) <> 16384 then raise exception 'test setup: % bytes', octet_length(padded); end if;
  update public.user_preferences set preferences = padded::jsonb where user_id = auth.uid();
  get diagnostics changed = row_count;
  if changed <> 1 then raise exception '16384 bytes must be accepted'; end if;
  begin
    update public.user_preferences set preferences = jsonb_build_object('p', repeat('a', 16384 - 8))
     where user_id = auth.uid();
    raise exception '16385 bytes must be refused';
  exception when check_violation then null;
  end;
  -- Compressible content over the limit is refused too (the old check measured storage).
  begin
    update public.user_preferences set preferences = jsonb_build_object('p', repeat('abcdefgh', 4000))
     where user_id = auth.uid();
    raise exception 'a compressible 32 KB document must be refused';
  exception when check_violation then null;
  end;

  -- schema_version as it is today: at least 1, no upper bound (V-12 note).
  begin
    update public.user_preferences set schema_version = 0 where user_id = auth.uid();
    raise exception 'schema_version 0 must fail';
  exception when check_violation then null;
  end;
  update public.user_preferences set schema_version = 2 where user_id = auth.uid();
  get diagnostics changed = row_count;
  if changed <> 1 then raise exception 'schema_version 2 is accepted today (no upper bound)'; end if;

  -- device_timezone length.
  update public.user_preferences set device_timezone = repeat('z', 64) where user_id = auth.uid();
  begin
    update public.user_preferences set device_timezone = repeat('z', 65) where user_id = auth.uid();
    raise exception 'a 65-character timezone must fail';
  exception when check_violation then null;
  end;

  -- No delete.
  begin
    delete from public.user_preferences where user_id = auth.uid();
    raise exception 'a client must not delete preferences';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;

set local role anon;
do $$
begin
  begin
    perform 1 from public.user_preferences;
    raise exception 'anon must not read preferences';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;

rollback;
\echo user-preferences: all checks passed
