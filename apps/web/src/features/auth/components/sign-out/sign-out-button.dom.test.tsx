import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ signOut: vi.fn() }));
vi.mock('@/features/auth/server/actions/actions', () => ({
  signOut: mocks.signOut,
}));

import { SignOutButton } from './sign-out-button';

describe('SignOutButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is a form that runs the sign-out action', async () => {
    mocks.signOut.mockResolvedValue(undefined);
    render(<SignOutButton />);

    await act(async () => {
      fireEvent.submit(
        screen.getByRole('button', { name: 'Sign out' }).closest('form')!,
      );
    });

    expect(mocks.signOut).toHaveBeenCalledTimes(1);
  });

  it('disables itself and says so while signing out', async () => {
    mocks.signOut.mockReturnValue(new Promise(() => {}));
    render(<SignOutButton />);

    await act(async () => {
      fireEvent.submit(
        screen.getByRole('button', { name: 'Sign out' }).closest('form')!,
      );
    });

    const button = screen.getByRole('button', { name: 'Signing out…' });
    expect(button.hasAttribute('disabled')).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
  });
});
