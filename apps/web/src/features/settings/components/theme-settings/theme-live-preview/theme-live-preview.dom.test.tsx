import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ThemeLivePreview } from '../theme-live-preview';

const preview = () =>
  screen.getByRole('figure', { name: 'Live workspace preview' });

describe('ThemeLivePreview', () => {
  it('is one named figure with a visible caption', () => {
    render(<ThemeLivePreview theme={{ mode: 'light' }} />);

    expect(preview()).toBeTruthy();
    expect(screen.getByText('Live preview')).toBeTruthy();
  });

  it.each(['light', 'dark'] as const)(
    'forces the %s theme onto the preview only',
    (mode) => {
      render(<ThemeLivePreview theme={{ mode }} />);

      expect(preview().classList.contains(mode)).toBe(true);
    },
  );

  it('inherits the page theme in system mode', () => {
    render(<ThemeLivePreview theme={{ mode: 'system' }} />);

    expect(preview().classList.contains('light')).toBe(false);
    expect(preview().classList.contains('dark')).toBe(false);
    expect(preview().classList.contains('system')).toBe(false);
  });

  it('shows sample workspace content', () => {
    render(<ThemeLivePreview theme={{ mode: 'light' }} />);

    expect(screen.getByText('A little room to think.')).toBeTruthy();
    expect(screen.getByText('All notes')).toBeTruthy();
  });

  it('keeps the sample content out of the accessibility tree and the outline', () => {
    render(<ThemeLivePreview theme={{ mode: 'light' }} />);

    expect(screen.queryByRole('heading')).toBeNull();
    expect(
      screen.getByText('A little room to think.').closest('[aria-hidden]'),
    ).toBeTruthy();
  });
});
