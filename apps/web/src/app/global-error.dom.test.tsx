import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// The font loaders only run inside Next's build; here they are replaced.
vi.mock('@synapcity/frontend-fonts/next', () => ({
  fontVariables: 'font-inter-var',
}));
const reportCaughtError = vi.hoisted(() => vi.fn());
vi.mock('@synapcity/frontend-error-reports', () => ({ reportCaughtError }));

import GlobalError from './global-error';

afterEach(() => vi.unstubAllGlobals());

describe('the global error page, mounted', () => {
  it('hands the error to error reports, which send it only with consent', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = Object.assign(new Error('boom'), { digest: 'abc123' });

    // It renders a whole document, so it is mounted on the document itself.
    render(<GlobalError error={error} retry={() => {}} />, {
      container: document,
    });

    expect(reportCaughtError).toHaveBeenCalledWith(error);
  });
});
