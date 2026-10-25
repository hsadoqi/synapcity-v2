'use client';

import {
  useState,
  type CSSProperties,
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

type DialogSizePreset = 'sm' | 'md' | 'lg' | 'full';

/**
 * A preset, or a number: a percentage of the dialog's containing block. A
 * dialog is `position: fixed`, so that is the viewport (the number reads as
 * vw or vh) unless an ancestor has a `transform`, `filter` or `contain: layout`,
 * as a card does when the dialog renders inside it; then the number is a share
 * of that card, which is what keeps a card-scoped dialog inside the card.
 */
type DialogContainerWidth = DialogSizePreset | number;
type DialogContainerHeight = DialogSizePreset | number;

/*
 * sm, md and lg are 24, 28 and 32rem, the sizes `max-w-sm/md/lg` name. Tailwind
 * has no `max-h-sm`: its named container sizes exist for `max-w` only, so the
 * heights use the spacing scale (96, 112 and 128 are those same rems).
 *
 * `full` fills the dialog's containing block (the viewport, or the card it
 * renders in) instead of being capped: it lifts the maximum at every width, not
 * only from `sm`, and takes a height of its own. The popup becomes a flex column
 * and the body is its `flex-1` child (below), because `flex-1` only means
 * something on a flex child.
 */
const widthClasses: Record<DialogSizePreset, string> = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  full: 'max-w-full sm:max-w-full',
};

const heightClasses: Record<DialogSizePreset, string> = {
  sm: 'sm:max-h-96',
  md: 'sm:max-h-112',
  lg: 'sm:max-h-128',
  full: 'h-full max-h-full sm:max-h-full',
};

/** A usable percentage, or `undefined` for NaN, zero, negative and infinite values. */
const percent = (value: number) =>
  Number.isFinite(value) && value > 0 ? Math.min(value, 100) : undefined;

/**
 * Inline size for a numeric `width` or `height`: the value is a runtime prop,
 * which a class cannot carry. A number is exactly that share of the containing
 * block (100 fills it, with no gutter); a `scrollable` dialog also takes the
 * height itself, because its ScrollArea needs a definite height to scroll in.
 */
function numericSize(
  width: DialogContainerWidth,
  height: DialogContainerHeight | undefined,
  scrollable: boolean,
): CSSProperties | undefined {
  const style: CSSProperties = {};
  const w = typeof width === 'number' ? percent(width) : undefined;
  const h = typeof height === 'number' ? percent(height) : undefined;
  if (w !== undefined) style.maxWidth = `${w}%`;
  if (h !== undefined) {
    style.maxHeight = `${h}%`;
    if (scrollable) style.height = `${h}%`;
  }
  return Object.keys(style).length > 0 ? style : undefined;
}

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
  /** Maximum width from the `sm` breakpoint up; `'full'` fills the container; or a number: see `DialogContainerWidth`. @default 'sm' */
  width?: DialogContainerWidth;
  /**
   * Maximum height from the `sm` breakpoint up; `'full'` fills the container;
   * or a number: see `DialogContainerHeight`. Left unset, the dialog is as tall
   * as its content. A dialog that is capped and not `scrollable` scrolls.
   */
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
  height,
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
            style={numericSize(width, height, scrollable)}
            className={cn(
              typeof width === 'number' ? undefined : widthClasses[width],
              (scrollable || height === 'full') && 'flex flex-col',
              scrollable && 'h-4/5',
              // After `scrollable`, so `full`'s `h-full` wins over its `h-4/5`.
              typeof height === 'string' && heightClasses[height],
              // Capped but not scrollable: scroll rather than spill out of the box.
              height !== undefined && !scrollable && 'overflow-y-auto',
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
            ) : height === 'full' ? (
              <div className="min-h-0 flex-1">{children}</div>
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
