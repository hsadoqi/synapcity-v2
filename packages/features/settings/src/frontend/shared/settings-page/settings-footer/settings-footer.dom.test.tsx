import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SettingsFooter } from '../settings-footer';

describe('SettingsFooter', () => {
  it('is a footer that says preferences stay in this browser when not synced', () => {
    render(<SettingsFooter />);

    expect(screen.getByRole('contentinfo')).toBeTruthy();
    expect(
      screen.getByText('Your preferences stay in this browser.'),
    ).toBeTruthy();
  });

  // Saying "this browser" while the account is the store would be false.
  it('says most preferences are saved to the account when synced', () => {
    render(<SettingsFooter syncsToAccount />);

    expect(
      screen.getByText(
        'Most preferences are saved to your account. A few, like text size, stay on this device.',
      ),
    ).toBeTruthy();
    expect(
      screen.queryByText('Your preferences stay in this browser.'),
    ).toBeNull();
  });
});
