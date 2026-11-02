import { RootSidebarItem } from '@synapcity/frontend-shells';
import { COLLECTIONS } from '../collections';

/** One record in its collection's section: a link, or shown disabled while its page is not built. */
export function recordItem(
  userId: string,
  record: { id: string; name: string },
  collection: (typeof COLLECTIONS)[number],
  pathname: string,
): RootSidebarItem {
  if (!collection.itemHref) {
    return { title: record.name, icon: collection.icon, disabled: true };
  }
  const href = collection.itemHref(userId, record.id);
  return {
    title: record.name,
    href,
    icon: collection.icon,
    isActive: href === pathname,
  };
}

/** Whether the page at `pathname` is `href` or a page under it. */
export const within = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);
