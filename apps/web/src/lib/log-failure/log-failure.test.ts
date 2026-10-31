import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { logFailure } from './log-failure';

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe('logFailure', () => {
  it('logs the operation with the code and status only', () => {
    const error = Object.assign(new Error('secret message'), {
      code: 'x_failed',
      status: 500,
      details: 'row data',
    });

    logFailure('saveThing', error);

    expect(console.warn).toHaveBeenCalledWith('saveThing failed', {
      code: 'x_failed',
      status: 500,
    });
    expect(JSON.stringify(vi.mocked(console.warn).mock.calls)).not.toContain(
      'secret',
    );
  });

  it('adds the detail fields it is given', () => {
    logFailure('connectAccount', { code: 'c' }, { provider: 'google' });

    expect(console.warn).toHaveBeenCalledWith('connectAccount failed', {
      provider: 'google',
      code: 'c',
      status: undefined,
    });
  });

  it('logs without a failure', () => {
    logFailure('signOut', undefined, { thrown: true });

    expect(console.warn).toHaveBeenCalledWith('signOut failed', {
      thrown: true,
      code: undefined,
      status: undefined,
    });
  });

  it('never lets detail overwrite the code or status', () => {
    logFailure('op', { code: 'real' }, { code: 'fake' });

    expect(vi.mocked(console.warn).mock.calls[0]?.[1]).toMatchObject({
      code: 'real',
    });
  });
});
