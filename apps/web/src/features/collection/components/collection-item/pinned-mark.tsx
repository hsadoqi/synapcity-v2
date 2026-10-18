'use client';

import { IconButton } from '@synapcity/frontend-ui/components/icon-button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@synapcity/frontend-ui/core/tooltip';
import { Pin } from 'lucide-react';

export function PinnedMark() {
  return (
    <Tooltip>
      <TooltipTrigger
        render={<span className="relative flex text-muted-foreground" />}
        aria-label="Pinned"
      >
        <IconButton
          variant="ghost"
          size="sm"
          className="p-0"
          aria-label="Pinned"
        >
          <Pin className="size-3.5" aria-hidden="true" />
        </IconButton>
      </TooltipTrigger>
      <TooltipContent>Pinned</TooltipContent>
    </Tooltip>
  );
}
