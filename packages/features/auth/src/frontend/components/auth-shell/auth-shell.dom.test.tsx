import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AuthShell } from './auth-shell';

describe('AuthShell', () => {
  it('has exactly one h1, the title, which can take focus but is not a tab stop', () => {
    render(<AuthShell title="Sign in" />);

    const heading = screen.getByRole('heading', { level: 1, name: 'Sign in' });
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(heading.getAttribute('tabindex')).toBe('-1');
    heading.focus();
    expect(document.activeElement).toBe(heading);
  });

  it('shows the description, the content and the footer when given', () => {
    render(
      <AuthShell
        title="Sign up"
        description="Create your account."
        footer={<button type="button">Sign in</button>}
      >
        <p>The form</p>
      </AuthShell>,
    );

    expect(screen.getByText('Create your account.')).toBeTruthy();
    expect(screen.getByText('The form')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeTruthy();
  });

  it('leaves out what it was not given, without empty boxes', () => {
    const { container } = render(<AuthShell title="Sign in" />);

    expect(container.querySelector('[data-slot="card-content"]')).toBeNull();
    expect(container.querySelector('[data-slot="card-footer"]')).toBeNull();
    expect(
      container.querySelector('[data-slot="card-description"]'),
    ).toBeNull();
  });
});
