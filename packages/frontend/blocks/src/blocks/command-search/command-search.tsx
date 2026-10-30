'use client';

import * as React from 'react';
import {
  Undo2Icon,
  ArrowUpIcon,
  ArrowDownIcon,
  type LucideIcon,
} from 'lucide-react';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandList,
  CommandSeparator,
} from '@synapcity/frontend-ui/core/command';
import { CommandSearchButton } from './command-search-button';
import { CommandSearchGroup as SearchGroup } from './command-search-group';
import { defaultGroups } from './default-actions';
import type { CommandSearchGroup } from './types';

export type { CommandSearchGroup } from './types';

interface CommandSearchProps {
  buttonLabel?: string;
  placeholder?: string;
  emptyMessage?: string;
  showSeparators?: boolean;
  groups?: CommandSearchGroup[];
}

type Action = {
  label: string;
  /** A key name shown as text, such as `esc`. */
  shortcut?: string;
  /** Icons shown in bordered boxes, used when there is no `shortcut`. */
  icons?: LucideIcon[];
};

const defaultActions: Action[] = [
  { label: 'To close', shortcut: 'esc' },
  { label: 'To Select', icons: [Undo2Icon] },
  { label: 'To Navigate', icons: [ArrowUpIcon, ArrowDownIcon] },
];

const CommandSearch = ({
  buttonLabel = 'Search files...',
  placeholder = 'Type a command or search...',
  emptyMessage = 'No results found.',
  showSeparators = true,
  groups = defaultGroups,
}: CommandSearchProps) => {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.key === 'j' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <CommandSearchButton label={buttonLabel} onOpen={() => setOpen(true)} />
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        className="w-full max-w-lg!"
      >
        <Command>
          <CommandInput placeholder={placeholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            {groups.map((group, index) => (
              <SearchGroup
                key={group.heading}
                showSeparators={showSeparators}
                heading={group.heading}
                items={group.items}
                last={index === groups.length - 1}
                onClose={() => setOpen(false)}
              />
            ))}
          </CommandList>
          <CommandSeparator />
          <CommandSearchActions actions={defaultActions} />
        </Command>
      </CommandDialog>
    </div>
  );
};

export default CommandSearch;

const CommandSearchActions = ({ actions }: { actions: Action[] }) => (
  <div className="flex flex-wrap items-center gap-4 p-4 text-muted-foreground">
    {actions.map(({ label, shortcut, icons = [] }) =>
      shortcut ? (
        <div key={label} className="flex flex-1 items-center gap-2">
          <kbd className="rounded border px-1 text-sm">{shortcut}</kbd>
          <span>{label}</span>
        </div>
      ) : (
        <div key={label} className="flex items-center gap-2">
          {icons.map((Icon, index) => (
            <div
              key={index}
              className="flex size-5 items-center justify-center rounded border"
            >
              <Icon className="size-4" />
            </div>
          ))}
          <span>{label}</span>
        </div>
      ),
    )}
  </div>
);
