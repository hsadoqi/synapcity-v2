'use client';

import Link from 'next/link';
import { useId, useState, useTransition, type FormEvent } from 'react';
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

import { signInPathFor } from '../../lib/routing/user-paths';
import {
  createRecord,
  type CreateRecordResult,
} from '../../lib/records/create-record-action';
import { collectionFor, type CollectionKind } from '../collections';

const NAME_NEEDED = 'Give it a name.';

type Failure = { message: string; signedOut: boolean };

/**
 * A small dialog for starting a Space, document or dashboard by name. On
 * success it closes and hands the new record's page (or, while a kind has no
 * page for one record, its list) to `onCreated`. A failed save keeps the typed
 * name and says why; a signed-out session gets a sign-in link.
 */
export function QuickCreateDialog({
  kind,
  userId,
  onOpenChange,
  onCreated,
  create = createRecord,
}: {
  /** What to create; the dialog is closed while this is null. */
  kind: CollectionKind | null;
  /** The signed-in owner, for the page to open afterwards. */
  userId: string;
  onOpenChange: (open: boolean) => void;
  /** Where to go once it exists. */
  onCreated: (href: string) => void;
  /** The Server Action; replaceable in tests and stories. */
  create?: (kind: CollectionKind, name: string) => Promise<CreateRecordResult>;
}) {
  const nameId = useId();
  const errorId = useId();
  const [name, setName] = useState('');
  const [failure, setFailure] = useState<Failure | null>(null);
  const [pending, startTransition] = useTransition();
  const collection = kind ? collectionFor(kind) : null;

  const reset = () => {
    setName('');
    setFailure(null);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!collection || pending) return;
    if (name.trim() === '') {
      setFailure({ message: NAME_NEEDED, signedOut: false });
      return;
    }
    setFailure(null);
    startTransition(async () => {
      const result = await create(collection.kind, name);
      if (!result.ok) {
        setFailure({
          message: result.error,
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
    });
  };

  return (
    <Dialog
      open={kind !== null}
      onOpenChange={(open) => {
        if (!open) reset();
        onOpenChange(open);
      }}
    >
      {collection && (
        <DialogContent>
          <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
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
                value={name}
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
                      <Link
                        href={signInPathFor(collection.indexHref(userId))}
                        className={buttonVariants({
                          variant: 'link',
                          size: 'sm',
                        })}
                      >
                        Sign in again
                      </Link>
                    </>
                  )}
                </FieldError>
              )}
            </Field>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
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
