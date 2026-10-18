-- Owner-scoped "pinned" and "last viewed" state for Spaces, Documents and
-- Dashboards. Drafted at the owner's request; NOT applied by repository tooling.
-- Review and apply separately.
--
-- pinned_at       Global pin, independent of the per-Space `pinned` flag on the
--                 participation rows (ADR-0013). null means not pinned.
-- last_viewed_at  When the owner last opened the item. null means never opened;
--                 readers fall back to updated_at for ordering.
--
-- Both are nullable, so no existing row or insert changes.

begin;

alter table public.spaces
  add column pinned_at timestamptz,
  add column last_viewed_at timestamptz;

alter table public.documents
  add column pinned_at timestamptz,
  add column last_viewed_at timestamptz;

alter table public.dashboards
  add column pinned_at timestamptz,
  add column last_viewed_at timestamptz;

-- Clients may touch these two columns but may not choose their values: any
-- change to a non-null value is replaced by the server clock, the same
-- guarantee the other timestamps have. Clearing a value to null is allowed
-- (unpin).
create function public.stamp_user_state()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.pinned_at is distinct from old.pinned_at and new.pinned_at is not null then
    new.pinned_at = now();
  end if;
  if new.last_viewed_at is distinct from old.last_viewed_at
     and new.last_viewed_at is not null then
    new.last_viewed_at = now();
  end if;
  return new;
end;
$$;

create trigger spaces_stamp_user_state
  before update on public.spaces
  for each row execute function public.stamp_user_state();
create trigger documents_stamp_user_state
  before update on public.documents
  for each row execute function public.stamp_user_state();
create trigger dashboards_stamp_user_state
  before update on public.dashboards
  for each row execute function public.stamp_user_state();

-- Opening or pinning an item is not editing it. updated_at must keep meaning
-- "the content changed", or viewing a Space would reorder "Recently updated".
-- Recreate the existing triggers so they fire only when content columns change.
drop trigger spaces_set_updated_at on public.spaces;
create trigger spaces_set_updated_at
  before update on public.spaces
  for each row
  when (
    old.name is distinct from new.name
    or old.description is distinct from new.description
    or old.icon is distinct from new.icon
    or old.tags is distinct from new.tags
  )
  execute function public.set_updated_at();

drop trigger documents_set_updated_at on public.documents;
create trigger documents_set_updated_at
  before update on public.documents
  for each row
  when (
    old.name is distinct from new.name
    or old.description is distinct from new.description
    or old.icon is distinct from new.icon
    or old.tags is distinct from new.tags
  )
  execute function public.set_updated_at();

drop trigger dashboards_set_updated_at on public.dashboards;
create trigger dashboards_set_updated_at
  before update on public.dashboards
  for each row
  when (
    old.name is distinct from new.name
    or old.description is distinct from new.description
    or old.icon is distinct from new.icon
    or old.tags is distinct from new.tags
  )
  execute function public.set_updated_at();

-- Column grants are additive to the existing update grants. The existing
-- owner-only UPDATE policies on each table already cover these columns.
grant update (pinned_at, last_viewed_at) on public.spaces to authenticated;
grant update (pinned_at, last_viewed_at) on public.documents to authenticated;
grant update (pinned_at, last_viewed_at) on public.dashboards to authenticated;

commit;
