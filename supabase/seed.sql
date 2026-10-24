-- Development sample data. Spaces mirror SPACE_FIXTURES in
-- apps/web/src/features/spaces/lib/fixtures/spaces/spaces.ts; documents,
-- dashboards and where they take part (ADR-0013) give those Spaces something
-- to show.
--
-- Everything is owner-scoped (owner_id references auth.users), so this gives
-- every existing user a starter set. Each part adds nothing for a user who
-- already has data of that kind, and nothing at all when there are no users
-- yet, so it is safe to run more than once. Sign up first, then run
-- `supabase db reset` locally or run this file against the dev database.
-- The Personal Space is left empty on purpose, so development shows an empty
-- Space as well as populated ones.
--
-- Do not run against a production database.

insert into public.spaces (owner_id, name, description, icon, tags)
select
  u.id,
  sample.name,
  sample.description,
  sample.icon,
  sample.tags
from auth.users as u
cross join (
  values
    (
      'Writing',
      'Ideas, drafts, and reference material for writing.',
      'pen-line',
      array['writing', 'ideas']::text[]
    ),
    (
      'Learning',
      'Notes and resources for things I want to understand.',
      'book-open',
      array['learning']::text[]
    ),
    (
      'Personal',
      null,
      'house',
      array[]::text[]
    )
) as sample (name, description, icon, tags)
where not exists (
  select 1 from public.spaces as existing where existing.owner_id = u.id
);

-- Sample documents and dashboards, and their participation in the starter
-- Spaces, for users who have neither a document nor a dashboard yet. One
-- block per user keeps the two kinds and their placement together. A Space the
-- user does not have (they made their own) simply gets nothing placed in it.
do $$
declare
  u record;
  writing_id uuid;
  learning_id uuid;
  outline_id uuid;
  draft_id uuid;
  reading_id uuid;
  progress_id uuid;
  study_id uuid;
begin
  for u in
    select au.id
    from auth.users as au
    where not exists (
      select 1 from public.documents as d where d.owner_id = au.id
    )
    and not exists (
      select 1 from public.dashboards as b where b.owner_id = au.id
    )
  loop
    insert into public.documents (owner_id, name, description, icon, tags)
    values (u.id, 'Outline', 'The shape of the piece, one heading at a time.', 'file-text', array['writing']::text[])
    returning id into outline_id;
    insert into public.documents (owner_id, name, description, icon, tags)
    values (u.id, 'First draft', 'Rough pages to come back to.', 'notebook-pen', array['writing']::text[])
    returning id into draft_id;
    insert into public.documents (owner_id, name, description, icon, tags)
    values (u.id, 'Reading notes', 'Quotes and ideas from what I am reading.', 'book-open', array['learning']::text[])
    returning id into reading_id;
    -- In no Space yet, to show an item that is not filed anywhere.
    insert into public.documents (owner_id, name, description, icon, tags)
    values (u.id, 'Loose thought', 'A note that is not in any Space yet.', 'lightbulb', array[]::text[]);

    insert into public.dashboards (owner_id, name, description, icon, tags)
    values (u.id, 'Writing progress', 'Pages written and drafts finished.', 'chart-line', array['writing']::text[])
    returning id into progress_id;
    insert into public.dashboards (owner_id, name, description, icon, tags)
    values (u.id, 'Study plan', 'What to learn next, and how it is going.', 'layout-dashboard', array['learning']::text[])
    returning id into study_id;

    select s.id into writing_id from public.spaces as s
      where s.owner_id = u.id and s.name = 'Writing' limit 1;
    select s.id into learning_id from public.spaces as s
      where s.owner_id = u.id and s.name = 'Learning' limit 1;

    if writing_id is not null then
      insert into public.space_documents (space_id, document_id, owner_id)
      values (writing_id, outline_id, u.id), (writing_id, draft_id, u.id);
      insert into public.space_dashboards (space_id, dashboard_id, owner_id)
      values (writing_id, progress_id, u.id);
    end if;
    if learning_id is not null then
      insert into public.space_documents (space_id, document_id, owner_id)
      values (learning_id, reading_id, u.id);
      insert into public.space_dashboards (space_id, dashboard_id, owner_id)
      values (learning_id, study_id, u.id);
    end if;
  end loop;
end
$$;
