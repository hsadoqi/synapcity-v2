'use client';

import {
  DialogPortalContainer,
  type DialogContainerTarget,
  type DialogContainerWidth,
} from '@synapcity/frontend-ui/components/dialog-portal-container';
import { ConfirmDialog } from '@synapcity/frontend-ui/components/confirm-dialog';
import { Button } from '@synapcity/frontend-ui/core/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
} from '@synapcity/frontend-ui/core/sheet';
import { cn } from '@synapcity/frontend-ui/lib/utils';
import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactElement,
  type ReactNode,
} from 'react';

export type EntityMode = 'create' | 'edit';
export type EntityPresentation = 'dialog' | 'sheet' | 'inline';

export interface EntityDialogApi {
  mode: EntityMode;
  /** Asks the shell to close, as Cancel does. */
  close: () => void;
}

export interface EntityDialogMessages {
  /** Shown when submit or delete throws. Never the thrown error's own text. */
  failed?: string;
  /** @default `Delete ${entityLabel ?? entityName}?` */
  deleteTitle?: ReactNode;
  /** @default 'This cannot be undone.' */
  deleteDescription?: ReactNode;
}

export interface EntityDialogProps {
  mode: EntityMode;
  /** The kind of thing, lower case. Titles read "New event" and "Edit event". @default 'item' */
  entityName?: string;
  /** This entity's own name, for the delete confirmation. @default entityName */
  entityLabel?: string;
  /** Replaces the title made from `mode` and `entityName`. */
  title?: ReactNode;
  description?: ReactNode;
  /**
   * - `'dialog'` (default): a centred dialog.
   * - `'sheet'`: a panel sliding in from `side`.
   * - `'inline'`: in the page, with no overlay. The owner mounts it, and
   *   `onOpenChange(false)` tells the owner to take it away. Key it by entity
   *   id, so editing another one starts fresh.
   */
  presentation?: EntityPresentation;
  /** Sheet only. @default 'right' */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** Opens a dialog or sheet. Omit it for one opened only through `open`. */
  trigger?: ReactElement;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Dialog and sheet: where it renders. @default 'body' */
  container?: DialogContainerTarget;
  /** Dialog only. @default 'md' */
  width?: DialogContainerWidth;
  /** Dialog only: a fixed-height dialog whose body scrolls. @default false */
  scrollable?: boolean;
  /**
   * The fields, or a function of the shell's `close`.
   *
   * With `onSubmit`, the shell wraps them in a `<form>` and supplies the
   * footer. Without it, they render as they are and bring their own form and
   * actions (such as `FormRenderer`'s), so the shell never nests a second form.
   */
  children: ReactNode | ((api: EntityDialogApi) => ReactNode);
  /**
   * Saves. The shell shows it pending, closes on success, and says so when it
   * throws. Enables the shell's own form and Cancel and Submit buttons.
   */
  onSubmit?: () => void | Promise<void>;
  /** @default 'Create' for create, 'Save changes' for edit */
  submitLabel?: string;
  /** @default 'Cancel' */
  cancelLabel?: string;
  /** Disables Submit, for a form that is not valid yet. */
  submitDisabled?: boolean;
  /** Edit only: offers Delete, which asks to confirm first. */
  onDelete?: () => void | Promise<void>;
  /** @default 'Delete' */
  deleteLabel?: string;
  messages?: EntityDialogMessages;
  className?: string;
}

const DEFAULT_FAILED = 'Something went wrong. Try again.';

/** Open state that is controlled when `open` is passed, and kept here otherwise. */
function useOpen(
  open: boolean | undefined,
  defaultOpen: boolean,
  onOpenChange?: (open: boolean) => void,
): [boolean, (next: boolean) => void] {
  const [own, setOwn] = useState(defaultOpen);
  const controlled = open !== undefined;
  const current = controlled ? open : own;
  const set = (next: boolean) => {
    if (!controlled) setOwn(next);
    onOpenChange?.(next);
  };
  return [current, set];
}

/*
 * The same anchored-container idea as DialogPortalContainer: an empty,
 * layout-free element marks "here", and `null` makes Base UI wait for it
 * instead of falling back to body for a frame. `undefined` is body.
 */
function usePortalTarget(container: DialogContainerTarget) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const target =
    container === 'inline'
      ? anchor
      : container === 'body'
        ? undefined
        : container;
  const anchorElement =
    container === 'inline' ? (
      <div
        ref={setAnchor}
        data-slot="entity-dialog-anchor"
        className="contents"
      />
    ) : null;
  return { target, anchorElement };
}

/**
 * Create, edit and delete for one entity, with the shell prebuilt: the title,
 * the footer actions, the pending and failed states, and a confirmed delete.
 * The caller supplies only the fields. Opens as a dialog, a sheet or in place.
 */
