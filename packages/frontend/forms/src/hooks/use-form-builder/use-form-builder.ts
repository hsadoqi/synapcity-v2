'use client';

import { useMemo } from 'react';
import {
  useForm,
  useWatch,
  type FieldValues,
  type UseFormReturn,
} from 'react-hook-form';

import type { FieldState, FormDefinition } from '../../types';
import { createFormResolver } from '../../utils/create-form-resolver';
import { describeSchemaField } from '../../utils/describe-schema-field';
import { resolveFieldStates } from '../../utils/resolve-field-states';

export interface UseFormBuilderOptions {
  readonly definition: FormDefinition;
  readonly initialValues?: Readonly<Record<string, unknown>>;
  readonly mode?: 'onBlur' | 'onChange' | 'onSubmit';
  readonly messages?: { readonly required?: string };
}

export interface UseFormBuilderResult {
  readonly form: UseFormReturn<FieldValues>;
  /** Visible, enabled and required for each field, for the values now. */
  readonly states: Readonly<Record<string, FieldState>>;
  /** What the form starts from, and returns to with `afterSubmit: 'clear'`. */
  readonly defaults: Readonly<Record<string, unknown>>;
}

/** The names of the fields some other field's conditions read. */
function watchedNames(definition: FormDefinition): string[] {
  const names = new Set<string>();
  for (const field of definition.fields) {
    for (const dependency of field.dependencies ?? []) {
      for (const condition of dependency.conditions) names.add(condition.field);
    }
  }
  return [...names];
}

/**
 * Where a field starts. A toggle is off and text is empty. A key the schema
 * allows to be `null` but not to be missing starts as `null`, because Zod fails
 * such a key when it is absent. Anything else starts undefined.
 */
function startingValue(definition: FormDefinition, name: string): unknown {
  const field = definition.fields.find((candidate) => candidate.name === name);
  if (field === undefined) return undefined;
  if (field.type === 'checkbox' || field.type === 'switch') return false;
  const { optional, nullable } = describeSchemaField(definition.schema, name);
  if (nullable && !optional) return null;
  if (
    field.type === 'number' ||
    field.type === 'select' ||
    field.type === 'file'
  ) {
    return undefined;
  }
  return '';
}

/**
 * The React Hook Form instance for a definition, plus the field states for its
 * current values. `shouldUnregister` stays at its default (`false`): a hidden
 * field keeps its value, so it comes back if the field is shown again, while
 * the resolver leaves it out of what is validated and submitted.
 */
export function useFormBuilder({
  definition,
  initialValues,
  mode = 'onBlur',
  messages,
}: UseFormBuilderOptions): UseFormBuilderResult {
  const required = messages?.required;
  const resolver = useMemo(
    () => createFormResolver(definition, { required }),
    [definition, required],
  );
  const names = useMemo(() => watchedNames(definition), [definition]);

  const defaults = useMemo(() => {
    const values: Record<string, unknown> = {};
    for (const field of definition.fields) {
      values[field.name] = startingValue(definition, field.name);
    }
    return values;
  }, [definition]);

  const form = useForm<FieldValues>({
    resolver,
    mode,
    // Seeds the form once; a later change to `initialValues` is ignored.
    defaultValues: { ...defaults, ...initialValues },
    // The form moves focus itself, in definition order.
    shouldFocusError: false,
  });

  const watched = useWatch({ control: form.control, name: names });
  const states = useMemo(() => {
    const values: Record<string, unknown> = {};
    names.forEach((name, index) => {
      values[name] = watched[index];
    });
    return resolveFieldStates(definition, values);
  }, [definition, names, watched]);

  return { form, states, defaults };
}
