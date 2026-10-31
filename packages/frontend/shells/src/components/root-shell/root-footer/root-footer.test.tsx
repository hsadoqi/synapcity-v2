import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { RootFooter } from '.';

afterEach(() => vi.useRealTimers());

describe('RootFooter', () => {
  it('is the contentinfo landmark', () => {
    render(<RootFooter />);

    expect(screen.getByRole('contentinfo')).toBeTruthy();
  });

  it('states the copyright for the current year', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2031-06-15T12:00:00Z'));
    render(<RootFooter />);

    expect(screen.getByRole('contentinfo').textContent).toContain(
      '© 2031 Synapcity. All rights reserved.',
    );
  });
});
