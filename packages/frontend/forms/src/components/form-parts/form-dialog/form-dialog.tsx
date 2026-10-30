'use client';

import {
  EntityDialog,
  type EntityDialogMessages,
  type EntityDialogProps,
} from '@synapcity/frontend-blocks';
import type { z } from 'zod';

import type { FormDefinition } from '../../../types';
import { FormRenderer, type FormRendererProps } from '../form-renderer';

type Values<TSchema extends z.ZodObject> = Partial<z.infer<TSchema>>;

export type FormDialogProps<TSchema extends z.ZodObject> = Omit<
  EntityDialogProps,
  | 'children'
  | 'onSubmit'
  | 'submitLabel'
  | 'cancelLabel'
  | 'submitDisabled'
  | 'messages'
> & {
  readonly definition: FormDefinition<TSchema>;
  /**
   * Seeds the form each time it opens (a dialog or sheet mounts its content on
   * open). An inline one mounts once, so key it by entity id.
   */
  readonly initialValues?: FormRendererProps<TSchema>['initialValues'];
  /**
   * Saves the validated values. The form shows it pending and says so when it
   * throws; the dialog closes on success unless `closeOnSuccess` is false.
   */
  readonly onSubmit: (values: Values<TSchema>) => void | Promise<void>;
  /** @default true */
  readonly closeOnSuccess?: boolean;
  /** @default 'Create' for create, 'Save changes' for edit */
  readonly submitLabel?: string;
  /** @default 'Cancel' */
  readonly cancelLabel?: string;
  readonly messages?: EntityDialogMessages & {
    /** Shown for a field that is required and empty. */
    readonly required?: string;
    /** Read out for a required control that cannot carry `aria-required`. */
    readonly requiredHint?: string;
  };
};

/**
 * `EntityDialog`'s shell around a `FormRenderer`: the caller passes a form
 * definition and a handler, and gets create, edit and a confirmed delete as a
 * dialog, a sheet or inline. `FormRenderer` brings its own `<form>`, buttons
 * and validation, so the shell supplies only the title, presentation and
 * delete.
 */
export function FormDialog<TSchema extends z.ZodObject>({
  definition,
  initialValues,
  onSubmit,
  closeOnSuccess = true,
  submitLabel,
  cancelLabel,
  messages,
  ...shell
}: FormDialogProps<TSchema>) {
  return (
    <EntityDialog {...shell} messages={messages}>
      {({ close }) => (
        <FormRenderer
          definition={definition}
          initialValues={initialValues}
          submitLabel={
            submitLabel ?? (shell.mode === 'create' ? 'Create' : 'Save changes')
          }
          cancelLabel={cancelLabel}
          messages={{
            required: messages?.required,
            requiredHint: messages?.requiredHint,
            submitFailed: messages?.failed,
          }}
          onCancel={close}
          onSubmit={async (values) => {
            await onSubmit(values);
            if (closeOnSuccess) close();
          }}
        />
      )}
    </EntityDialog>
  );
}
