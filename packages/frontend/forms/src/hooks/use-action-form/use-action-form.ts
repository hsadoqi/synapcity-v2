'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { startTransition, useState, type FormEvent } from 'react';
import {
  useForm,
  type FieldErrors,
  type FieldValues,
  type Resolver,
  type UseFormRegisterReturn,
} from 'react-hook-form';
import type { z } from 'zod';

import { unwrapSchema } from '../../utils/describe-schema-field';

/** What a form shows about a refused submit: a message and the fields it is about. */
export interface FormFeedback {
  readonly error?: string;
  readonly fields?: readonly string[];
}

/** A refusal found in the browser, shaped like the one a server action returns. */
export interface ActionFormRefusal<Field extends string> {
  readonly error: string;
  readonly fields: readonly Field[];
}

export interface UseActionFormOptions<
  TSchema extends z.ZodObject,
  TState extends FormFeedback,
> {
  /** The schema the server action also uses, so both sides refuse with the same message. */
  readonly schema: TSchema;
  /** The form action from `useActionState`. It is always called with the form's own `FormData`. */
  readonly action: (formData: FormData) => void;
  /** The state the server action last returned. */
  readonly state: TState;
}

type FieldName<TSchema extends z.ZodObject> = Extract<
  keyof z.infer<TSchema>,
  string
>;

export interface UseActionFormResult<
  TSchema extends z.ZodObject,
  TState extends FormFeedback,
> {
  /** Spread onto the `<form>`: the action (so it works before hydration), `noValidate` and the submit handler. */
  readonly formProps: {
    readonly action: (formData: FormData) => void;
    readonly noValidate: true;
    readonly onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  };
  readonly register: (name: FieldName<TSchema>) => UseFormRegisterReturn;
  /** The browser's refusal while there is one, otherwise the server's state. */
  readonly state: (TState | ActionFormRefusal<FieldName<TSchema>>) &
    FormFeedback;
}

type FormValue = FormDataEntryValue | FormDataEntryValue[] | undefined;

const isArraySchema = (field: z.ZodType): boolean =>
  unwrapSchema(field).def.type === 'array';

/**
 * The schema's keys, read from what the form holds. A key the form does not
 * send (an unchecked box, a field that is not rendered) is `undefined`, so a
 * value typed earlier cannot linger. An array key is always a list; any other
 * key is its first value (a string, or a `File` from a file input). Names that
 * are not schema keys, such as a hidden `next`, are left alone.
 */
function valuesOf(
  schema: z.ZodObject,
  formData: FormData,
): Record<string, FormValue> {
  const values: Record<string, FormValue> = {};
  for (const [name, field] of Object.entries(schema.shape)) {
    const all = formData.getAll(name);
    values[name] = isArraySchema(field as z.ZodType) ? all : all[0];
  }
  return values;
}

/**
 * The first refusal only, like the server: React Hook Form lists errors in the
 * order the schema reported them, so the first one is the schema's first issue.
 */
function firstRefusal<Field extends string>(
  errors: FieldErrors,
): ActionFormRefusal<Field> {
  const [name, error] = Object.entries(errors)[0] ?? [];
  return {
    error: typeof error?.message === 'string' ? error.message : '',
    fields: name === undefined ? [] : [name as Field],
  };
}

/**
 * Client-side validation for a form that still submits to a server action.
 *
 * The `<form>` keeps its `action`, so it works before the page hydrates and the
 * server stays the authority. Once hydrated, the submit handler validates the
 * form's data against the schema first: a refusal is shown at once, in the same
 * shape as a server refusal so the form looks and focuses the same, and the
 * action is not called; valid data goes to the action unchanged.
 *
 * React 19 resets a form after its action finishes, and React Hook Form does
 * not see that reset, so its stored values are synced from the form's data
 * just before validating. `reset()` is not used for this: it also resets the
 * DOM form and would wipe what was typed.
 */
export function useActionForm<
  TSchema extends z.ZodObject,
  TState extends FormFeedback,
>({
  schema,
  action,
  state,
}: UseActionFormOptions<TSchema, TState>): UseActionFormResult<
  TSchema,
  TState
> {
  const form = useForm<FieldValues>({
    resolver: zodResolver(schema) as Resolver<FieldValues>,
    // The form moves focus itself, the same way for a client and a server refusal.
    shouldFocusError: false,
  });
  const [refusal, setRefusal] =
    useState<ActionFormRefusal<FieldName<TSchema>>>();

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    const element = event.currentTarget;
    for (const [name, value] of Object.entries(
      valuesOf(schema, new FormData(element)),
    )) {
      form.setValue(name, value);
    }
    void form.handleSubmit(
      () => {
        setRefusal(undefined);
        startTransition(() => action(new FormData(element)));
      },
      (errors) => setRefusal(firstRefusal<FieldName<TSchema>>(errors)),
    )(event);
  };

  return {
    formProps: { action, noValidate: true, onSubmit },
    register: (name) => form.register(name),
    state: refusal ?? state,
  };
}
