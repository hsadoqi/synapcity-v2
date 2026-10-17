import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EmailSummary } from './email-summary';

describe('EmailSummary', () => {
  it('shows the address under an Email label', () => {
    render(<EmailSummary email="ada@example.com" />);

    expect(screen.getByText('Email')).toBeTruthy();
    expect(screen.getByText('ada@example.com')).toBeTruthy();
  });

  it('says so when the account has no email', () => {
    render(<EmailSummary email={null} />);

    expect(screen.getByText('No email on this account')).toBeTruthy();
  });

  it('offers no way to edit it: changing it is a sign-in change', () => {
    render(<EmailSummary email="ada@example.com" />);

    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });
});
