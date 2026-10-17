import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthState } from '@/features/auth/types';
import { PendingEmailProvider } from '@/features/auth/client';

const mocks = vi.hoisted(() => ({
  requestEmailChange: vi.fn(),
  resendEmailChange: vi.fn(),
  refresh: vi.fn(),
  refreshSession: vi.fn(),
}));

vi.mock('@/features/auth/server/actions/actions', () => ({
  requestEmailChange: mocks.requestEmailChange,
  resendEmailChange: mocks.resendEmailChange,
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
  usePathname: () => '/u1/settings',
}));
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ auth: { refreshSession: mocks.refreshSession } }),
}));

import { EmailChange } from './email-change';

const CURRENT = 'ada@example.com';
const NEW = 'grace@example.com';

const page = (pending: string | null) => (
  <PendingEmailProvider pendingEmail={pending}>
    <EmailChange email={CURRENT} />
  </PendingEmailProvider>
);
const show = (pending: string | null = null) => render(page(pending));
const open = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Change email' }));
const newEmail = () =>
  screen.getByLabelText('New email address') as HTMLInputElement;
const send = () =>
  act(async () => {
    fireEvent.submit(newEmail().form!);
  });

describe('EmailChange', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.refreshSession.mockResolvedValue({});
  });

  describe('at rest', () => {
    it('shows the address and offers to change it', () => {
      show();

      expect(screen.getByText('Email')).toBeTruthy();
      expect(screen.getByText(CURRENT)).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Change email' })).toBeTruthy();
      expect(screen.queryByRole('status')).toBeNull();
    });

    it('copes with an account that has no email', () => {
      render(
        <PendingEmailProvider pendingEmail={null}>
          <EmailChange email={null} />
        </PendingEmailProvider>,
      );

      expect(screen.getByText('No email on this account')).toBeTruthy();
    });
  });

  describe('changing it', () => {
    it('opens a labelled field, focused, saying nothing changes until the link is used', () => {
      show();

      open();

      expect(document.activeElement).toBe(newEmail());
      expect(newEmail().type).toBe('email');
      expect(newEmail().autocomplete).toBe('email');
      expect(newEmail().getAttribute('aria-describedby')).toBe('email-hint');
      expect(document.getElementById('email-hint')?.textContent).toMatch(
        /does not change until you use it/i,
      );
      expect(newEmail().form!.noValidate).toBe(true);
    });

    it('can be cancelled without sending anything', () => {
      show();
      open();

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(screen.queryByLabelText('New email address')).toBeNull();
      expect(screen.getByRole('button', { name: 'Change email' })).toBeTruthy();
      expect(mocks.requestEmailChange).not.toHaveBeenCalled();
    });

    it('sends the typed address to the action', async () => {
      mocks.requestEmailChange.mockResolvedValue({});
      show();
      open();
      fireEvent.change(newEmail(), { target: { value: NEW } });

      await send();

      const formData = mocks.requestEmailChange.mock.calls[0]![1] as FormData;
      expect(formData.get('email')).toBe(NEW);
    });

    it('says it is sending, and cannot be sent twice meanwhile', async () => {
      // Finished at the end: React holds later updates back while an action
      // is still pending, so leaving it open would break the tests after it.
      let finish!: (state: AuthState) => void;
      mocks.requestEmailChange.mockReturnValue(
        new Promise<AuthState>((resolve) => {
          finish = resolve;
        }),
      );
      show();
      open();

      await send();

      const button = screen.getByRole('button', { name: 'Sending…' });
      expect(button.hasAttribute('disabled')).toBe(true);
      expect(button.getAttribute('aria-busy')).toBe('true');

      await act(async () => finish({}));
    });

    it('closes the form once the request is accepted, and says so until the server reports it waiting', async () => {
      mocks.requestEmailChange.mockResolvedValue({
        success: true,
        message: `We sent a confirmation link to ${NEW}.`,
        data: { user: { email: NEW } },
      } satisfies AuthState);
      show();
      open();

      await send();

      expect(screen.queryByLabelText('New email address')).toBeNull();
      expect(screen.getByRole('status').textContent).toContain(
        `We sent a confirmation link to ${NEW}.`,
      );
    });

    it('offers a way back in when the session has gone', async () => {
      mocks.requestEmailChange.mockResolvedValue({
        error:
          'For your security, sign out, sign in again, then try once more.',
        signedOut: true,
        data: { user: { email: NEW } },
      } satisfies AuthState);
      show();
      open();

      await send();

      expect(
        screen
          .getByRole('link', { name: 'Sign in again' })
          .getAttribute('href'),
      ).toBe('/auth/login?next=%2Fu1%2Fsettings');
    });

    it('offers no link for an error that signing in would not fix', async () => {
      mocks.requestEmailChange.mockResolvedValue({
        error: 'Too many attempts. Wait a few minutes and try again.',
      } satisfies AuthState);
      show();
      open();

      await send();

      expect(screen.queryByRole('link', { name: 'Sign in again' })).toBeNull();
    });

    it("does not show the last attempt's error again when the form is reopened", async () => {
      mocks.requestEmailChange.mockResolvedValue({
        error: 'That address cannot be used. Try a different one.',
        fields: ['email'],
        data: { user: { email: NEW } },
      } satisfies AuthState);
      show();
      open();
      await send();
      expect(screen.getByRole('alert')).toBeTruthy();

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      open();

      expect(screen.queryByRole('alert')).toBeNull();
      expect(newEmail().getAttribute('aria-invalid')).toBeNull();
      expect(newEmail().value).toBe('');
    });

    it('shows a new error after reopening and sending again', async () => {
      mocks.requestEmailChange.mockResolvedValue({
        error: 'Check the email address and try again.',
        fields: ['email'],
      } satisfies AuthState);
      show();
      open();
      await send();
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      open();

      mocks.requestEmailChange.mockResolvedValue({
        error: 'That address cannot be used. Try a different one.',
        fields: ['email'],
      } satisfies AuthState);
      await send();

      expect(screen.getByRole('alert').textContent).toBe(
        'That address cannot be used. Try a different one.',
      );
    });

    it('pulls the address into this session once a request is accepted, in case it changed at once', async () => {
      mocks.requestEmailChange.mockResolvedValue({
        success: true,
        message: 'Email address updated.',
        data: { user: { email: NEW } },
      } satisfies AuthState);
      show();
      open();

      await send();
      await act(async () => {});

      expect(screen.getByRole('status').textContent).toBe(
        'Email address updated.',
      );
      expect(mocks.refreshSession).toHaveBeenCalled();
      expect(mocks.refresh).toHaveBeenCalled();
    });

    it('does not touch the session for a refused request', async () => {
      mocks.requestEmailChange.mockResolvedValue({
        error: 'Check the email address and try again.',
        fields: ['email'],
      } satisfies AuthState);
      show();
      open();

      await send();
      await act(async () => {});

      expect(mocks.refreshSession).not.toHaveBeenCalled();
    });

    it('marks the field and explains an address that cannot be used, keeping what was typed', async () => {
      mocks.requestEmailChange.mockResolvedValue({
        error: 'That address cannot be used. Try a different one.',
        fields: ['email'],
        data: { user: { email: NEW } },
      } satisfies AuthState);
      show();
      open();

      await send();

      const alert = screen.getByRole('alert');
      expect(alert.textContent).toBe(
        'That address cannot be used. Try a different one.',
      );
      expect(newEmail().getAttribute('aria-invalid')).toBe('true');
      expect(newEmail().getAttribute('aria-describedby')).toBe(alert.id);
      expect(newEmail().value).toBe(NEW);
      expect(document.activeElement).toBe(newEmail());
    });
  });

  describe('while a change waits', () => {
    it('shows it as waiting, with a spinner hidden from screen readers and the wording read out', () => {
      const { container } = show(NEW);

      const status = screen.getByRole('status');
      expect(status.textContent).toContain(`Waiting for you to confirm ${NEW}`);
      expect(status.textContent).toContain(`Your email is still ${CURRENT}.`);
      expect(status.textContent).toMatch(
        /also sent one to your current address/i,
      );
      expect(container.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
    });

    it('does not offer a second change at the same time, but a different address', () => {
      show(NEW);

      expect(screen.queryByRole('button', { name: 'Change email' })).toBeNull();
      fireEvent.click(
        screen.getByRole('button', { name: 'Use a different address' }),
      );

      expect(newEmail()).toBeTruthy();
    });

    it('offers to resend the link', () => {
      show(NEW);

      expect(screen.getByRole('button', { name: 'Resend link' })).toBeTruthy();
    });

    it('goes back to rest once nothing is waiting', () => {
      const { rerender } = show(NEW);

      rerender(page(null));

      expect(screen.queryByRole('status')).toBeNull();
      expect(screen.getByRole('button', { name: 'Change email' })).toBeTruthy();
    });
  });

  describe('keeping up with the confirmation', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it('looks again on its own while a change waits', () => {
      show(NEW);
      expect(mocks.refresh).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(15_000);
      });
      expect(mocks.refresh).toHaveBeenCalledTimes(1);

      act(() => {
        vi.advanceTimersByTime(30_000);
      });
      expect(mocks.refresh).toHaveBeenCalledTimes(3);
    });

    it('looks again when the tab comes back into view', () => {
      show(NEW);

      act(() => {
        Object.defineProperty(document, 'visibilityState', {
          configurable: true,
          value: 'visible',
        });
        document.dispatchEvent(new Event('visibilitychange'));
      });

      expect(mocks.refresh).toHaveBeenCalledTimes(1);
    });

    it('does not look when the tab is hidden', () => {
      show(NEW);

      act(() => {
        Object.defineProperty(document, 'visibilityState', {
          configurable: true,
          value: 'hidden',
        });
        document.dispatchEvent(new Event('visibilitychange'));
      });

      expect(mocks.refresh).not.toHaveBeenCalled();
    });

    it('does nothing in the background when nothing waits', () => {
      show(null);

      act(() => {
        vi.advanceTimersByTime(120_000);
      });

      expect(mocks.refresh).not.toHaveBeenCalled();
    });

    it('stops looking once the change is confirmed or gone', () => {
      const { rerender } = show(NEW);
      rerender(page(null));
      mocks.refresh.mockClear();

      act(() => {
        vi.advanceTimersByTime(120_000);
      });

      expect(mocks.refresh).not.toHaveBeenCalled();
    });

    it('pulls the new address into this session when a waiting change ends', async () => {
      const { rerender } = show(NEW);

      rerender(page(null));
      await act(async () => {});

      expect(mocks.refreshSession).toHaveBeenCalledTimes(1);
      expect(mocks.refresh).toHaveBeenCalled();
    });

    it('still refreshes the page if refreshing the session fails', async () => {
      mocks.refreshSession.mockRejectedValue(new Error('offline'));
      const { rerender } = show(NEW);

      rerender(page(null));
      await act(async () => {});

      expect(mocks.refresh).toHaveBeenCalled();
    });

    it('does not touch the session when nothing was waiting to begin with', async () => {
      const { rerender } = show(null);

      rerender(page(null));
      await act(async () => {});

      expect(mocks.refreshSession).not.toHaveBeenCalled();
    });
  });
});
