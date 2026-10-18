-- ADR-0010: measure the preferences document by its text, not its storage.
-- pg_column_size reports the stored size, which Postgres may compress, so a
-- highly repetitive document well over 16 KB could pass the original check.
-- octet_length of the JSON text is the size the app actually sends and reads.

alter table public.user_preferences
  drop constraint user_preferences_size;

alter table public.user_preferences
  add constraint user_preferences_size
  check (octet_length(preferences::text) <= 16384);
