-- Resource metadata bounds (owner decision D5; database release 1, beside
-- composition_integrity / dashboard_revisions / composition_initialization).
-- Spaces, Documents and Dashboards get the same limits in forms, Server
-- Actions and the database, so a direct Data API writer is answered like the
-- app:
--
--   name         at most 120 characters (the existing check keeps it non-blank)
--   description  at most 2,000 characters
--   icon         at most 64 characters (the existing check keeps its shape)
--   tags         at most 20; each 1 to 50 characters, equal to its own btrim()
--                (the app trims; the database refuses an untrimmed tag rather
--                than store it); no two equal ignoring case
--   position     null, or 0 or more, on both participation tables
--
-- "Characters" are code points (char_length), as the shared zod schemas count
-- them. There is no cap on tags across a person's records.
--
-- The constraints are added NOT VALID: they apply to every new write and update
-- at once, and do not scan or reject rows that already exist. The next
-- migration (resource_metadata_bounds_validate) proves the existing rows with
-- VALIDATE, after a read-only count shows no violator. Nothing is truncated.

begin;

-- A pure boolean on the tag array, kept in a function because a CHECK cannot
-- hold a subquery. It reads no table, so SECURITY INVOKER with an empty
-- search_path is enough. Clients can call it; the advisor will list it, and it
-- is harmless (it only answers about the array it is given).
create function public.resource_tags_valid(p_tags text[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(cardinality(p_tags), 0) <= 20
     and not exists (
       select 1
         from unnest(p_tags) as t(tag)
        where tag is null
           or tag <> btrim(tag)
           or char_length(tag) < 1
           or char_length(tag) > 50
     )
     and (select count(distinct lower(tag)) from unnest(p_tags) as t(tag))
         = coalesce(cardinality(p_tags), 0)
$$;

revoke execute on function public.resource_tags_valid(text[]) from public, anon;
grant execute on function public.resource_tags_valid(text[]) to authenticated;

alter table public.spaces
  add constraint spaces_name_length
    check (char_length(name) <= 120) not valid,
  add constraint spaces_description_length
    check (description is null or char_length(description) <= 2000) not valid,
  add constraint spaces_icon_length
    check (char_length(icon) <= 64) not valid,
  add constraint spaces_tags_valid
    check (public.resource_tags_valid(tags)) not valid;

alter table public.documents
  add constraint documents_name_length
    check (char_length(name) <= 120) not valid,
  add constraint documents_description_length
    check (description is null or char_length(description) <= 2000) not valid,
  add constraint documents_icon_length
    check (char_length(icon) <= 64) not valid,
  add constraint documents_tags_valid
    check (public.resource_tags_valid(tags)) not valid;

alter table public.dashboards
  add constraint dashboards_name_length
    check (char_length(name) <= 120) not valid,
  add constraint dashboards_description_length
    check (description is null or char_length(description) <= 2000) not valid,
  add constraint dashboards_icon_length
    check (char_length(icon) <= 64) not valid,
  add constraint dashboards_tags_valid
    check (public.resource_tags_valid(tags)) not valid;

alter table public.space_documents
  add constraint space_documents_position_nonnegative
    check (position is null or position >= 0) not valid;

alter table public.space_dashboards
  add constraint space_dashboards_position_nonnegative
    check (position is null or position >= 0) not valid;

commit;
