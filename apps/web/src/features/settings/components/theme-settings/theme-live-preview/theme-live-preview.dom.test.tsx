import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ThemeLivePreview } from '../theme-live-preview';

const wrapper = () =>
  screen.getByText('PREVIEW').parentElement!.parentElement as HTMLElement;

describe('ThemeLivePreview', () => {
  it('labels the preview window', () => {
    render(<ThemeLivePreview theme={{ mode: 'light' }} />);

    expect(screen.getByLabelText('Live workspace preview')).toBeTruthy();
    expect(screen.getByText('Live preview')).toBeTruthy();
  });

  it.each(['light', 'dark'] as const)(
    'forces the %s theme onto the preview only',
    (mode) => {
      render(<ThemeLivePreview theme={{ mode }} />);

      expect(wrapper().classList.contains(mode)).toBe(true);
    },
  );

  it('inherits the page theme in system mode', () => {
    render(<ThemeLivePreview theme={{ mode: 'system' }} />);

    expect(wrapper().classList.contains('light')).toBe(false);
    expect(wrapper().classList.contains('dark')).toBe(false);
    expect(wrapper().classList.contains('system')).toBe(false);
  });

  it('shows sample workspace content', () => {
    render(<ThemeLivePreview theme={{ mode: 'light' }} />);

    expect(screen.getByText('A little room to think.')).toBeTruthy();
    expect(screen.getByText('All notes')).toBeTruthy();
  });
});
