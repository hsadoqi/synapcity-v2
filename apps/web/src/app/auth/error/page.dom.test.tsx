import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import AuthErrorPage from './page';

const show = async (reason?: string) =>
  render(await AuthErrorPage({ searchParams: Promise.resolve({ reason }) }));

describe('the sign-in problem page', () => {
  it.each([
    ['oauth', 'Signing in with that provider did not finish'],
    ['confirm', 'That confirmation link did not work'],
    ['reset', 'That reset link did not work'],
    ['email-change', 'That email confirmation link did not work'],
    ['link', 'That account could not be connected'],
    [undefined, 'That link did not work'],
    ['something-else', 'That link did not work'],
  ])('explains the %s failure', async (reason, title) => {
    await show(reason);

    expect(screen.getByRole('heading', { level: 1, name: title })).toBeTruthy();
  });

  it('offers a way forward for an email change that failed, pointing at settings', async () => {
    await show('email-change');

    expect(screen.getByRole('link', { name: 'Sign in' })).toBeTruthy();
    expect(
      screen.getByText(/ask for the change again from your settings/i),
    ).toBeTruthy();
  });
});
