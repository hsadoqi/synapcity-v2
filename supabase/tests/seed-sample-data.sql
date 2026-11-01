-- Regression checks for the development seed (supabase/seed.sql): sample
-- documents, dashboards and Space participation. Run only on a disposable local
-- database after applying the migrations, as the database administrator, from
-- the repository root (the seed is loaded with \i, relative to it):
-- psql -X -v ON_ERROR_STOP=1 -f supabase/tests/seed-sample-data.sql <local-connection>
-- All synthetic users and records below are rolled back. No pgTAP dependency.
\set ON_ERROR_STOP on

begin;

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'seed-test-a@example.test'),
  ('22222222-2222-4222-8222-222222222222', 'seed-test-b@example.test'),
  ('33333333-3333-4333-8333-333333333333', 'seed-test-c@example.test');

-- User C already has a document of their own, so the seed must leave them alone.
insert into public.documents (id, owner_id, name) values
  ('cccccccc-0000-4000-8000-00000000000c', '33333333-3333-4333-8333-333333333333', 'Mine');

\i supabase/seed.sql

create temporary table seed_counts as
select
  (select count(*) from public.spaces) as spaces,
  (select count(*) from public.documents) as documents,
  (select count(*) from public.dashboards) as dashboards,
  (select count(*) from public.space_documents) as space_documents,
  (select count(*) from public.space_dashboards) as space_dashboards;

do $$
declare
  u uuid;
  n integer;
begin
  -- Users A and B each get documents and dashboards of their own, and starter
  -- Spaces to put them in.
  foreach u in array array[
    '11111111-1111-4111-8111-111111111111'::uuid,
    '22222222-2222-4222-8222-222222222222'::uuid
  ] loop
    select count(*) into n from public.documents where owner_id = u;
    if n < 2 then
      raise exception 'user % has % sample documents, expected at least 2', u, n;
    end if;
    select count(*) into n from public.dashboards where owner_id = u;
    if n < 2 then
      raise exception 'user % has % sample dashboards, expected at least 2', u, n;
    end if;

    -- Writing holds items of both kinds; Personal stays empty so development
    -- shows an empty Space as well as a populated one.
    select count(*) into n from public.space_documents sd
      join public.spaces s on s.id = sd.space_id
      where s.owner_id = u and s.name = 'Writing';
    if n < 1 then raise exception 'user % has no documents in Writing', u; end if;
    select count(*) into n from public.space_dashboards sd
      join public.spaces s on s.id = sd.space_id
      where s.owner_id = u and s.name = 'Writing';
    if n < 1 then raise exception 'user % has no dashboards in Writing', u; end if;

    select count(*) into n from (
      select sd.space_id from public.space_documents sd
        join public.spaces s on s.id = sd.space_id
        where s.owner_id = u and s.name = 'Personal'
      union all
      select sd.space_id from public.space_dashboards sd
        join public.spaces s on s.id = sd.space_id
        where s.owner_id = u and s.name = 'Personal'
    ) personal;
    if n <> 0 then
      raise exception 'user % has % items in Personal, expected none', u, n;
    end if;
  end loop;

  -- Every participation row is owned by the owner of both the Space and the item.
  select count(*) into n from public.space_documents sd
    join public.spaces s on s.id = sd.space_id
    join public.documents d on d.id = sd.document_id
    where sd.owner_id <> s.owner_id or sd.owner_id <> d.owner_id;
  if n <> 0 then raise exception '% document participation rows have a mismatched owner', n; end if;
  select count(*) into n from public.space_dashboards sd
    join public.spaces s on s.id = sd.space_id
    join public.dashboards d on d.id = sd.dashboard_id
    where sd.owner_id <> s.owner_id or sd.owner_id <> d.owner_id;
  if n <> 0 then raise exception '% dashboard participation rows have a mismatched owner', n; end if;

  -- The seed inserts Dashboards only; the triggers give each one its
  -- composition at revision 1 and its first revision.
  select count(*) into n from public.dashboards d
    where (select count(*) from public.dashboard_compositions c
            where c.dashboard_id = d.id and c.revision = 1) <> 1
       or (select count(*) from public.dashboard_revisions r
            where r.dashboard_id = d.id) <> 1;
  if n <> 0 then
    raise exception '% seeded dashboards lack one composition at revision 1 and one revision', n;
  end if;

  -- User C had a document already, so the seed adds nothing for them.
  select count(*) into n from public.documents
    where owner_id = '33333333-3333-4333-8333-333333333333';
  if n <> 1 then raise exception 'user C has % documents, expected only their own', n; end if;
  select count(*) into n from public.dashboards
    where owner_id = '33333333-3333-4333-8333-333333333333';
  if n <> 0 then raise exception 'user C has % dashboards, expected none', n; end if;
end
$$;

-- Running the seed again adds nothing.
\i supabase/seed.sql

do $$
declare
  before_run seed_counts%rowtype;
begin
  select * into before_run from seed_counts;
  if (select count(*) from public.spaces) <> before_run.spaces
     or (select count(*) from public.documents) <> before_run.documents
     or (select count(*) from public.dashboards) <> before_run.dashboards
     or (select count(*) from public.space_documents) <> before_run.space_documents
     or (select count(*) from public.space_dashboards) <> before_run.space_dashboards
  then
    raise exception 'running the seed a second time changed the data';
  end if;
end
$$;

rollback;

\echo Seed sample data SQL checks passed (all synthetic data rolled back).
