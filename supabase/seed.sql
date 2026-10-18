-- Development sample data. Mirrors SPACE_FIXTURES in
-- apps/web/src/features/spaces/lib/fixtures/spaces/spaces.ts.
--
-- Spaces are owner-scoped (owner_id references auth.users), so this gives
-- every existing user a starter set. It adds nothing for a user who already
-- has spaces, and nothing at all when there are no users yet, so it is safe to
-- run more than once. Sign up first, then run `supabase db reset` locally or
-- run this file against the dev database.
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
