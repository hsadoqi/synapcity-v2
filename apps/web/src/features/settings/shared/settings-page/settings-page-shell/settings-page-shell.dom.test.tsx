import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SettingsPageShell } from '../settings-page-shell';

describe('SettingsPageShell', () => {
  it('puts its children in the main landmark', () => {
    render(
      <SettingsPageShell>
        <p>Content</p>
      </SettingsPageShell>,
    );

    expect(screen.getByRole('main').contains(screen.getByText('Content'))).toBe(
      true,
    );
  });
});
