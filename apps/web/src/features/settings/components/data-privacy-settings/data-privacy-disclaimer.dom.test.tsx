import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DataPrivacyDisclaimer } from './data-privacy-disclaimer';

describe('DataPrivacyDisclaimer', () => {
  it('says nothing is collected without consent and links the notice', () => {
    render(<DataPrivacyDisclaimer />);

    expect(screen.getByText(/Nothing is collected or sent/)).toBeTruthy();
    expect(
      screen
        .getByRole('link', { name: 'Read the privacy notice' })
        .getAttribute('href'),
    ).toBe('/privacy');
  });
});
