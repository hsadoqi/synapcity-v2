import { act, render, renderHook, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useConfirmation } from '@/features/auth/client/use-confirmation';
import type { AuthState } from '@synapcity/features-auth/contracts';

const sent = (): AuthState => ({
  success: true,
  message: 'Check your email',
  data: { user: { email: 'a@b.co' } },
});

describe('useConfirmation', () => {
  it('shows the confirmation for a successful result only', () => {
    expect(renderHook(() => useConfirmation({})).result.current.confirmed).toBe(
      false,
    );
    expect(
      renderHook(() => useConfirmation(sent())).result.current.confirmed,
    ).toBe(true);
  });

  it('returns to the form with the address kept and no success message', () => {
    const state = sent();
    const { result } = renderHook(() => useConfirmation(state));
    act(() => result.current.edit());
    expect(result.current.confirmed).toBe(false);
    expect(result.current.formState).toEqual({
      data: { user: { email: 'a@b.co' } },
    });
  });

  it('shows the confirmation again after the next successful result', () => {
    const first = sent();
    const { result, rerender } = renderHook(
      ({ state }) => useConfirmation(state),
      { initialProps: { state: first } },
    );
    act(() => result.current.edit());
    expect(result.current.confirmed).toBe(false);

    rerender({ state: sent() });
    expect(result.current.confirmed).toBe(true);
  });

  it('focuses the email field when editing starts', () => {
    function Probe({ state }: { state: AuthState }) {
      const { confirmed, edit } = useConfirmation(state);
      return (
        <>
          <input id="email" aria-label="Email" />
          <button onClick={edit}>{confirmed ? 'Edit' : 'Editing'}</button>
        </>
      );
    }
    render(<Probe state={sent()} />);
    const email = screen.getByLabelText('Email');
    expect(document.activeElement).not.toBe(email);
    act(() => screen.getByRole('button').click());
    expect(document.activeElement).toBe(email);
  });
});
