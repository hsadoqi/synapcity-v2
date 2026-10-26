'use client';

import { useId } from 'react';
import { Button } from '@synapcity/frontend-ui/core/button';
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
  FieldDescription,
  FieldLabel,
} from '@synapcity/frontend-ui/core/field';
import { Input } from '@synapcity/frontend-ui/core/input';

import { collectionFor, type CollectionKind } from '@/components/app-sidebar';

/**
 * A small dialog for starting a Space, document or dashboard by name. Nothing
 * can save one yet (no create action or storage is decided), so Create is
 * disabled and says so; wiring it up is its own approved step.
 */
export function QuickCreateDialog({
  kind,
  onOpenChange,
}: {
  /** What to create; the dialog is closed while this is null. */
  kind: CollectionKind | null;
  onOpenChange: (open: boolean) => void;
}) {
  const nameId = useId();
  const noteId = useId();
  const collection = kind ? collectionFor(kind) : null;

  return (
    <Dialog open={kind !== null} onOpenChange={onOpenChange}>
      {collection && (
        <DialogContent>
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => event.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle>New {collection.singular}</DialogTitle>
              <DialogDescription>
                Give it a name; you can change everything else later.
              </DialogDescription>
            </DialogHeader>
            <Field>
              <FieldLabel htmlFor={nameId}>Name</FieldLabel>
              <Input
                id={nameId}
                name="name"
                autoComplete="off"
                autoFocus
                aria-describedby={noteId}
              />
              <FieldDescription id={noteId}>
                Creating a {collection.singular} is not available yet.
              </FieldDescription>
            </Field>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                Cancel
              </DialogClose>
              <Button type="submit" disabled>
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      )}
    </Dialog>
  );
}
