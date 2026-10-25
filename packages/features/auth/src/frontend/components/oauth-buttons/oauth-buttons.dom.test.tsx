import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { OAuthButtons } from '.';

describe('OAuthButtons', () => {
  it('offers Google and GitHub, each submitting its own provider', () => {
    render(<OAuthButtons signInWithOAuth={vi.fn()} next="/after" />);

    const google = screen.getByRole('button', { name: 'Continue with Google' });
    const github = screen.getByRole('button', { name: 'Continue with GitHub' });
    expect(google.getAttribute('name')).toBe('provider');
    expect(google.getAttribute('value')).toBe('google');
    expect(github.getAttribute('name')).toBe('provider');
    expect(github.getAttribute('value')).toBe('github');
  });

  it('carries the destination across the provider round trip', () => {
    const { container } = render(
      <OAuthButtons signInWithOAuth={vi.fn()} next="/after" />,
    );

    expect(
      (container.querySelector('input[name="next"]') as HTMLInputElement).value,
    ).toBe('/after');
  });
});
