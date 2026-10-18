import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import PrivacyPage from './page';

describe('the privacy notice', () => {
  it('has one title and a section per subject', () => {
    render(<PrivacyPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Privacy' }),
    ).toBeTruthy();
    expect(
      screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent),
    ).toEqual([
      'Error reports',
      'Activity tracking and data sharing',
      'Your browser’s privacy signal',
      'Where your choices are kept',
      'When this notice changes',
    ]);
  });

  it('names who receives error reports and says the rest collect nothing yet', () => {
    render(<PrivacyPage />);

    expect(screen.getByText(/sends a report to Sentry/)).toBeTruthy();
    expect(
      screen.getByText(/stores reports in the United States/),
    ).toBeTruthy();
    expect(
      screen.getByText(/nothing is collected for activity\s+tracking/),
    ).toBeTruthy();
  });
});
