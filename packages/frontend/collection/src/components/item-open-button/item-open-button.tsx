'use client';

import { useCollectionNavigation } from '../../providers';

type ItemOpenButtonProps = {
  title: string;
  onOpen: () => void;
  /** Where the item opens. With it the title is a link and navigates by itself; `onOpen` is not called. */
  href?: string;
};

/**
 * The item's title, as the button or link that opens it. `open-overlay`
 * stretches its hit area over the whole card or row, so the menu and pin sit
 * above it.
 */
export function ItemOpenButton({ title, onOpen, href }: ItemOpenButtonProps) {
  const { Link } = useCollectionNavigation();
  const label = (
    <span className="block truncate text-sm font-medium text-foreground">
      {title}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="open-overlay">
        {label}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onOpen} className="open-overlay">
      {label}
    </button>
  );
}
