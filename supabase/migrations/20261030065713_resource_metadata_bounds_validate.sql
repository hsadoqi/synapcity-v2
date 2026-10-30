-- Proves the rows that existed before resource_metadata_bounds against its
-- constraints (VALIDATE CONSTRAINT scans each table once, under a lock that
-- does not block reads or writes). It merges and runs only after a read-only
-- check on the target database showed no violating row: counts and lengths
-- only, never row contents. If one exists the owner decides per row; nothing is
-- truncated or rewritten here. On a database with no violating row this is a
-- no-op beyond marking the constraints validated.

begin;

alter table public.spaces validate constraint spaces_name_length;
alter table public.spaces validate constraint spaces_description_length;
alter table public.spaces validate constraint spaces_icon_length;
alter table public.spaces validate constraint spaces_tags_valid;
alter table public.documents validate constraint documents_name_length;
alter table public.documents validate constraint documents_description_length;
alter table public.documents validate constraint documents_icon_length;
alter table public.documents validate constraint documents_tags_valid;
alter table public.dashboards validate constraint dashboards_name_length;
alter table public.dashboards validate constraint dashboards_description_length;
alter table public.dashboards validate constraint dashboards_icon_length;
alter table public.dashboards validate constraint dashboards_tags_valid;
alter table public.space_documents validate constraint space_documents_position_nonnegative;
alter table public.space_dashboards validate constraint space_dashboards_position_nonnegative;

commit;
