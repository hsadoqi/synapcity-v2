import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AuthPageShell } from '../auth-page-shell';

describe('AuthPageShell', () => {
  it('renders its children', () => {
    render(
      <AuthPageShell>
        <h1>Sign in</h1>
      </AuthPageShell>,
    );

    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeTruthy();
  });

  it('adds no landmark of its own', () => {
    render(<AuthPageShell>Body</AuthPageShell>);

    expect(screen.queryByRole('main')).toBeNull();
    expect(screen.queryByRole('banner')).toBeNull();
  });
});
