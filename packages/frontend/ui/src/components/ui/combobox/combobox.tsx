'use client';

import * as React from 'react';
import { Combobox as ComboboxPrimitive } from '@base-ui/react/combobox';
import { cn } from 'cn';

import { Button } from '@synapcity/frontend-ui/core/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@synapcity/frontend-ui/core/input-group';
import { useVirtualList } from '@synapcity/frontend-ui/hooks/use-virtual-list';
import { CheckIcon, ChevronDownIcon, XIcon } from 'lucide-react';

const Combobox = ComboboxPrimitive.Root;

function ComboboxValue({ ...props }: ComboboxPrimitive.Value.Props) {
  return <ComboboxPrimitive.Value data-slot="combobox-value" {...props} />;
}

function ComboboxTrigger({
  className,
  children,
  ...props
}: ComboboxPrimitive.Trigger.Props) {
  return (
    <ComboboxPrimitive.Trigger
      data-slot="combobox-trigger"
      className={cn("[&_svg:not([class*='size-'])]:size-3.5", className)}
      {...props}
    >
      {children}
      <ChevronDownIcon className="pointer-events-none size-3.5 text-muted-foreground" />
    </ComboboxPrimitive.Trigger>
  );
}

function ComboboxClear({ className, ...props }: ComboboxPrimitive.Clear.Props) {
  return (
    <ComboboxPrimitive.Clear
      data-slot="combobox-clear"
      render={<InputGroupButton variant="ghost" size="icon-xs" />}
      aria-label="Clear selection"
      // Out of the tab order, as in the WAI-ARIA combobox pattern: the input
      // is the one keyboard stop (deleting its text clears it), and while the
      // list is open Base UI hides everything outside it, this button included.
      tabIndex={-1}
      className={cn(className)}
      {...props}
    >
      <XIcon className="pointer-events-none" />
    </ComboboxPrimitive.Clear>
  );
}

function ComboboxInput({
  className,
  children,
  disabled = false,
  showTrigger = true,
  showClear = false,
  ...props
}: ComboboxPrimitive.Input.Props & {
  showTrigger?: boolean;
  showClear?: boolean;
}) {
  return (
    <InputGroup className={cn('w-auto', className)}>
      <ComboboxPrimitive.Input
        render={<InputGroupInput disabled={disabled} />}
        {...props}
      />
      <InputGroupAddon align="inline-end">
        {showTrigger && (
          <InputGroupButton
            size="icon-xs"
            variant="ghost"
            render={<ComboboxTrigger />}
            data-slot="input-group-button"
            aria-label="Show options"
            // Out of the tab order, as in the WAI-ARIA combobox pattern: the
            // keyboard opens the list from the input (ArrowDown, Alt+ArrowDown).
            tabIndex={-1}
            className="group-has-data-[slot=combobox-clear]/input-group:hidden data-pressed:bg-transparent"
            disabled={disabled}
          />
        )}
        {showClear && <ComboboxClear disabled={disabled} />}
      </InputGroupAddon>
      {children}
    </InputGroup>
  );
}

function ComboboxContent({
  className,
  side = 'bottom',
  sideOffset = 6,
  align = 'start',
  alignOffset = 0,
  anchor,
  ...props
}: ComboboxPrimitive.Popup.Props &
  Pick<
    ComboboxPrimitive.Positioner.Props,
    'side' | 'align' | 'sideOffset' | 'alignOffset' | 'anchor'
  >) {
  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        anchor={anchor}
        className="isolate z-50"
      >
        <ComboboxPrimitive.Popup
          data-slot="combobox-content"
          data-chips={!!anchor}
          className={cn(
            'cn-menu-target cn-menu-translucent group/combobox-content relative max-h-(--available-height) w-(--anchor-width) max-w-(--available-width) min-w-[calc(var(--anchor-width)+--spacing(7))] origin-(--transform-origin) overflow-hidden rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[chips=true]:min-w-(--anchor-width) data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 *:data-[slot=input-group]:m-1 *:data-[slot=input-group]:mb-0 *:data-[slot=input-group]:h-7 *:data-[slot=input-group]:border-none *:data-[slot=input-group]:bg-input/20 *:data-[slot=input-group]:shadow-none dark:bg-popover data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
            className,
          )}
          {...props}
        />
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  );
}

