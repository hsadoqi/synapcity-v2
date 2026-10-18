import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ requestAccountDeletion: vi.fn() }));

vi.mock('@/features/auth/server/actions/actions', () => ({
  requestAccountDeletion: mocks.requestAccountDeletion,
}));
vi.mock('next/navigation', () => ({
  usePathname: () => '/user-1/settings',
}));

import { DeleteAccount } from './delete-account';

const OWN = 'ada@example.com';

function openDialog() {
  fireEvent.click(screen.getByRole('button', { name: 'Delete account' }));
}

describe('DeleteAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requestAccountDeletion.mockResolvedValue({});
  });

  it('shows only the row until asked, and nothing is sent by opening the dialog', () => {
    render(<DeleteAccount email={OWN} />);

    expect(screen.queryByRole('alertdialog')).toBeNull();
    openDialog();

    expect(screen.getByRole('alertdialog')).toBeTruthy();
    expect(screen.getByText('Delete your account?')).toBeTruthy();
    expect(mocks.requestAccountDeletion).not.toHaveBeenCalled();
  });

  it('says what is lost, and that it cannot be undone', () => {
    render(<DeleteAccount email={OWN} />);
    openDialog();

    expect(screen.getByRole('alertdialog').textContent).toMatch(
      /deleted for good.*cannot be undone/i,
    );
  });

  it('asks the person to type their address, and names where the link goes', () => {
    render(<DeleteAccount email={OWN} />);
    openDialog();

    expect(
      screen.getByLabelText('Type your email address to continue'),
    ).toBeTruthy();
    expect(
      screen.getByText(/We will send a link to ada@example.com/),
    ).toBeTruthy();
  });

  it('sends what was typed, and then tells them to open the link, with nothing deleted yet', async () => {
    mocks.requestAccountDeletion.mockResolvedValue({
      success: true,
      message: `We sent a link to ${OWN}. Open it within 10 minutes to finish. Nothing is deleted until you confirm there.`,
      data: { user: { email: OWN } },
    });
    render(<DeleteAccount email={OWN} />);
    openDialog();

    fireEvent.change(
      screen.getByLabelText('Type your email address to continue'),
      { target: { value: OWN } },
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Send confirmation link' }),
    );

    await waitFor(() =>
      expect(screen.getByRole('status').textContent).toContain(
        'Nothing is deleted until you confirm',
      ),
    );
    const sent = mocks.requestAccountDeletion.mock.calls[0]![1] as FormData;
    expect(sent.get('email')).toBe(OWN);
    // The form is gone: it cannot be sent twice from here.
    expect(
      screen.queryByRole('button', { name: 'Send confirmation link' }),
    ).toBeNull();
    expect(screen.getByRole('button', { name: 'Close' })).toBeTruthy();
  });

  it('shows a refusal on the field and keeps what was typed', async () => {
    mocks.requestAccountDeletion.mockResolvedValue({
      error: 'That is not the email address on this account.',
      fields: ['email'],
      data: { user: { email: 'wrong@else.test' } },
    });
    render(<DeleteAccount email={OWN} />);
    openDialog();

    fireEvent.change(
      screen.getByLabelText('Type your email address to continue'),
      { target: { value: 'wrong@else.test' } },
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Send confirmation link' }),
    );

    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toContain(
        'not the email address on this account',
      ),
    );
    expect(
      (
        screen.getByLabelText(
          'Type your email address to continue',
        ) as HTMLInputElement
      ).value,
    ).toBe('wrong@else.test');
  });

  it('offers a way to sign in when the session has gone', async () => {
    mocks.requestAccountDeletion.mockResolvedValue({
      error: 'For your security, sign out, sign in again, then try once more.',
      signedOut: true,
      data: { user: { email: OWN } },
    });
    render(<DeleteAccount email={OWN} />);
    openDialog();

    fireEvent.click(
      screen.getByRole('button', { name: 'Send confirmation link' }),
    );

    await waitFor(() =>
      expect(screen.getByRole('link', { name: /sign in/i })).toBeTruthy(),
    );
  });

  it('cannot be used by an account with no address to confirm by', () => {
    render(<DeleteAccount email={null} />);

    expect(screen.queryByRole('button', { name: 'Delete account' })).toBeNull();
    expect(screen.getByText(/no email address/i)).toBeTruthy();
  });
});
