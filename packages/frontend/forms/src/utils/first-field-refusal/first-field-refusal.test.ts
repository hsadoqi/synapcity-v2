import { describe, expect, it } from 'vitest';
import type { FieldErrors } from 'react-hook-form';

import { firstFieldRefusal } from './first-field-refusal';

describe('firstFieldRefusal', () => {
  it("takes the first error's message and the one field it is about", () => {
    const errors = {
      email: { type: 'x', message: 'Enter your email.' },
      name: { type: 'x', message: 'Enter your name.' },
    } as FieldErrors;
    expect(firstFieldRefusal(errors)).toEqual({
      error: 'Enter your email.',
      fields: ['email'],
    });
  });

  it('gives an empty refusal when there are no errors', () => {
    expect(firstFieldRefusal({})).toEqual({ error: '', fields: [] });
  });

  it('gives an empty message when the first error has none', () => {
    expect(firstFieldRefusal({ a: { type: 'x' } } as FieldErrors)).toEqual({
      error: '',
      fields: ['a'],
    });
  });
});
