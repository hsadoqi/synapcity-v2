import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { UpdatePasswordCard } from './update-password-card';

describe('UpdatePasswordCard', () => {
  it('is the new-password page with one h1 and the form', () => {
    render(<UpdatePasswordCard updatePassword={vi.fn()} next="" />);

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Choose a new password',
    );
    expect(screen.getByLabelText('New password')).toBeTruthy();
    expect(screen.getByLabelText('Confirm new password')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Update password' }),
    ).toBeTruthy();
  });
});
