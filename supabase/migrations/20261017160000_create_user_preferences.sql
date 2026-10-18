-- ADR-0010: account-scope preferences, one row per user.
-- Applied with `supabase db push` (ADR-0010, section 5), after the owner has
-- linked the project and run `supabase db push --dry-run`.

-- 1. Table. user_id mirrors auth.users, so there is no generated key.
--    `preferences` holds the account sections of the app's settings schema,
--    which the app validates on every write; the database checks only that it
--    is a JSON object of bounded size. `device_timezone` is the last zone a
--    signed-in browser reported, for server work when the chosen timezone is
--    'system' (follow the device).
create table public.user_preferences (
  user_id         uuid primary key references auth.users (id) on delete cascade,
  preferences     jsonb not null default '{}'::jsonb,
  schema_version  smallint not null default 1,
  device_timezone text,
  updated_at      timestamptz not null default now(),
  constraint user_preferences_is_object check (jsonb_typeof(preferences) = 'object'),
  constraint user_preferences_size check (pg_column_size(preferences) <= 16384),
  constraint user_preferences_schema_version check (schema_version >= 1),
  constraint user_preferences_device_timezone_length check (
    device_timezone is null or char_length(device_timezone) <= 64
  )
);

-- 2. RLS: owner only. Rows are created on a person's first save, not at
--    signup, so there is an INSERT policy; there is no DELETE policy (rows go
--    with their auth.users row).
alter table public.user_preferences enable row level security;

create policy user_preferences_select_own on public.user_preferences
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy user_preferences_insert_own on public.user_preferences
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy user_preferences_update_own on public.user_preferences
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- 3. Explicit grants, least privilege. anon gets nothing; signed-in users may
--    write only the columns the app sends. UPDATE includes user_id because an
--    upsert (insert ... on conflict do update) sets every column it inserts;
--    the policy's WITH CHECK still pins it to the caller's own id.
revoke all on public.user_preferences from anon, authenticated;
grant select on public.user_preferences to authenticated;
grant insert (user_id, preferences, schema_version, device_timezone)
  on public.user_preferences to authenticated;
grant update (user_id, preferences, schema_version, device_timezone)
  on public.user_preferences to authenticated;

-- 4. Keep updated_at honest, with the function the profiles migration created.
create trigger user_preferences_set_updated_at
  before update on public.user_preferences
  for each row execute function public.set_updated_at();
