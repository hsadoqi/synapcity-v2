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

  const press = () =>
    fireEvent.click(
      screen.getByRole('button', { name: 'Permanently delete my account' }),
    );
  const alertText = async () =>
    (await screen.findByRole('alert')).textContent ?? '';

  it('keeps the button after a failure that trying again can fix', async () => {
    mocks.confirm.mockResolvedValue({
      error:
        'Could not delete your account. Nothing was deleted. Try again in a moment.',
    });
    show();
    press();

    expect(await alertText()).toContain('Try again in a moment');
    expect(
      screen.getByRole('button', { name: 'Permanently delete my account' }),
    ).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Keep my account' })).toBeTruthy();
  });

  it('when a new link is needed, offers settings instead of a delete that cannot work', async () => {
    mocks.confirm.mockResolvedValue({
      error:
        'This confirmation has expired, so nothing was deleted. Ask for a new link from your settings.',
      linkRequired: true,
    });
    show();
    press();

    expect(await alertText()).toContain('Ask for a new link');
    expect(
      screen.queryByRole('button', { name: /delete my account/i }),
    ).toBeNull();
    expect(
      screen
        .getByRole('link', { name: 'Get a new link in settings' })
        .getAttribute('href'),
    ).toBe('/u1/settings');
  });

  it('says the photo was already removed when a retryable failure came after it', async () => {
    mocks.confirm.mockResolvedValue({
      error:
        'Your account was not deleted. Your uploaded photo was removed from your profile. Try again in a moment.',
    });
    show();
    press();

    expect(await alertText()).toContain(
      'Your uploaded photo was removed from your profile.',
    );
    expect(
      screen.getByRole('button', { name: 'Permanently delete my account' }),
    ).toBeTruthy();
  });

  it('says the photo was already removed when the link also needs renewing', async () => {
    mocks.confirm.mockResolvedValue({
      error:
        'This confirmation has expired, so your account was not deleted. Your uploaded photo was removed from your profile. Ask for a new link from your settings.',
      linkRequired: true,
    });
    show();
    press();

    const text = await alertText();
    expect(text).toContain(
      'Your uploaded photo was removed from your profile.',
    );
    expect(text).toContain('your account was not deleted');
    expect(
      screen.queryByRole('button', { name: /delete my account/i }),
    ).toBeNull();
  });

  it('cannot be pressed twice while the deletion is running', async () => {
    // Success ends in a redirect from the action, so the card's last state
    // is the in-flight one.
    let finish!: (state: object) => void;
    mocks.confirm.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    show();
    press();

    const busy = await screen.findByRole('button', { name: 'Deleting…' });
    expect(busy.hasAttribute('disabled')).toBe(true);
    expect(busy.getAttribute('aria-busy')).toBe('true');
    fireEvent.click(busy);
    expect(mocks.confirm).toHaveBeenCalledOnce();
    finish({});
  });
});
