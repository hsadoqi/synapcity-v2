import { describe, expect, it } from 'vitest';

import { authFailure, authSuccess } from './auth-state';

describe('authFailure', () => {
  it('echoes the user and marks the fields', () => {
    expect(authFailure('Nope.', { email: 'a@b.co' }, ['email'])).toEqual({
      error: 'Nope.',
      fields: ['email'],
      data: { user: { email: 'a@b.co' } },
    });
  });

  it('keeps an empty field list, which means "no one field"', () => {
    expect(authFailure('Nope.', { email: 'a@b.co' }, [])).toHaveProperty(
      'fields',
      [],
    );
  });

  it('leaves `fields` out entirely when none were given', () => {
    expect(authFailure('Slow down.', { email: 'a@b.co' })).not.toHaveProperty(
      'fields',
    );
  });

  it('never carries a password', () => {
    const state = authFailure('Nope.', { email: 'a@b.co', name: 'Ada' });
    expect(JSON.stringify(state)).not.toMatch(/password/i);
  });
});

describe('authSuccess', () => {
  it('reports success with the message and echoed user', () => {
    expect(authSuccess('Done.', { email: 'a@b.co', name: 'Ada' })).toEqual({
      success: true,
      message: 'Done.',
      data: { user: { email: 'a@b.co', name: 'Ada' } },
    });
  });
});
