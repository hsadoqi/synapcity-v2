-- Growth monitoring for the risk acceptances on unbounded per-account growth
-- (resources, Dashboard revisions, activity events, Document content). Count
-- and size only: it never reads a row's contents. Run monthly, and before each
-- release train, as the operator, against the target database:
--
--   psql -X -f scripts/db-growth.sql "$DATABASE_URL"
--
-- Tables a later release adds are included when they exist, so the same file
-- serves every train. The thresholds that trigger an owner review are in
-- docs/engineering/database-release.md.

\echo == Table row counts and total size (table, indexes and TOAST)
select t.name as relation,
       (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from %s', t.name), false, true, '')))[1]::text::bigint as row_count,
       pg_size_pretty(pg_total_relation_size(t.name::regclass)) as total_size,
       pg_total_relation_size(t.name::regclass) as total_bytes
  from (values
          ('public.spaces'), ('public.documents'), ('public.dashboards'),
          ('public.dashboard_compositions'), ('public.dashboard_revisions'),
          ('public.space_documents'), ('public.space_dashboards'),
          ('public.activity_events'), ('public.document_contents'),
          ('public.document_revisions'), ('public.storage_cleanup_queue')
       ) as t(name)
 where to_regclass(t.name) is not null
 order by total_bytes desc;

\echo == Per owner: resources and revisions (median, 99th percentile, maximum)
with per_owner as (
  select owner_id, 'spaces' as kind, count(*) as n from public.spaces group by owner_id
  union all select owner_id, 'documents', count(*) from public.documents group by owner_id
  union all select owner_id, 'dashboards', count(*) from public.dashboards group by owner_id
  union all select owner_id, 'dashboard_revisions', count(*) from public.dashboard_revisions group by owner_id
)
select kind,
       count(*) as owners,
       percentile_cont(0.5) within group (order by n) as p50,
       percentile_cont(0.99) within group (order by n) as p99,
       max(n) as max
  from per_owner
 group by kind
 order by kind;

\echo == Largest revision footprint per Dashboard (bytes of composition text)
select max(total_bytes) as max_dashboard_bytes,
       percentile_cont(0.5) within group (order by total_bytes) as p50_dashboard_bytes,
       max(revisions) as max_revisions_one_dashboard
  from (
    select dashboard_id, sum(content_bytes) as total_bytes, count(*) as revisions
      from public.dashboard_revisions
     group by dashboard_id
  ) per_dashboard;

\echo == Activity events per owner, when the table exists
select case when to_regclass('public.activity_events') is null then 'activity_events: not present yet'
            else (xpath('/row/c/text()', query_to_xml(
                   'select coalesce(max(n), 0) as c from (select count(*) as n from public.activity_events group by owner_id) t',
                   false, true, '')))[1]::text end as max_events_one_owner;