function ComboboxList({ className, ...props }: ComboboxPrimitive.List.Props) {
  // While the popup fades out it is inert, so it stops scrolling too: a
  // scrollable region nobody can reach is an accessibility error (axe
  // scrollable-region-focusable), even for the 100ms of the exit animation.
  return (
    <ComboboxPrimitive.List
      data-slot="combobox-list"
      className={cn(
        'group-data-closed/combobox-content:overflow-hidden scrollbar-hidden max-h-[min(calc(--spacing(72)---spacing(9)),calc(var(--available-height)---spacing(9)))] scroll-py-1 overflow-y-auto overscroll-contain p-1 data-empty:p-0',
        className,
      )}
      {...props}
    />
  );
}

function ComboboxItem({
  className,
  children,
  ...props
}: ComboboxPrimitive.Item.Props) {
  return (
    <ComboboxPrimitive.Item
      data-slot="combobox-item"
      className={cn(
        "relative flex min-h-7 pointer-coarse:min-h-11 w-full cursor-default items-center gap-2 rounded-md px-2 py-1 text-xs/relaxed outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground not-data-[variant=destructive]:data-highlighted:**:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
        className,
      )}
      {...props}
    >
      {children}
      <ComboboxPrimitive.ItemIndicator
        render={
          <span className="pointer-events-none absolute right-2 flex items-center justify-center" />
        }
      >
        <CheckIcon className="pointer-events-none" />
      </ComboboxPrimitive.ItemIndicator>
    </ComboboxPrimitive.Item>
  );
}

function ComboboxGroup({ className, ...props }: ComboboxPrimitive.Group.Props) {
  return (
    <ComboboxPrimitive.Group
      data-slot="combobox-group"
      className={cn(className)}
      {...props}
    />
  );
}

function ComboboxLabel({
  className,
  ...props
}: ComboboxPrimitive.GroupLabel.Props) {
  return (
    <ComboboxPrimitive.GroupLabel
      data-slot="combobox-label"
      className={cn('px-2 py-1.5 text-xs text-muted-foreground', className)}
      {...props}
    />
  );
}

function ComboboxCollection({ ...props }: ComboboxPrimitive.Collection.Props) {
  return (
    <ComboboxPrimitive.Collection data-slot="combobox-collection" {...props} />
  );
}

function ComboboxEmpty({ className, ...props }: ComboboxPrimitive.Empty.Props) {
  return (
    <ComboboxPrimitive.Empty
      data-slot="combobox-empty"
      className={cn(
        'hidden w-full justify-center py-2 text-center text-xs/relaxed text-muted-foreground group-data-empty/combobox-content:flex',
        className,
      )}
      {...props}
    />
  );
}

function ComboboxSeparator({
  className,
  ...props
}: ComboboxPrimitive.Separator.Props) {
  return (
    <ComboboxPrimitive.Separator
      data-slot="combobox-separator"
      className={cn('-mx-1 my-1 h-px bg-border/50', className)}
      {...props}
    />
  );
}

function ComboboxChips({
  className,
  ...props
}: React.ComponentPropsWithRef<typeof ComboboxPrimitive.Chips> &
  ComboboxPrimitive.Chips.Props) {
  return (
    <ComboboxPrimitive.Chips
      data-slot="combobox-chips"
      className={cn(
        'flex min-h-7 pointer-coarse:min-h-11 flex-wrap items-center gap-1 rounded-md border border-input bg-input/20 bg-clip-padding px-2 py-0.5 text-xs/relaxed transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30 has-aria-invalid:border-destructive has-aria-invalid:ring-2 has-aria-invalid:ring-destructive/20 has-data-[slot=combobox-chip]:px-1 dark:bg-input/30 dark:has-aria-invalid:border-destructive/50 dark:has-aria-invalid:ring-destructive/40',
        className,
      )}
      {...props}
    />
  );
}

function ComboboxChip({
  className,
  children,
  showRemove = true,
  removeLabel = 'Remove',
  ...props
}: ComboboxPrimitive.Chip.Props & {
  showRemove?: boolean;
  /** The remove button's accessible name, such as `Remove Design`. */
  removeLabel?: string;
}) {
  return (
    <ComboboxPrimitive.Chip
      data-slot="combobox-chip"
      className={cn(
        'flex h-[calc(--spacing(4.75))] w-fit items-center justify-center gap-1 rounded-[calc(var(--radius-sm)-2px)] bg-muted-foreground/10 px-1.5 text-xs/relaxed font-medium whitespace-nowrap text-foreground has-disabled:pointer-events-none has-disabled:cursor-not-allowed has-disabled:opacity-50 has-data-[slot=combobox-chip-remove]:pr-0',
        className,
      )}
      {...props}
    >
      {children}
      {showRemove && (
        <ComboboxPrimitive.ChipRemove
          render={<Button variant="ghost" size="icon-xs" />}
          className="-ml-1 opacity-50 hover:opacity-100"
          data-slot="combobox-chip-remove"
          aria-label={removeLabel}
        >
          <XIcon className="pointer-events-none" />
        </ComboboxPrimitive.ChipRemove>
      )}
    </ComboboxPrimitive.Chip>
  );
}

