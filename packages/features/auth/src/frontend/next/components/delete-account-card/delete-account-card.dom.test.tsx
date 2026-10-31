import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ confirm: vi.fn() }));

vi.mock('next/navigation', () => ({
  usePathname: () => '/auth/delete-account',
}));

import { DeleteAccountCard } from './delete-account-card';

const show = (email: string | null = 'ada@example.com') =>
  render(
    <DeleteAccountCard
      email={email}
      settingsHref="/u1/settings"
      confirmAccountDeletion={mocks.confirm}
    />,
  );

describe('DeleteAccountCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.confirm.mockResolvedValue({});
  });

  it('deletes nothing on arrival: it waits for the button', () => {
    show();

    expect(
      screen.getByRole('button', { name: 'Permanently delete my account' }),
    ).toBeTruthy();
    expect(screen.getByText(/cannot be undone/i)).toBeTruthy();
    expect(mocks.confirm).not.toHaveBeenCalled();
  });

  it('offers to keep the account, back to settings', () => {
    show();

    expect(
      screen
        .getByRole('link', { name: 'Keep my account' })
        .getAttribute('href'),
    ).toBe('/u1/settings');
  });

  it('names the confirmed address when there is one', () => {
    show();
    expect(screen.getByText(/You confirmed ada@example.com/)).toBeTruthy();
  });

  it('deletes once the button is pressed', async () => {
    show();

    fireEvent.click(
      screen.getByRole('button', { name: 'Permanently delete my account' }),
    );

    await waitFor(() => expect(mocks.confirm).toHaveBeenCalledOnce());
  });

  it('shows why nothing was deleted', async () => {
    mocks.confirm.mockResolvedValue({
      error: 'This confirmation has expired, so nothing was deleted.',
      linkRequired: true,
    });
    show();

    fireEvent.click(
      screen.getByRole('button', { name: 'Permanently delete my account' }),
    );

    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toContain(
        'nothing was deleted',
      ),
    );
  });
});
