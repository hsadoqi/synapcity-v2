'use client';

import {
  DropdownMenuCheckboxItem,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@synapcity/frontend-ui/core/dropdown-menu';

type CollectionFilterMenuProps = {
  /** Submenu trigger text, e.g. "Space". */
  label: string;
  items: string[];
  selected: string[];
  onToggle: (item: string, checked: boolean) => void;
};

export function CollectionFilterMenu({
  label,
  items,
  selected,
  onToggle,
}: CollectionFilterMenuProps) {
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>{label}</DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="w-48">
        <DropdownMenuGroup>
          {items.map((item) => (
            <DropdownMenuCheckboxItem
              key={item}
              checked={selected.includes(item)}
              onCheckedChange={(checked) => onToggle(item, checked)}
            >
              <span className="truncate">{item}</span>
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
