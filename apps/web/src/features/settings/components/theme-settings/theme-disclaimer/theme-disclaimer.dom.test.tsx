import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ThemeDisclaimer } from '../theme-disclaimer';

describe('ThemeDisclaimer', () => {
  it('explains that system mode follows the device', () => {
    render(<ThemeDisclaimer theme={{ mode: 'system' }} />);

    expect(
      screen.getByText(
        'Your theme will change automatically with your device.',
      ),
    ).toBeTruthy();
  });

  it.each(['light', 'dark'] as const)('names the fixed %s mode', (mode) => {
    render(<ThemeDisclaimer theme={{ mode }} />);

    expect(
      screen.getByText(`Your workspace is always in ${mode} mode.`),
    ).toBeTruthy();
  });
});
