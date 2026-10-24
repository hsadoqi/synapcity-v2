'use client';

import {
  useState,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from '@synapcity/frontend-ui/core/dialog';
import { ScrollArea } from '@synapcity/frontend-ui/core/scroll-area';
import { cn } from '@synapcity/frontend-ui/lib/utils';

type DialogRootProps = ComponentProps<typeof Dialog>;
type PortalContainer = ComponentProps<typeof DialogPortal>['container'];

/**
 * Where the dialog is rendered in the DOM.
 * - `'inline'` (default): right where `DialogContainer` sits, so the dialog
 *   inherits the surrounding theme scope (`theme-dark`, an inverted block).
 * - `'body'`: appended to `document.body`, outside any local theme.
 * - an element or ref: inside that element.
 */
type DialogContainerTarget = 'inline' | 'body' | NonNullable<PortalContainer>;

type DialogContainerWidth = 'sm' | 'md' | 'lg' | 'full';
type DialogContainerHeight = 'sm' | 'md' | 'lg' | 'full';

const widthClasses: Record<DialogContainerWidth, string> = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  full: 'flex-1',
};

const heightClasses: Record<DialogContainerHeight, string> = {
  sm: 'sm:max-h-sm',
  md: 'sm:max-h-md',
  lg: 'sm:max-h-lg',
  full: 'flex-1',
};

export interface DialogPortalContainerProps extends Pick<
  DialogRootProps,
  'open' | 'defaultOpen' | 'onOpenChange' | 'modal' | 'disablePointerDismissal'
> {
  /** The element that opens the dialog. Omit it for a dialog opened only through `open`. */
  trigger?: ReactElement;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** Actions under the body, laid out by `DialogFooter`. */
  footer?: ReactNode;
  /** @default 'inline' */
  container?: DialogContainerTarget;
  /** @default true */
  overlay?: boolean;
  /** @default true */
  showCloseButton?: boolean;
  /**
   * Give the dialog a fixed share of the viewport and scroll the body under a
   * fixed header and footer. A ScrollArea only scrolls inside a parent of
   * known height, so a scrollable dialog is always that tall.
   * @default false
   */
  scrollable?: boolean;
  /** Maximum width from the `sm` breakpoint up. @default 'sm' */
  width?: DialogContainerWidth;
  /** Maximum height from the `sm` breakpoint up. @default 'sm' */
  height?: DialogContainerHeight;
  /** Layout classes for the dialog popup. */
  className?: string;
}

/*
 * Base UI resolves a portal's target as `container ?? parentPortal ?? body`
 * (FloatingPortal in @base-ui/react 1.9). The outer portal here picks the
 * target; DialogContent's own portal nests inside it.
 *
 * A dialog is `position: fixed`, so an ancestor with a `transform`, `filter`
 * or `backdrop-filter` becomes its containing block and it is placed against
 * that ancestor rather than the viewport. Keep inline dialogs out of blurred
 * or transformed surfaces, or pass a container outside them.
 */
export function DialogPortalContainer({
  trigger,
  title,
  description,
  children,
  footer,
  container = 'inline',
  overlay = true,
  showCloseButton = true,
  scrollable = false,
  width = 'sm',
  height = 'sm',
  className,
  ...rootProps
}: DialogPortalContainerProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  // `null` makes Base UI wait for the anchor to mount instead of falling back
  // to body for one frame; `undefined` means body.
  const portalContainer: PortalContainer =
    container === 'inline'
      ? anchor
      : container === 'body'
        ? undefined
        : container;

  return (
    <>
      <Dialog {...rootProps}>
        {trigger && <DialogTrigger render={trigger} />}
        <DialogPortal container={portalContainer}>
          <DialogContent
            showOverlay={overlay}
            showCloseButton={showCloseButton}
            className={cn(
              widthClasses[width],
              heightClasses[height],
              scrollable && 'flex h-4/5 flex-col',
              className,
            )}
          >
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              {description && (
                <DialogDescription>{description}</DialogDescription>
              )}
            </DialogHeader>
            {scrollable ? (
              <ScrollArea className="min-h-0 flex-1">{children}</ScrollArea>
            ) : (
              children
            )}
            {footer && <DialogFooter>{footer}</DialogFooter>}
          </DialogContent>
        </DialogPortal>
      </Dialog>
      {container === 'inline' && (
        // `contents` keeps the anchor out of layout, so it adds no box or gap.
        <div
          ref={setAnchor}
          data-slot="dialog-container-anchor"
          className="contents"
        />
      )}
    </>
  );
}

export type {
  DialogContainerWidth,
  DialogContainerHeight,
  DialogContainerTarget,
};
