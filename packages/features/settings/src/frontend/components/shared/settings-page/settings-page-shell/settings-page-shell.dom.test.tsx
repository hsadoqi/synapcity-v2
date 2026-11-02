import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SettingsPageShell } from '.';

describe('SettingsPageShell', () => {
  it('renders its children', () => {
    render(
      <SettingsPageShell>
        <p>Content</p>
      </SettingsPageShell>,
    );

    expect(screen.getByText('Content')).toBeTruthy();
  });

  // The app shell's RootContent renders the page's one <main>; a second one
  // inside it is a nested landmark that screen readers announce twice.
  it('adds no main landmark of its own', () => {
    render(
      <SettingsPageShell>
        <p>Content</p>
      </SettingsPageShell>,
    );

    expect(screen.queryByRole('main')).toBeNull();
  });

  // RootContent shrinks to the screen only for a page marked this way, so the
  // tab content scrolls instead of the page.
  it('marks itself as filling the screen', () => {
    const { container } = render(
      <SettingsPageShell>
        <p>Content</p>
      </SettingsPageShell>,
    );

    expect(
      container.firstElementChild?.hasAttribute('data-fill-viewport'),
    ).toBe(true);
  });
});
