import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/** The toast is the success feedback: replace it so the tests can see what it was given. */
const toasts = vi.hoisted(() => ({ add: vi.fn() }));
vi.mock('@synapcity/frontend-ui/core/toast', () => ({
  toast: { add: toasts.add },
}));

const mocks = vi.hoisted(() => ({ completeProfile: vi.fn() }));

import { ProfileSetupForm } from './profile-setup-form';

const nameInput = () =>
  screen.getByLabelText('Display name') as HTMLInputElement;
const firstNameInput = () =>
  screen.getByLabelText('First name') as HTMLInputElement;

const signInHref = (to: string) => `/auth/login?next=${encodeURIComponent(to)}`;

describe('ProfileSetupForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prefills the names and shows the provider photo, with every field labelled', () => {
    render(
      <ProfileSetupForm
        action={mocks.completeProfile}
        signInHref={signInHref}
        defaultFirstName="Ada"
        defaultLastName="Lovelace"
        defaultName="Ada Lovelace"
        imageUrl="https://avatars.githubusercontent.com/u/1"
        onComplete={() => {}}
      />,
    );

    expect(firstNameInput().value).toBe('Ada');
    expect(firstNameInput().required).toBe(true);
    expect((screen.getByLabelText('Last name') as HTMLInputElement).value).toBe(
      'Lovelace',
    );
    expect(nameInput().value).toBe('Ada Lovelace');
    expect((screen.getByLabelText('Photo') as HTMLInputElement).type).toBe(
      'file',
    );
    expect(screen.getByRole('button', { name: 'Continue' })).toBeTruthy();
  });

  it('offers no way to remove a photo while confirming', () => {
    render(
      <ProfileSetupForm
        action={mocks.completeProfile}
        signInHref={signInHref}
        defaultFirstName="Ada"
        defaultLastName=""
        defaultName="Ada"
        imageUrl="https://x.supabase.co/storage/v1/object/public/avatars/u/a.png"
        onComplete={() => {}}
      />,
    );

    expect(
      screen.queryByRole('button', { name: /remove|default photo/i }),
    ).toBeNull();
  });

  it('sends the names to the setup action and tells the caller when it is saved', async () => {
    const onComplete = vi.fn();
    mocks.completeProfile.mockResolvedValue({
      saved: true,
      name: 'Grace',
      message: 'Profile saved.',
    });
    render(
      <ProfileSetupForm
        action={mocks.completeProfile}
        signInHref={signInHref}
        defaultFirstName="Ada"
        defaultLastName=""
        defaultName="Ada"
        imageUrl={null}
        onComplete={onComplete}
      />,
    );
    fireEvent.change(nameInput(), { target: { value: 'Grace' } });

    await act(async () => {
      fireEvent.submit(nameInput().form!);
    });

    const formData = mocks.completeProfile.mock.calls[0]![1] as FormData;
    expect(formData.get('firstName')).toBe('Ada');
    expect(formData.get('name')).toBe('Grace');
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(toasts.add).toHaveBeenCalledWith({
      type: 'success',
      title: 'Profile saved.',
    });
  });

  it('does not tell the caller anything while the save is refused', async () => {
    const onComplete = vi.fn();
    mocks.completeProfile.mockResolvedValue({
      error: 'Enter your first name.',
      fields: ['firstName'],
      firstName: '',
    });
    render(
      <ProfileSetupForm
        action={mocks.completeProfile}
        signInHref={signInHref}
        defaultFirstName="Ada"
        defaultLastName=""
        defaultName="Ada"
        imageUrl={null}
        onComplete={onComplete}
      />,
    );

    await act(async () => {
      fireEvent.submit(nameInput().form!);
    });

    expect(onComplete).not.toHaveBeenCalled();
    expect(toasts.add).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toBe(
      'Enter your first name.',
    );
    expect(firstNameInput().getAttribute('aria-invalid')).toBe('true');
  });
});
