import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { ModeProvider } from '@synapcity/frontend-preferences';

import { SettingsProvider } from '..';
import { SettingsHeader } from '../../../shared/settings-page/settings-header';

const page = (name: string | null) => (
  <ModeProvider attribute="class" defaultTheme="system" enableSystem>
    <SettingsProvider name={name}>
      <SettingsHeader />
    </SettingsProvider>
  </ModeProvider>
);

const greeting = () =>
  screen.getByText(/This is your personal space/).textContent;

beforeEach(() => {
  localStorage.clear();
});

describe('the settings greeting', () => {
  it('greets the person by name', () => {
    render(page('Ada'));

    expect(greeting()).toMatch(/^Welcome, Ada\. /);
  });

  it('follows a saved name when the page re-renders with it', () => {
    const { rerender } = render(page('Ada'));

    rerender(page('Grace Hopper'));

    expect(greeting()).toMatch(/^Welcome, Grace Hopper\. /);
    expect(greeting()).not.toContain('Ada');
  });

  it('reads sensibly with no name, not "Welcome, ."', () => {
    render(page(null));

    expect(greeting()).toMatch(/^Welcome\. /);
    expect(greeting()).not.toMatch(/null|, \./);
  });

  it('copes with a name arriving after there was none', () => {
    const { rerender } = render(page(null));

    rerender(page('Ada'));

    expect(greeting()).toMatch(/^Welcome, Ada\. /);
  });
});
