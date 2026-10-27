import { describe, expect, it } from 'vitest';

import { readError } from './read-error';

describe('readError', () => {
  it('names the read and the code, never the database message', () => {
    const error = readError('spaces', {
      code: '42501',
      message: 'permission denied: row (secret)',
    } as { code: string });

    expect(error.message).toBe('Failed to load spaces (code 42501)');
    expect(error.message).not.toContain('secret');
  });

  it('says unknown when there is no code', () => {
    const error = readError('documents', {});

    expect(error.message).toBe('Failed to load documents (code unknown)');
    expect(error).not.toHaveProperty('code');
  });

  it('keeps the code on the error, so a host that catches it can log it', () => {
    const error = readError('spaces', { code: '42501' });

    expect(error.code).toBe('42501');
    expect(Object.keys(error)).toEqual(['code']);
  });
});
