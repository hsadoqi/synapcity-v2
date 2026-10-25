import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/** The toast is the success feedback: replace it so the tests can see what it was given. */
const toasts = vi.hoisted(() => ({
  add: vi.fn(),
  path: '/u1/settings' as string | null,
}));
vi.mock('next/navigation', () => ({ usePathname: () => toasts.path }));
vi.mock('@synapcity/frontend-ui/core/toast', () => ({
  toast: { add: toasts.add },
}));

import type { ProfileState } from '../../../contracts';
import { ProfileFormShell, useProfileForm } from './profile-form-shell';

/** A field that shows what the shell hands its children. */
function Probe() {
  const { state, messageId, pending } = useProfileForm();
  return (
    <>
      <input name="thing" aria-label="Thing" />
      <span data-testid="seen">
        {JSON.stringify({
          name: state.name,
          pending,
          hasId: Boolean(messageId),
        })}
      </span>
    </>
  );
}

const action =
  vi.fn<
    (previous: ProfileState, formData: FormData) => Promise<ProfileState>
  >();
const submit = () =>
  act(async () => {
    fireEvent.submit(screen.getByLabelText('Thing').closest('form')!);
  });

const signInHref = (to: string) => `/auth/login?next=${encodeURIComponent(to)}`;

describe('ProfileFormShell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders whatever fields it is given inside one form with a submit button', () => {
    render(
      <ProfileFormShell
        signInHref={signInHref}
        action={action}
        initialState={{ name: 'Ada' }}
        submitLabel="Save it"
      >
        <Probe />
      </ProfileFormShell>,
    );

    expect(screen.getByLabelText('Thing').closest('form')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Save it' })).toBeTruthy();
    expect(JSON.parse(screen.getByTestId('seen').textContent!)).toEqual({
      name: 'Ada',
      pending: false,
      hasId: true,
    });
  });

  it('passes the submitted form to the action', async () => {
    action.mockResolvedValue({ name: 'Ada' });
    render(
      <ProfileFormShell
        signInHref={signInHref}
        action={action}
        initialState={{}}
        submitLabel="Save"
      >
        <Probe />
      </ProfileFormShell>,
    );
    fireEvent.change(screen.getByLabelText('Thing'), {
      target: { value: 'x' },
    });

    await submit();

    expect((action.mock.calls[0]![1] as FormData).get('thing')).toBe('x');
  });

  it('tells the caller once a submit was saved, with the result', async () => {
    const onSaved = vi.fn();
    action.mockResolvedValue({ saved: true, name: 'Ada', message: 'Done.' });
    render(
      <ProfileFormShell
        signInHref={signInHref}
        action={action}
        initialState={{}}
        submitLabel="Save"
        onSaved={onSaved}
      >
        <Probe />
      </ProfileFormShell>,
    );

    await submit();

    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(onSaved).toHaveBeenCalledWith(
      expect.objectContaining({ saved: true, name: 'Ada' }),
    );
    expect(toasts.add).toHaveBeenCalledWith({
      type: 'success',
      title: 'Done.',
    });
    // The toast confirms it; the form keeps its message line for errors.
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('does not tell the caller when the submit was refused', async () => {
    const onSaved = vi.fn();
    action.mockResolvedValue({ error: 'Nope.' });
    render(
      <ProfileFormShell
        signInHref={signInHref}
        action={action}
        initialState={{}}
        submitLabel="Save"
        onSaved={onSaved}
      >
        <Probe />
      </ProfileFormShell>,
    );

    await submit();

    expect(onSaved).not.toHaveBeenCalled();
    expect(toasts.add).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toBe('Nope.');
  });

  it('goes by whether the change was saved, not by whether there is a message', async () => {
    const onSaved = vi.fn();
    render(
      <ProfileFormShell
        signInHref={signInHref}
        action={action}
        initialState={{}}
        submitLabel="Save"
        onSaved={onSaved}
      >
        <Probe />
      </ProfileFormShell>,
    );

    action.mockResolvedValueOnce({ message: 'Just a note.' });
    await submit();
    expect(onSaved).not.toHaveBeenCalled();

    action.mockResolvedValueOnce({ saved: true });
    await submit();
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  describe('when the session has gone', () => {
    const run = async () => {
      render(
        <ProfileFormShell
          signInHref={signInHref}
          action={action}
          initialState={{}}
          submitLabel="Save"
        >
          <Probe />
        </ProfileFormShell>,
      );
      await submit();
    };

    it('offers a way to sign in that returns to this page', async () => {
      toasts.path = '/u1/settings';
      action.mockResolvedValue({
        error: 'Sign in again to update your profile.',
        signedOut: true,
      });

      await run();

      expect(screen.getByRole('alert').textContent).toBe(
        'Sign in again to update your profile.',
      );
      expect(
        screen
          .getByRole('link', { name: 'Sign in again' })
          .getAttribute('href'),
      ).toBe('/auth/login?next=%2Fu1%2Fsettings');
    });

    it('falls back to the home page when the path is not known', async () => {
      toasts.path = null;
      action.mockResolvedValue({ error: 'x', signedOut: true });

      await run();

      expect(
        screen
          .getByRole('link', { name: 'Sign in again' })
          .getAttribute('href'),
      ).toBe('/auth/login?next=%2F');
    });

    it('offers no link for any other error', async () => {
      toasts.path = '/u1/settings';
      action.mockResolvedValue({
        error: 'Could not save your changes. Try again.',
      });

      await run();

      expect(screen.queryByRole('link', { name: 'Sign in again' })).toBeNull();
    });
  });

  it('shows a secondary action beside the submit button', () => {
    render(
      <ProfileFormShell
        signInHref={signInHref}
        action={action}
        initialState={{}}
        submitLabel="Save"
        secondaryAction={<button type="button">Cancel</button>}
      >
        <Probe />
      </ProfileFormShell>,
    );

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();
  });

  it('fails loudly when a field is used outside a shell', () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<Probe />)).toThrow(
      'A profile field must be inside a ProfileFormShell.',
    );
    quiet.mockRestore();
  });
});
