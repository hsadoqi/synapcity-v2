'use client';

import {
  CommandSeparator,
  CommandGroup,
  CommandItem,
} from '@synapcity/frontend-ui/core/command';
import React from 'react';
import type { CommandSearchItem as Item } from './types';

export const CommandSearchGroup = ({
  heading,
  showSeparators = false,
  last = false,
  items = [],
  onClose,
}: {
  heading: string;
  showSeparators?: boolean;
  last?: boolean;
  items: Item[];
  onClose?: () => void;
}) => {
  return (
    <React.Fragment key={heading}>
      {showSeparators && !last && <CommandSeparator />}
      <CommandGroup heading={heading}>
        {items.map((item) => {
          const handleClick = () => {
            item.onSelect?.();
            onClose?.();
          };
          return (
            <CommandSearchGroupItem
              key={item.label}
              {...item}
              onSelect={handleClick}
            />
          );
        })}
      </CommandGroup>
    </React.Fragment>
  );
};

const CommandSearchGroupItem = ({ label, onSelect, icon, timestamp }: Item) => {
  const Icon = icon;

  return (
    <CommandItem key={label} className="cursor-pointer" onSelect={onSelect}>
      {Icon && <Icon className={timestamp ? 'text-muted-foreground' : ''} />}
      <span>{label}</span>
      {timestamp && (
        <div className="ml-auto" data-slot="command-shortcut">
          <span>{timestamp}</span>
        </div>
      )}
    </CommandItem>
  );
};
