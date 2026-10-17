import { describe, expect, it } from 'vitest';

import { field } from './form-data';

describe('field', () => {
  it('returns a submitted text value', () => {
    const data = new FormData();
    data.set('email', 'a@b.co');
    expect(field(data, 'email')).toBe('a@b.co');
  });

  it('returns an empty string for a missing field', () => {
    expect(field(new FormData(), 'email')).toBe('');
  });

  it('returns an empty string for a file upload', () => {
    const data = new FormData();
    data.set('email', new File(['x'], 'x.txt'));
    expect(field(data, 'email')).toBe('');
  });
});
