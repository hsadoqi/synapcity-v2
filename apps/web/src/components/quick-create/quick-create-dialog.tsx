'use client';

import { useId, useRef, useState, useTransition, type FormEvent } from 'react';
import { Button, buttonVariants } from '@synapcity/frontend-ui/core/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@synapcity/frontend-ui/core/dialog';
import {
  Field,
  FieldError,
  FieldLabel,
} from '@synapcity/frontend-ui/core/field';
import { Input } from '@synapcity/frontend-ui/core/input';
import { NAME_MAX } from '@synapcity/domain-records';

import { signInPathFor } from '../../lib/routing/user-paths';
import {
  createRecord,
  type CreateRecordResult,
} from '../../lib/records/create-record-action';
import {
  NAME_NEEDED,
  quickCreateNameSchema,
} from '../../lib/records/quick-create-name';
import { collectionFor, type CollectionKind } from '../collections';
import { LinkButton } from '@synapcity/frontend-ui/next/link-button';

const unconfirmedMessage = (singular: string, label: string) =>
  `We could not confirm that the ${singular} was created. Check ${label} in the sidebar before you try again.`;

type Failure = { message: string; signedOut: boolean };

/**
 * A small dialog for starting a Space, document or dashboard by name. On
 * success it closes and hands the new record's page (or, while a kind has no
 * page for one record, its list) to `onCreated`. A failed save keeps the typed
 * name and says why; a signed-out session gets a sign-in link. While it saves
 * it cannot be closed, so a save never finishes behind a closed dialog. When
 * the outcome is unknown (the request was cut off), it says so instead of
 * inviting a second copy, and asks the host to refresh with `onUnconfirmed`.
 */
export function QuickCreateDialog({
  kind,
  userId,
  onOpenChange,
  onCreated,
  onUnconfirmed,
  returnFocus,
  create = createRecord,
}: {
  /** What to create; the dialog is closed while this is null. */
  kind: CollectionKind | null;
  /** The signed-in owner, for the page to open afterwards. */
  userId: string;
  onOpenChange: (open: boolean) => void;
  /** Where to go once it exists. */
  onCreated: (href: string) => void;
  /** The save may have gone through; refresh what lists it. */
  onUnconfirmed: () => void;
  /**
   * The control that opened the dialog. The dialog is opened from state, not
   * by a Base UI trigger, so without this focus would fall to the page body.
   */
  returnFocus?: HTMLElement | null;
  /** The Server Action; replaceable in tests and stories. */
  create?: (kind: CollectionKind, name: string) => Promise<CreateRecordResult>;
}) {
  const nameId = useId();
  const errorId = useId();
  const [name, setName] = useState('');
  const [failure, setFailure] = useState<Failure | null>(null);
  const [pending, startTransition] = useTransition();
  // Set at once, before React re-renders with `pending`, so a second submit in
  // the same tick is refused too.
  const submitting = useRef(false);
  const collection = kind ? collectionFor(kind) : null;

  const reset = () => {
    setName('');
    setFailure(null);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!collection || pending || submitting.current) return;
    // The same rule the Server Action applies, so the message appears here
    // without a round trip: blank, over the limit, or unsavable text.
    const checked = quickCreateNameSchema.safeParse(name);
    if (!checked.success) {
      setFailure({
        message: checked.error.issues[0]?.message ?? NAME_NEEDED,
        signedOut: false,
      });
      return;
    }
    setFailure(null);
    submitting.current = true;
    startTransition(async () => {
      try {
        let result: CreateRecordResult;
        try {
          // The parsed name: trimmed, as the server stores it.
          result = await create(collection.kind, checked.data);
        } catch {
          // The request failed on the way or the action threw: the record
          // may or may not exist.
          result = { ok: false, error: '', unconfirmed: true };
        }
        if (!result.ok) {
          if (result.unconfirmed) onUnconfirmed();
          setFailure({
            message: result.unconfirmed
              ? unconfirmedMessage(
                  collection.singular,
                  collection.label.toLowerCase(),
                )
              : result.error,
            signedOut: result.signedOut === true,
          });
          return;
        }
        reset();
        onOpenChange(false);
        onCreated(
          collection.itemHref
            ? collection.itemHref(userId, result.id)
            : collection.indexHref(userId),
        );
      } finally {
        submitting.current = false;
      }
    });
  };

  return (
    <Dialog
      open={kind !== null}
      onOpenChange={(open) => {
        if (!open && pending) return;
        if (!open) reset();
        onOpenChange(open);
      }}
    >
      {collection && (
        <DialogContent
          finalFocus={() => (returnFocus?.isConnected ? returnFocus : true)}
        >
          <form
            className="flex flex-col gap-4"
            onSubmit={submit}
            noValidate
            aria-busy={pending}
          >
            <DialogHeader>
              <DialogTitle>New {collection.singular}</DialogTitle>
              <DialogDescription>
                Give it a name; you can change everything else later.
              </DialogDescription>
            </DialogHeader>
            <Field data-invalid={failure ? true : undefined}>
              <FieldLabel htmlFor={nameId}>Name</FieldLabel>
              <Input
                id={nameId}
                name="name"
                autoComplete="off"
                autoFocus
                // A hint only. It counts UTF-16 units and the check trims, so
                // the exact limit is the schema's: an emoji is one character
                // there and two units here. 2x never blocks a valid name.
                maxLength={NAME_MAX * 2}
                value={name}
                readOnly={pending}
                onChange={(event) => setName(event.target.value)}
                aria-invalid={failure ? true : undefined}
                aria-describedby={failure ? errorId : undefined}
              />
              {failure && (
                <FieldError id={errorId}>
                  {failure.message}
                  {failure.signedOut && (
                    <>
                      {' '}
                      <LinkButton
                        href={signInPathFor(collection.indexHref(userId))}
                        className={buttonVariants({
                          variant: 'link',
                          size: 'sm',
                        })}
                      >
                        Sign in again
                      </LinkButton>
                    </>
                  )}
                </FieldError>
              )}
            </Field>
            <DialogFooter>
              <DialogClose
                render={<Button variant="outline" />}
                disabled={pending}
              >
                Cancel
              </DialogClose>
              <Button type="submit" disabled={pending}>
                {pending ? 'Creating…' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      )}
    </Dialog>
  );
}
