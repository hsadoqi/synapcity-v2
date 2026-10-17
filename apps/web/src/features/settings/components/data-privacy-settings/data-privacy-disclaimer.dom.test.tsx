import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DataPrivacyDisclaimer } from './data-privacy-disclaimer';

describe('DataPrivacyDisclaimer', () => {
  it('says the choices stay in this browser and no usage data is sent', () => {
    render(<DataPrivacyDisclaimer />);

    expect(screen.getByText(/stored only in this browser/)).toBeTruthy();
    expect(screen.getByText(/does not send\s+usage data/)).toBeTruthy();
  });
});
