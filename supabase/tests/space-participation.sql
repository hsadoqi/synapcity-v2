-- Behavioral regression checks for ADR-0013's Space participation records
-- and standalone Space deletion. Run only on a disposable local database after
-- applying the migrations, as the database administrator:
-- psql -X -v ON_ERROR_STOP=1 -f supabase/tests/space-participation.sql <local-connection>
-- Both participation tables share one contract, so each check runs per kind.
-- All synthetic users and records below are rolled back. No pgTAP dependency.
\set ON_ERROR_STOP on

begin;

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'participation-test-a@example.test'),
  ('22222222-2222-4222-8222-222222222222', 'participation-test-b@example.test');

-- Owner A: Spaces A1 and A2, one document and one dashboard each.
-- Owner B: Space B1, one document and one dashboard each.
insert into public.spaces (id, owner_id, name) values
  ('a1a1a1a1-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'A1'),
  ('a2a2a2a2-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'A2'),
  ('b1b1b1b1-0000-4000-8000-000000000003', '22222222-2222-4222-8222-222222222222', 'B1');
insert into public.documents (id, owner_id, name) values
  ('dddddddd-0000-4000-8000-00000000000a', '11111111-1111-4111-8111-111111111111', 'Doc A'),
  ('dddddddd-0000-4000-8000-00000000000b', '22222222-2222-4222-8222-222222222222', 'Doc B');
insert into public.dashboards (id, owner_id, name) values
  ('dddddddd-0000-4000-8000-00000000000a', '11111111-1111-4111-8111-111111111111', 'Dash A'),
  ('dddddddd-0000-4000-8000-00000000000b', '22222222-2222-4222-8222-222222222222', 'Dash B');
insert into public.space_documents (space_id, document_id, owner_id) values
  ('b1b1b1b1-0000-4000-8000-000000000003', 'dddddddd-0000-4000-8000-00000000000b',
   '22222222-2222-4222-8222-222222222222');
insert into public.space_dashboards (space_id, dashboard_id, owner_id) values
  ('b1b1b1b1-0000-4000-8000-000000000003', 'dddddddd-0000-4000-8000-00000000000b',
   '22222222-2222-4222-8222-222222222222');

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);

do $$
declare
  kind text;
  t text;
  item_col text;
  item_table text;
  r record;
  n integer;
  changed integer;
  column_name text;
  a_item constant uuid := 'dddddddd-0000-4000-8000-00000000000a';
  b_item constant uuid := 'dddddddd-0000-4000-8000-00000000000b';
  a1 constant uuid := 'a1a1a1a1-0000-4000-8000-000000000001';
  a2 constant uuid := 'a2a2a2a2-0000-4000-8000-000000000002';
  b1 constant uuid := 'b1b1b1b1-0000-4000-8000-000000000003';
begin
  foreach kind in array array['document', 'dashboard'] loop
    t := format('space_%ss', kind);
    item_col := format('%s_id', kind);
    item_table := format('%ss', kind);

    execute format('select count(*) from public.%I', t) into n;
    if n <> 0 then
      raise exception '%: RLS must hide another owner''s participation rows', t;
    end if;

    -- One item may participate in many Spaces.
    execute format('insert into public.%I (space_id, %I) values (%L, %L) returning *',
      t, item_col, a1, a_item) into r;
    if r.owner_id <> auth.uid() or r.pinned or r.position is not null or r.added_at is null then
      raise exception '%: participation defaults must supply owner, presentation and added_at', t;
    end if;
    execute format('insert into public.%I (space_id, %I) values (%L, %L)', t, item_col, a2, a_item);
    execute format('select count(*) from public.%I where %I = %L', t, item_col, a_item) into n;
    if n <> 2 then
      raise exception '%: an item must be able to participate in several Spaces', t;
    end if;

    -- But only once per Space.
    begin
      execute format('insert into public.%I (space_id, %I) values (%L, %L)', t, item_col, a1, a_item);
      raise exception '%: duplicate participation in one Space must be refused', t;
    exception when unique_violation then null;
    end;

    -- Both ends must be the caller's own.
    begin
      execute format('insert into public.%I (space_id, %I) values (%L, %L)', t, item_col, b1, a_item);
      raise exception '%: placing an item in another owner''s Space must be refused', t;
    exception when insufficient_privilege then null;
    end;
    begin
      execute format('insert into public.%I (space_id, %I) values (%L, %L)', t, item_col, a1, b_item);
      raise exception '%: placing another owner''s item in a Space must be refused', t;
    exception when insufficient_privilege then null;
    end;
    begin
      execute format('insert into public.%I (space_id, %I, owner_id) values (%L, %L, %L)',
        t, item_col, a2, a_item, '22222222-2222-4222-8222-222222222222');
      raise exception '%: an explicit forged owner must be refused', t;
    exception when insufficient_privilege then null;
    end;

    -- Per-Space presentation is editable; the pair and metadata are not.
    execute format('update public.%I set pinned = true, position = 3
                    where space_id = %L and %I = %L', t, a1, item_col, a_item);
    get diagnostics changed = row_count;
    if changed <> 1 then
      raise exception '%: owners must be able to change per-Space presentation', t;
    end if;
    execute format('select count(*) from public.%I where pinned', t) into n;
    if n <> 1 then
      raise exception '%: presentation must apply to one Space only', t;
    end if;
    foreach column_name in array array['space_id', item_col, 'owner_id', 'added_at'] loop
      if has_column_privilege(format('public.%I', t), column_name, 'UPDATE') then
        raise exception '%: column % must not be client-updatable', t, column_name;
      end if;
    end loop;
    foreach column_name in array array['owner_id', 'added_at'] loop
      if has_column_privilege(format('public.%I', t), column_name, 'INSERT') then
        raise exception '%: column % must not be client-insertable', t, column_name;
      end if;
    end loop;

    -- Removing from a Space is not deleting the item.
    execute format('delete from public.%I where space_id = %L and %I = %L', t, a2, item_col, a_item);
    get diagnostics changed = row_count;
    execute format('select count(*) from public.%I where id = %L', item_table, a_item) into n;
    if changed <> 1 or n <> 1 then
      raise exception '%: removing from a Space must keep the item', t;
    end if;
  end loop;

  -- Deleting a Space removes its participation rows and keeps the content.
  delete from public.spaces where id = a1;
  get diagnostics changed = row_count;
  if changed <> 1 then
    raise exception 'Owners must be able to delete their own Space';
  end if;
  if exists (select 1 from public.space_documents where space_id = a1)
     or exists (select 1 from public.space_dashboards where space_id = a1) then
    raise exception 'Deleting a Space must remove its participation rows';
  end if;
  if not exists (select 1 from public.documents where id = a_item)
     or not exists (select 1 from public.dashboards where id = a_item) then
    raise exception 'Deleting a Space must not delete its documents or dashboards';
  end if;

  -- Deleting an item removes its participation in every Space.
  insert into public.space_documents (space_id, document_id) values (a2, a_item);
  insert into public.space_dashboards (space_id, dashboard_id) values (a2, a_item);
  delete from public.documents where id = a_item;
  delete from public.dashboards where id = a_item;
  if exists (select 1 from public.space_documents where document_id = a_item)
     or exists (select 1 from public.space_dashboards where dashboard_id = a_item) then
    raise exception 'Deleting an item must remove its participation rows';
  end if;

  -- Another owner's participation rows cannot be changed or removed.
  update public.space_documents set pinned = true where space_id = b1;
  get diagnostics changed = row_count;
  if changed <> 0 then
    raise exception 'RLS must prevent updating another owner''s participation';
  end if;
  delete from public.space_dashboards where space_id = b1;
  get diagnostics changed = row_count;
  if changed <> 0 then
    raise exception 'RLS must prevent removing another owner''s participation';
  end if;
end;
$$;

reset role;
set local role anon;
do $$
begin
  begin
    perform 1 from public.space_documents;
    raise exception 'Anonymous participation reads must be refused';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from public.spaces;
    raise exception 'Anonymous Space deletion must be refused';
  exception when insufficient_privilege then null;
  end;
end;
$$;

reset role;
do $$
begin
  if (select count(*) from public.space_documents) <> 1
     or (select count(*) from public.space_dashboards) <> 1 then
    raise exception 'Owner B''s participation rows must be untouched';
  end if;
end;
$$;
delete from auth.users where id = '22222222-2222-4222-8222-222222222222';
do $$
begin
  if exists (select 1 from public.space_documents)
     or exists (select 1 from public.space_dashboards) then
    raise exception 'Account deletion must remove the account''s participation rows';
  end if;
end;
$$;

rollback;
\echo 'Space participation SQL behavior checks passed (all synthetic data rolled back).'
