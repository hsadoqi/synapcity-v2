'use client';

import { Button } from '@synapcity/frontend-ui/core/button';
import { Kbd } from '@synapcity/frontend-ui/core/kbd';
import { cn } from '@synapcity/frontend-ui/lib/utils';
import { SearchIcon } from 'lucide-react';

export const CommandSearchButton = ({
  onOpen,
  label = 'Search',
  shortcut = '⌘J',
  size = 'md',
}: {
  onOpen?: (open?: boolean) => void;
  label?: string;
  shortcut?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}) => {
  const sizes = {
    xs: {
      button: 'w-36',
      icon: 'size-3',
    },
    sm: {
      button: 'w-40',
      icon: 'size-3.5',
    },
    md: {
      button: 'w-52',
      icon: 'size-4',
    },
    lg: {
      button: 'w-60',
      icon: 'size-4.5',
    },
    xl: {
      button: 'w-72',
      icon: 'size-5',
    },
  };

  return (
    <Button
      onClick={() => onOpen?.(true)}
      variant="outline"
      className={cn('cursor-pointer', sizes[size].button)}
    >
      <SearchIcon className={sizes[size].icon} />
      {label}
      <Kbd className="ml-auto">{shortcut}</Kbd>
    </Button>
  );
};
