import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthState } from '@/features/auth/types';
import { ConnectedAccountsProvider } from '@/features/auth/client';

const mocks = vi.hoisted(() => ({
  connectAccount: vi.fn(),
  disconnectAccount: vi.fn(),
}));
vi.mock('@/features/auth/server/actions/actions', () => ({
  connectAccount: mocks.connectAccount,
  disconnectAccount: mocks.disconnectAccount,
}));
vi.mock('next/navigation', () => ({ usePathname: () => '/u1/settings' }));

import { ConnectedAccounts } from './connected-accounts';

const show = (
  accounts: { provider: 'google' | 'github'; detail: string | null }[] = [],
) =>
  render(
    <ConnectedAccountsProvider accounts={accounts}>
      <ConnectedAccounts />
    </ConnectedAccountsProvider>,
  );
const row = (name: string) =>
  screen.getByText(name, { selector: 'span' }).closest('li')!;

describe('ConnectedAccounts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is a labelled group with a row for Google and one for GitHub', () => {
    show();

    expect(
      screen.getByRole('group', { name: 'Connected accounts' }),
    ).toBeTruthy();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(row('Google')).toBeTruthy();
    expect(row('GitHub')).toBeTruthy();
  });

  it('says "Not connected" and offers to connect, for each account that is not', () => {
    show();

    for (const name of ['Google', 'GitHub']) {
      expect(within(row(name)).getByText('Not connected')).toBeTruthy();
      expect(
        within(row(name)).getByRole('button', { name: `Connect ${name}` }),
      ).toBeTruthy();
    }
  });

  it('says "Connected as …" with the address or username, and offers no button', () => {
    show([
      { provider: 'google', detail: 'ada@gmail.com' },
      { provider: 'github', detail: 'ada-l' },
    ]);

    expect(
      within(row('Google')).getByText('Connected as ada@gmail.com'),
    ).toBeTruthy();
    expect(within(row('GitHub')).getByText('Connected as ada-l')).toBeTruthy();
    // Connected means it can be disconnected, not connected again.
    expect(screen.queryByRole('button', { name: /^Connect / })).toBeNull();
    expect(screen.getAllByRole('button', { name: /^Disconnect/ })).toHaveLength(
      2,
    );
  });

  it('says just "Connected" when the account gave nothing to show', () => {
    show([{ provider: 'google', detail: null }]);

    expect(within(row('Google')).getByText('Connected')).toBeTruthy();
  });

  it('mixes the two: one connected, one still offered', () => {
    show([{ provider: 'github', detail: 'ada-l' }]);

    expect(within(row('Google')).getByText('Not connected')).toBeTruthy();
    expect(
      within(row('GitHub')).queryByRole('button', { name: /^Connect / }),
    ).toBeNull();
    expect(
      within(row('GitHub')).getByRole('button', { name: /Disconnect/ }),
    ).toBeTruthy();
    expect(
      within(row('Google')).queryByRole('button', { name: /^Disconnect/ }),
    ).toBeNull();
  });

  it('hides the status icon from screen readers', () => {
    const { container } = show([{ provider: 'google', detail: 'x@y.z' }]);

    expect(container.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
  });

  it('sends the provider, and only that, when connecting', async () => {
    mocks.connectAccount.mockResolvedValue({});
    show();

    await act(async () => {
      fireEvent.submit(
        within(row('GitHub'))
          .getByRole('button', { name: 'Connect GitHub' })
          .closest('form')!,
      );
    });

    const formData = mocks.connectAccount.mock.calls[0]![1] as FormData;
    expect(formData.get('provider')).toBe('github');
    expect([...formData.keys()]).toEqual(['provider']);
  });

  it('shows a refusal under the row it belongs to, and leaves the other row alone', async () => {
    mocks.connectAccount.mockResolvedValue({
      error: 'Connecting accounts is not turned on for this app yet.',
    } satisfies AuthState);
    show();

    await act(async () => {
      fireEvent.submit(
        within(row('Google'))
          .getByRole('button', { name: 'Connect Google' })
          .closest('form')!,
      );
    });

    expect(within(row('Google')).getByRole('alert').textContent).toBe(
      'Connecting accounts is not turned on for this app yet.',
    );
    expect(within(row('GitHub')).queryByRole('alert')).toBeNull();
  });

  it('offers a way back in when the session has gone', async () => {
    mocks.connectAccount.mockResolvedValue({
      error: 'For your security, sign out, sign in again, then try once more.',
      signedOut: true,
    } satisfies AuthState);
    show();

    await act(async () => {
      fireEvent.submit(
        within(row('Google'))
          .getByRole('button', { name: 'Connect Google' })
          .closest('form')!,
      );
    });

    expect(
      within(row('Google'))
        .getByRole('link', { name: 'Sign in again' })
        .getAttribute('href'),
    ).toBe('/auth/login?next=%2Fu1%2Fsettings');
  });

  it('says it is opening, and cannot be pressed twice meanwhile', async () => {
    let finish!: (state: AuthState) => void;
    mocks.connectAccount.mockReturnValue(
      new Promise<AuthState>((resolve) => {
        finish = resolve;
      }),
    );
    show();

    await act(async () => {
      fireEvent.submit(
        within(row('Google'))
          .getByRole('button', { name: 'Connect Google' })
          .closest('form')!,
      );
    });

    const button = within(row('Google')).getByRole('button', {
      name: 'Opening…',
    });
    expect(button.hasAttribute('disabled')).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');

    await act(async () => finish({}));
  });

  describe('disconnecting', () => {
    const open = (name: string) =>
      fireEvent.click(
        within(row(name)).getByRole('button', {
          name: new RegExp(`Disconnect`),
        }),
      );
    const confirm = async () =>
      act(async () => {
        fireEvent.submit(
          within(screen.getByRole('alertdialog'))
            .getByRole('button', { name: 'Disconnect' })
            .closest('form')!,
        );
      });

    beforeEach(() => {
      mocks.disconnectAccount.mockResolvedValue({});
    });

    it('asks first, saying what changes, and sends nothing by opening the dialog', () => {
      show([{ provider: 'github', detail: 'ada-l' }]);

      open('GitHub');

      expect(screen.getByRole('alertdialog').textContent).toMatch(
        /no longer be able to sign in with GitHub.*connect it again/i,
      );
      expect(mocks.disconnectAccount).not.toHaveBeenCalled();
    });

    it('sends the provider, and only that', async () => {
      show([{ provider: 'github', detail: 'ada-l' }]);
      open('GitHub');

      await confirm();

      const formData = mocks.disconnectAccount.mock.calls[0]![1] as FormData;
      expect(formData.get('provider')).toBe('github');
      expect([...formData.keys()]).toEqual(['provider']);
    });

    it('shows the refusal inside the dialog, such as the last way to sign in', async () => {
      mocks.disconnectAccount.mockResolvedValue({
        error:
          'That is your only way to sign in. Add a password or connect another account first.',
      } satisfies AuthState);
      show([{ provider: 'google', detail: 'ada@gmail.com' }]);
      open('Google');

      await confirm();

      expect(
        within(screen.getByRole('alertdialog')).getByRole('alert').textContent,
      ).toContain('only way to sign in');
    });

    it('offers a way back in when the session has gone', async () => {
      mocks.disconnectAccount.mockResolvedValue({
        error:
          'For your security, sign out, sign in again, then try once more.',
        signedOut: true,
      } satisfies AuthState);
      show([{ provider: 'google', detail: null }]);
      open('Google');

      await confirm();

      expect(
        within(screen.getByRole('alertdialog')).getByRole('link', {
          name: 'Sign in again',
        }),
      ).toBeTruthy();
    });
  });
});
