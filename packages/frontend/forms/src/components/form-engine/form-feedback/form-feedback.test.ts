import { describe, expect, it } from 'vitest';

import { fieldErrorProps } from './form-feedback';

describe('fieldErrorProps', () => {
  it('marks the field an error is about and points it at that message', () => {
    expect(
      fieldErrorProps(
        { error: 'Enter your name.', fields: ['name'] },
        'name',
        'm1',
      ),
    ).toEqual({ invalid: true, messageId: 'm1' });
  });

  it('leaves a field alone when the error is about another one', () => {
    expect(
      fieldErrorProps(
        { error: 'Wrong password.', fields: ['password'] },
        'email',
        'm1',
      ).invalid,
    ).toBe(false);
  });

  it('leaves every field alone when the error is about no one field', () => {
    expect(
      fieldErrorProps({ error: 'Try again later.' }, 'email', 'm1').invalid,
    ).toBe(false);
  });

  it('leaves a field alone once the error is gone', () => {
    expect(fieldErrorProps({ fields: ['name'] }, 'name', 'm1').invalid).toBe(
      false,
    );
  });
});
