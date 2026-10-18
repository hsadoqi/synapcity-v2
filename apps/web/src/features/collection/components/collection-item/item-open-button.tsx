'use client';

type ItemOpenButtonProps = {
  title: string;
  onOpen: () => void;
};

/**
 * The item's title, as the button that opens it. `open-overlay` stretches its
 * hit area over the whole card or row, so the menu and pin sit above it.
 */
export function ItemOpenButton({ title, onOpen }: ItemOpenButtonProps) {
  return (
    <button type="button" onClick={onOpen} className="open-overlay">
      <span className="block truncate text-sm font-medium text-foreground">
        {title}
      </span>
    </button>
  );
}
