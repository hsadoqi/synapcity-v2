'use client';

import type * as React from 'react';

import { Collapsible as CollapsiblePrimitive } from '@base-ui/react/collapsible';
import { ChevronDownIcon } from 'lucide-react';

import { cn } from '@synapcity/frontend-ui/lib/utils';

/** A section that shows and hides its content. Controlled with `open` and `onOpenChange`, or uncontrolled with `defaultOpen`. */
function Collapsible({ ...props }: CollapsiblePrimitive.Root.Props) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />;
}

/** The button that toggles the section; it carries `aria-expanded` and `aria-controls`. */
function CollapsibleTrigger({ ...props }: CollapsiblePrimitive.Trigger.Props) {
  return (
    <CollapsiblePrimitive.Trigger data-slot="collapsible-trigger" {...props} />
  );
}

/**
 * The content. Pass `keepMounted` when what is inside must keep its state
 * while hidden, such as form fields; `hiddenUntilFound` also lets the
 * browser's find-in-page open it.
 */
function CollapsibleContent({
  className,
  ...props
}: CollapsiblePrimitive.Panel.Props) {
  return (
    <CollapsiblePrimitive.Panel
      data-slot="collapsible-content"
      className={cn(
        'overflow-hidden transition-all duration-150 ease-out data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none',
        className,
      )}
      {...props}
    />
  );
}

/** A chevron for inside the trigger; it turns over while the section is open. */
function CollapsibleIcon({
  className,
  ...props
}: React.ComponentProps<typeof ChevronDownIcon>) {
  return (
    <ChevronDownIcon
      data-slot="collapsible-icon"
      data-icon="inline-end"
      aria-hidden="true"
      className={cn(
        'transition-transform in-data-panel-open:rotate-180 motion-reduce:transition-none',
        className,
      )}
      {...props}
    />
  );
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent, CollapsibleIcon };