export function EntityDialog({
  mode,
  entityName = 'item',
  entityLabel,
  title,
  description,
  presentation = 'dialog',
  side = 'right',
  trigger,
  open,
  defaultOpen = false,
  onOpenChange,
  container = 'body',
  width = 'md',
  scrollable = false,
  children,
  onSubmit,
  submitLabel,
  cancelLabel = 'Cancel',
  submitDisabled = false,
  onDelete,
  deleteLabel = 'Delete',
  messages,
  className,
}: EntityDialogProps) {
  const formId = useId();
  const headingId = useId();
  const alertRef = useRef<HTMLParagraphElement>(null);
  const [isOpen, setOpen] = useOpen(
    open ?? (presentation === 'inline' ? true : undefined),
    defaultOpen,
    onOpenChange,
  );
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const { target, anchorElement } = usePortalTarget(container);

  // A dialog that is mid-save or mid-delete cannot be dismissed from outside.
  const request = (next: boolean) => {
    if (!next && pending) return;
    if (next) setFailed(false);
    setOpen(next);
  };
  const close = () => request(false);

  const run = async (action: () => void | Promise<void>) => {
    setPending(true);
    setFailed(false);
    try {
      await action();
      setPending(false);
      setOpen(false);
    } catch {
      setPending(false);
      setFailed(true);
    }
  };

  useEffect(() => {
    if (failed) alertRef.current?.focus();
  }, [failed]);

  const heading =
    title ?? `${mode === 'create' ? 'New' : 'Edit'} ${entityName}`;
  const deletable = mode === 'edit' && onDelete !== undefined;
  const ownsForm = onSubmit !== undefined;
  const api: EntityDialogApi = { mode, close };
  const content = typeof children === 'function' ? children(api) : children;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending || !onSubmit) return;
    void run(onSubmit);
  };

  const body = (
    <>
      {ownsForm ? (
        <form
          id={formId}
          noValidate
          onSubmit={submit}
          className="flex flex-col gap-4"
        >
          {content}
        </form>
      ) : (
        content
      )}
      {failed && (
        <p
          ref={alertRef}
          role="alert"
          tabIndex={-1}
          className="text-xs text-destructive outline-none"
        >
          {messages?.failed ?? DEFAULT_FAILED}
        </p>
      )}
    </>
  );

  const actions =
    ownsForm || deletable ? (
      <>
        {deletable && (
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={() => setConfirming(true)}
            className="sm:mr-auto"
          >
            {deleteLabel}
          </Button>
        )}
        {ownsForm && (
          <>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={close}
            >
              {cancelLabel}
            </Button>
            <Button
              type="submit"
              form={formId}
              disabled={pending || submitDisabled}
              aria-busy={pending || undefined}
            >
              {submitLabel ?? (mode === 'create' ? 'Create' : 'Save changes')}
            </Button>
          </>
        )}
      </>
    ) : null;

  const confirm = deletable ? (
    <ConfirmDialog
      open={confirming}
      onOpenChange={setConfirming}
      title={messages?.deleteTitle ?? `Delete ${entityLabel ?? entityName}?`}
      description={messages?.deleteDescription ?? 'This cannot be undone.'}
      confirmText={deleteLabel}
      variant="destructive"
      onConfirm={() => void run(onDelete)}
    />
  ) : null;

  if (presentation === 'inline') {
    if (!isOpen) return null;
    return (
      <section
        aria-labelledby={headingId}
        data-slot="entity-dialog"
        aria-busy={pending || undefined}
        className={cn('flex min-h-0 flex-col gap-3', className)}
      >
        <div className="flex flex-col gap-1">
          <h3 id={headingId} className="text-sm font-medium">
            {heading}
          </h3>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {body}
        {actions && (
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {actions}
          </div>
        )}
        {confirm}
      </section>
    );
  }

  if (presentation === 'sheet') {
    return (
      <>
        <Sheet open={isOpen} onOpenChange={request}>
          {trigger && <SheetTrigger render={trigger} />}
          <SheetPortal container={target}>
            <SheetContent side={side} className={className}>
              <SheetHeader>
                <SheetTitle>{heading}</SheetTitle>
                {description && (
                  <SheetDescription>{description}</SheetDescription>
                )}
              </SheetHeader>
              <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6">
                {body}
              </div>
              {actions && (
                <SheetFooter className="sm:flex-row sm:justify-end">
                  {actions}
                </SheetFooter>
              )}
              {confirm}
            </SheetContent>
          </SheetPortal>
        </Sheet>
        {anchorElement}
      </>
    );
  }

  return (
    <>
      <DialogPortalContainer
        open={isOpen}
        onOpenChange={request}
        trigger={trigger}
        title={heading}
        description={description}
        container={container}
        width={width}
        scrollable={scrollable}
        footer={actions}
        className={className}
      >
        <div className="flex flex-col gap-4">{body}</div>
        {confirm}
      </DialogPortalContainer>
    </>
  );
}
