import { zodResolver } from '@hookform/resolvers/zod';
import type { FieldValues, Resolver } from 'react-hook-form';

import type { FormDefinition } from '../../types';
import { createSchemaBuilder } from '../build-schema';
import { resolveFieldStates } from '../resolve-field-states';

/**
 * A React Hook Form resolver for a form definition. Each time it runs it works
 * out which fields are visible for the incoming values, takes the matching
 * narrowed schema (cached while visibility is unchanged), and validates with
 * it. Hidden fields are neither validated nor in the output.
 */
export function createFormResolver(
  definition: FormDefinition,
  messages: { required?: string } = {},
): Resolver<FieldValues> {
  const schemaFor = createSchemaBuilder(definition, messages);
  return (values, context, options) =>
    zodResolver(schemaFor(resolveFieldStates(definition, values)))(
      values,
      context,
      options,
    ) as ReturnType<Resolver<FieldValues>>;
}
