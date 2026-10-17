import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CurrentUser } from '@/features/auth/shared/current-user';

const mocks = vi.hoisted(() => ({
  user: null as CurrentUser | null,
  pending: null as string | null,
  accounts: [] as { provider: 'google' | 'github'; detail: string | null }[],
  updateName: vi.fn(),
  updateAvatar: vi.fn(),
}));

vi.mock('@/features/auth/client', () => ({
  useCurrentUser: () => mocks.user,
  usePendingEmail: () => mocks.pending,
  useConnectedAccounts: () => mocks.accounts,
  useCooldown: () => 0,
}));
vi.mock('@/features/auth/server/actions/actions', () => ({
  requestEmailChange: vi.fn(),
  resendEmailChange: vi.fn(),
  requestOwnPasswordReset: vi.fn(),
  connectAccount: vi.fn(),
  requestAccountDeletion: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  usePathname: () => '/user-1/settings',
}));
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ auth: { refreshSession: async () => ({}) } }),
}));
vi.mock('@/features/account/server/actions/name-actions', () => ({
  updateName: mocks.updateName,
}));
vi.mock('@/features/account/server/actions/avatar-actions', () => ({
  updateAvatar: mocks.updateAvatar,
}));

import { AccountSettings } from './index';

describe('AccountSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.pending = null;
    mocks.accounts = [];
    mocks.user = {
      id: 'user-1',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      imageUrl: null,
    };
  });

  it('shows the signed-in profile and email, each editable only where it can be', () => {
    render(<AccountSettings />);

    expect(screen.getByText('Ada Lovelace')).toBeTruthy();
    expect(screen.getByText('ada@example.com')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Edit name' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Edit photo' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Change email' })).toBeTruthy();
  });

  it('changes the email through the auth form, which asks for a confirmation', () => {
    render(<AccountSettings />);

    fireEvent.click(screen.getByRole('button', { name: 'Change email' }));

    expect(screen.getByLabelText('New email address')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Send confirmation link' }),
    ).toBeTruthy();
    // The profile editors are not affected.
    expect(screen.getByRole('button', { name: 'Edit name' })).toBeTruthy();
  });

  it('shows a change that is waiting for confirmation, and not a second way to start one', () => {
    mocks.pending = 'grace@example.com';
    render(<AccountSettings />);

    expect(screen.getByRole('status').textContent).toContain(
      'Waiting for you to confirm grace@example.com',
    );
    expect(screen.queryByRole('button', { name: 'Change email' })).toBeNull();
  });

  it('keeps the password out of the browser: no password field is rendered', () => {
    render(<AccountSettings />);

    expect(screen.queryByLabelText(/password/i)).toBeNull();
  });

  it('resets the password by email, from the sign-in details', () => {
    render(<AccountSettings />);

    expect(screen.getByText('Password')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Send reset link' }),
    ).toBeTruthy();
  });

  it('edits the name through the account form, with just that field', () => {
    render(<AccountSettings />);

    fireEvent.click(screen.getByRole('button', { name: 'Edit name' }));

    const input = screen.getByLabelText('Name') as HTMLInputElement;
    expect(input.value).toBe('Ada Lovelace');
    expect(screen.queryByLabelText('Photo')).toBeNull();
  });

  it('copes with an account that has no name or email', () => {
    mocks.user = { id: 'user-1', name: null, email: null, imageUrl: null };
    render(<AccountSettings />);

    expect(screen.getByText('No name yet')).toBeTruthy();
    expect(screen.getByText('No email on this account')).toBeTruthy();
  });

  it('asks to sign in when there is no user', () => {
    mocks.user = null;
    render(<AccountSettings />);

    expect(screen.getByText('Sign in to manage your account.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /edit/i })).toBeNull();
  });

  it('shows which Google and GitHub accounts are connected, beside the other sign-in details', () => {
    mocks.accounts = [{ provider: 'github', detail: 'ada-l' }];
    render(<AccountSettings />);

    expect(
      screen.getByRole('group', { name: 'Connected accounts' }),
    ).toBeTruthy();
    expect(screen.getByText('Connected as ada-l')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Connect Google' })).toBeTruthy();
  });

  it('puts account deletion last, and offers it only to an account with an address to confirm by', () => {
    const { unmount } = render(<AccountSettings />);
    const buttons = screen.getAllByRole('button').map((b) => b.textContent);
    expect(buttons.at(-1)).toBe('Delete account');
    unmount();

    mocks.user = { id: 'user-1', name: 'Ada', email: null, imageUrl: null };
    render(<AccountSettings />);
    expect(screen.queryByRole('button', { name: 'Delete account' })).toBeNull();
    expect(screen.getByText(/no email address/i)).toBeTruthy();
  });
});
