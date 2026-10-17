import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useFocusFirstError } from './use-focus-first-error';

type State = { error?: string };

function Form({
  state,
  email = 'a@b.co',
  password = '',
  invalid = ['email', 'password'],
}: {
  state: State;
  email?: string;
  password?: string;
  invalid?: string[];
}) {
  const ref = useFocusFirstError(state);
  return (
    <form ref={ref}>
      <input
        aria-label="Email"
        defaultValue={email}
        aria-invalid={invalid.includes('email') || undefined}
      />
      <input
        aria-label="Password"
        defaultValue={password}
        aria-invalid={invalid.includes('password') || undefined}
      />
      {state.error ? (
        <p role="alert" tabIndex={-1}>
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

describe('useFocusFirstError', () => {
  it('does nothing without an error', () => {
    render(<Form state={{}} />);
    expect(document.activeElement).toBe(document.body);
  });

  it('focuses the first marked field that is empty', () => {
    render(<Form state={{ error: 'Wrong password' }} />);
    expect(document.activeElement).toBe(screen.getByLabelText('Password'));
  });

  it('focuses the first marked field when none is empty', () => {
    render(<Form state={{ error: 'Bad' }} password="secret" />);
    expect(document.activeElement).toBe(screen.getByLabelText('Email'));
  });

  it('falls back to the error message when no field is marked', () => {
    render(<Form state={{ error: 'Try later' }} invalid={[]} />);
    expect(document.activeElement).toBe(screen.getByRole('alert'));
  });

  it('refocuses on each new failed result, not on an unchanged one', () => {
    const first = { error: 'One' };
    const { rerender } = render(<Form state={first} />);
    act(() => (document.activeElement as HTMLElement).blur());

    rerender(<Form state={first} />);
    expect(document.activeElement).toBe(document.body);

    rerender(<Form state={{ error: 'One' }} />);
    expect(document.activeElement).toBe(screen.getByLabelText('Password'));
  });

  it('only looks inside its own form', () => {
    render(
      <>
        <form>
          <input aria-label="Other" aria-invalid="true" />
        </form>
        <Form state={{ error: 'Bad' }} invalid={[]} />
      </>,
    );
    expect(document.activeElement).toBe(screen.getByRole('alert'));
  });
});
