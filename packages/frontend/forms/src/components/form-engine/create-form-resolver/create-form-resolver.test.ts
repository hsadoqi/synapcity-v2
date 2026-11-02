import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { defineForm } from '../define-form';
import { createFormResolver } from './create-form-resolver';

const schema = z.object({
  show: z.boolean().optional(),
  secret: z.string().min(1, 'Enter it.'),
  name: z.string().min(1, 'Enter a name.'),
});

const definition = defineForm({
  schema,
  fields: [
    { type: 'switch', name: 'show', label: 'Show' },
    {
      type: 'text',
      name: 'secret',
      label: 'Secret',
      dependencies: [
        {
          match: 'all',
          effect: 'show',
          conditions: [{ field: 'show', operator: 'equals', value: true }],
        },
      ],
    },
    { type: 'text', name: 'name', label: 'Name' },
  ],
});

const run = (values: Record<string, unknown>) =>
  createFormResolver(definition)(values, undefined, {
    fields: {},
    shouldUseNativeValidation: false,
    criteriaMode: 'firstError',
  });

describe('createFormResolver', () => {
  it('validates only the fields visible for the values, and leaves hidden values out of the output', async () => {
    const result = await run({ show: false, secret: '', name: 'Ada' });
    expect(result.errors).toEqual({});
    expect(result.values).toEqual({ show: false, name: 'Ada' });
  });

  it('validates a field once a condition shows it', async () => {
    const result = await run({ show: true, secret: '', name: 'Ada' });
    expect(Object.keys(result.errors)).toEqual(['secret']);
    expect(result.errors.secret?.message).toBe('Enter it.');
  });
});
