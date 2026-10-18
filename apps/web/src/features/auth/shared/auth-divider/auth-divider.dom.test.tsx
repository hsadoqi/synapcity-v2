import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AuthDivider } from './auth-divider';

describe('AuthDivider', () => {
  it('says "or" by default', () => {
    render(<AuthDivider />);

    expect(screen.getByText('or')).toBeTruthy();
  });

  it('shows a custom label between two rules', () => {
    const { container } = render(
      <AuthDivider label="or continue with email" />,
    );

    expect(screen.getByText('or continue with email')).toBeTruthy();
    expect(container.querySelectorAll('[data-slot="separator"]')).toHaveLength(
      2,
    );
  });
});
