import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SettingsFooter } from '../settings-footer';

describe('SettingsFooter', () => {
  it('is a footer that says where preferences are kept', () => {
    render(<SettingsFooter />);

    expect(screen.getByRole('contentinfo')).toBeTruthy();
    expect(
      screen.getByText('Your preferences stay in this browser.'),
    ).toBeTruthy();
  });
});
