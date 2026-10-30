import type { FieldErrors } from 'react-hook-form';

/** A refusal found in the browser, shaped like the one a server action returns. */
export interface ActionFormRefusal<Field extends string = string> {
  readonly error: string;
  readonly fields: readonly Field[];
}

/**
 * The first refusal only, like the server: React Hook Form lists errors in the
 * order the schema reported them, so the first is the schema's first issue.
 */
export function firstFieldRefusal<Field extends string = string>(
  errors: FieldErrors,
): ActionFormRefusal<Field> {
  const [name, error] = Object.entries(errors)[0] ?? [];
  return {
    error: typeof error?.message === 'string' ? error.message : '',
    fields: name === undefined ? [] : [name as Field],
  };
}