function ComboboxChipsInput({
  className,
  ...props
}: ComboboxPrimitive.Input.Props) {
  return (
    <ComboboxPrimitive.Input
      data-slot="combobox-chip-input"
      className={cn('min-w-16 flex-1 outline-none', className)}
      {...props}
    />
  );
}

function useComboboxAnchor() {
  return React.useRef<HTMLDivElement | null>(null);
}

/**
 * Connects a `Combobox` root to its `ComboboxVirtualList`, so moving through
 * the options with the keyboard scrolls a row that is not rendered into view.
 * Pass `onItemHighlighted` to the root, set `virtualized` on the root while the
 * list is windowed, and pass the virtualizer to the list.
 */
interface ComboboxVirtualizer {
  /** Called by the list with how to scroll a row into view, or `null` when it unmounts. */
  readonly register: (scrollToIndex: ((index: number) => void) | null) => void;
  readonly onItemHighlighted: (
    value: unknown,
    details: { readonly reason: string; readonly index: number },
  ) => void;
}

function useComboboxVirtualizer(): ComboboxVirtualizer {
  const scrollToIndex = React.useRef<((index: number) => void) | null>(null);
  return React.useMemo<ComboboxVirtualizer>(
    () => ({
      register: (scroll) => {
        scrollToIndex.current = scroll;
      },
      onItemHighlighted: (_value, { reason, index }) => {
        if (reason === 'keyboard' && index >= 0) scrollToIndex.current?.(index);
      },
    }),
    [],
  );
}

/**
 * The option list, rendering only the rows in view (between two spacers) when
 * `enabled`. Rows are the root's filtered items; give each `ComboboxItem` the
 * `index` it is called with. Off, it renders every row like `ComboboxList`.
 */
function ComboboxVirtualList<Item>({
  virtualizer,
  enabled = true,
  estimateRowHeight,
  overscan,
  children,
  ...props
}: Omit<ComboboxPrimitive.List.Props, 'children'> & {
  virtualizer: ComboboxVirtualizer;
  enabled?: boolean;
  estimateRowHeight?: number;
  overscan?: number;
  children: (item: Item, index: number) => React.ReactNode;
}) {
  const items = ComboboxPrimitive.useFilteredItems<Item>();
  const list = React.useRef<HTMLDivElement | null>(null);
  const virtual = useVirtualList({
    count: items.length,
    enabled,
    estimateRowHeight,
    overscan,
  });
  const { viewportRef, measureRow, scrollToIndex, range } = virtual;

  React.useEffect(() => {
    virtualizer.register(scrollToIndex);
    return () => virtualizer.register(null);
  }, [virtualizer, scrollToIndex]);

  // Rows are one height; measure a rendered one in place of the estimate.
  React.useEffect(() => {
    measureRow(
      list.current?.querySelector<HTMLElement>('[data-slot="combobox-item"]') ??
        null,
    );
  }, [measureRow, range.start, range.end]);

  const setList = React.useCallback(
    (node: HTMLDivElement | null) => {
      list.current = node;
      viewportRef(node);
    },
    [viewportRef],
  );

  const rows: React.ReactNode[] = [];
  for (let index = range.start; index < range.end; index += 1) {
    rows.push(
      <React.Fragment key={index}>
        {children(items[index] as Item, index)}
      </React.Fragment>,
    );
  }

  return (
    <ComboboxList ref={setList} onScroll={virtual.onScroll} {...props}>
      {virtual.paddingTop > 0 ? (
        <div aria-hidden style={{ height: virtual.paddingTop }} />
      ) : null}
      {rows}
      {virtual.paddingBottom > 0 ? (
        <div aria-hidden style={{ height: virtual.paddingBottom }} />
      ) : null}
    </ComboboxList>
  );
}

export {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxGroup,
  ComboboxLabel,
  ComboboxCollection,
  ComboboxEmpty,
  ComboboxSeparator,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipsInput,
  ComboboxTrigger,
  ComboboxValue,
  useComboboxAnchor,
  ComboboxVirtualList,
  useComboboxVirtualizer,
};
export type { ComboboxVirtualizer };
