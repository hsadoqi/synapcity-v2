import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SettingsTabShell } from '.';

describe('SettingsTabShell', () => {
  it('shows its title and description', () => {
    render(
      <SettingsTabShell title="Notifications" description="Stay in the loop.">
        <p>Body</p>
      </SettingsTabShell>,
    );

    expect(screen.getByText('Notifications')).toBeTruthy();
    expect(screen.getByText('Stay in the loop.')).toBeTruthy();
  });

  it('renders its children in the card content', () => {
    render(
      <SettingsTabShell title="T" description="D">
        <p>Body</p>
      </SettingsTabShell>,
    );

    expect(
      document
        .querySelector('[data-slot="card-content"]')
        ?.contains(screen.getByText('Body')),
    ).toBe(true);
  });
});
