'use client';

import type { ComponentProps } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { cn } from '@synapcity/frontend-ui/lib/utils';

function ResizablePanelGroup({
  className,
  ...props
}: ComponentProps<typeof Group>) {
  return (
    <Group
      data-slot="resizable-group"
      className={cn('min-h-0 min-w-0 flex-1', className)}
      {...props}
    />
  );
}

function ResizablePanel(props: ComponentProps<typeof Panel>) {
  return (
    <Panel
      data-slot="resizable-panel"
      {...props}
      style={{
        // Deliberate: classes cannot replace the library's inline overflow:auto.
        overflow: 'hidden',
        ...props.style,
      }}
    />
  );
}

function ResizableHandle({
  className,
  ...props
}: ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="resizable-handle"
      className={cn(
        'relative flex touch-none items-center justify-center bg-border outline-none focus-visible:bg-ring aria-[orientation=horizontal]:h-1 aria-[orientation=horizontal]:w-full aria-[orientation=vertical]:h-full aria-[orientation=vertical]:w-1',
        className,
      )}
      {...props}
    />
  );
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
