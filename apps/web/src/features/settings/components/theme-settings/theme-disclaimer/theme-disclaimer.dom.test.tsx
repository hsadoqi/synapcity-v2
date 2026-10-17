import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ThemeDisclaimer } from '../theme-disclaimer';

describe('ThemeDisclaimer', () => {
  it('explains that system mode follows the device', () => {
    render(<ThemeDisclaimer theme={{ mode: 'system' }} />);

    expect(
      screen.getByText(
        'Follows your device, switching between light and dark with it.',
      ),
    ).toBeTruthy();
  });

  it.each(['light', 'dark'] as const)('names the fixed %s mode', (mode) => {
    render(<ThemeDisclaimer theme={{ mode }} />);

    expect(
      screen.getByText(`Always ${mode}, whatever your device is set to.`),
    ).toBeTruthy();
  });
});
