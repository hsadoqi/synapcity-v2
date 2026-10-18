import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AuthConfirmation } from './auth-confirmation';
import { AUTH_HEADING_ID } from '../auth-shell';

function Page({ message }: { message: string }) {
  return (
    <>
      <h1 id={AUTH_HEADING_ID} tabIndex={-1}>
        Check your email
      </h1>
      <AuthConfirmation message={message} email="a@b.co" />
    </>
  );
}

describe('AuthConfirmation', () => {
  it('moves focus to the page heading when it appears', () => {
    render(<Page message="Link sent" />);
    expect(document.activeElement).toBe(
      document.getElementById(AUTH_HEADING_ID),
    );
  });

  it('moves focus back to the heading when a new message arrives', () => {
    const { rerender } = render(<Page message="Link sent" />);
    (document.activeElement as HTMLElement).blur();
    rerender(<Page message="Link sent again" />);
    expect(document.activeElement).toBe(
      document.getElementById(AUTH_HEADING_ID),
    );
  });

  it('announces the message and the address as a status', () => {
    render(<Page message="Link sent" />);
    const status = screen.getByRole('status');
    expect(status.textContent).toContain('Link sent');
    expect(status.textContent).toContain('Requested for a@b.co');
  });

  it('offers a way back only when it is given one', () => {
    const onEdit = vi.fn();
    const { rerender } = render(
      <AuthConfirmation message="Link sent" email="a@b.co" />,
    );
    expect(screen.queryByRole('button')).toBeNull();

    rerender(
      <AuthConfirmation message="Link sent" email="a@b.co" onEdit={onEdit} />,
    );
    act(() =>
      screen.getByRole('button', { name: 'Use a different email' }).click(),
    );
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('shows no "requested for" line when there is no address to name', () => {
    render(<AuthConfirmation message="Link sent" email="" />);

    expect(screen.getByRole('status').textContent).toBe('Link sent');
    expect(screen.queryByText(/Requested for/)).toBeNull();
  });

  it('offers "use a different email" only when it can go back, and runs it', () => {
    const onEdit = vi.fn();
    const { rerender } = render(
      <AuthConfirmation message="Sent" email="a@b.co" />,
    );
    expect(
      screen.queryByRole('button', { name: 'Use a different email' }),
    ).toBeNull();

    rerender(
      <AuthConfirmation message="Sent" email="a@b.co" onEdit={onEdit} />,
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Use a different email' }),
    );

    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('shows its follow-up actions, such as resending', () => {
    render(
      <AuthConfirmation message="Sent" email="a@b.co">
        <button type="button">Resend link</button>
      </AuthConfirmation>,
    );

    expect(screen.getByRole('button', { name: 'Resend link' })).toBeTruthy();
  });
});
