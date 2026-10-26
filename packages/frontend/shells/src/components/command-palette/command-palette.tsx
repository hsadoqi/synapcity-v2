'use client';

import { useEffect } from 'react';

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@synapcity/frontend-ui/core/command';

type IconComponent = React.ComponentType<{ className?: string }>;

/** One entry: somewhere to go, or something to do. */
export type CommandPaletteItem = {
  label: string;
  /** Where choosing it leads; the host's `onNavigate` goes there. */
  href?: string;
  /** Runs instead of navigating, such as opening a create dialog. */
  onSelect?: () => void;
  icon?: IconComponent;
};

export type CommandPaletteGroup = {
  heading: string;
  items: CommandPaletteItem[];
};

/**
 * A searchable list of places and actions in a dialog. ⌘K or Ctrl+K toggles
 * it. The host supplies the groups and how to navigate (its router), so the
 * palette knows nothing about routes or records.
 */
export function CommandPalette({
  open,
  onOpenChange,
  groups,
  onNavigate,
  search,
  onSearchChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: CommandPaletteGroup[];
  onNavigate: (href: string) => void;
  /** The search text, when the host wants to set it, such as from a search field. */
  search?: string;
  onSearchChange?: (search: string) => void;
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  const choose = (item: CommandPaletteItem) => {
    onOpenChange(false);
    if (item.href !== undefined) onNavigate(item.href);
    else item.onSelect?.();
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <Command>
        <CommandInput
          placeholder="Search or jump to…"
          value={search}
          onValueChange={onSearchChange}
        />
        <CommandList>
          <CommandEmpty>Nothing matches.</CommandEmpty>
          {groups
            .filter((group) => group.items.length > 0)
            .map((group) => (
              <CommandGroup key={group.heading} heading={group.heading}>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <CommandItem
                      key={`${group.heading}:${item.label}:${item.href ?? ''}`}
                      // Unique per group, and the heading makes a search for
                      // "spaces" bring up every Space.
                      value={`${group.heading}:${item.label}:${item.href ?? ''}`}
                      keywords={[item.label, group.heading]}
                      onSelect={() => choose(item)}
                    >
                      {Icon && <Icon />}
                      {item.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
