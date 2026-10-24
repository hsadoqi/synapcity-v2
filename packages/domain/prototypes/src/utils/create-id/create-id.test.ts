import { describe, expect, it } from 'vitest';

import { createId } from './index';

describe('createId', () => {
  it('prefixes twelve hex characters and does not repeat', () => {
    const id = createId('tsk');
    expect(id).toMatch(/^tsk_[0-9a-f]{12}$/);
    expect(createId('tsk')).not.toBe(id);
  });
});
