import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ProfileState } from '@/features/account/shared/form-state';

/** Only the Server Action boundary is replaced; React runs the real form. */
const mocks = vi.hoisted(() => ({ updateProfile: vi.fn() }));

vi.mock('@/features/account/server/actions', () => ({
  updateProfile: mocks.updateProfile,
}));

import { ProfileForm } from './profile-form';

/** Lets a test hold a submit open, then finish it with a chosen result. */
function deferred() {
  let finish!: (state: ProfileState) => void;
  const promise = new Promise<ProfileState>((resolve) => {
    finish = resolve;
  });
  return { promise, finish };
}

const nameInput = () => screen.getByLabelText('Name') as HTMLInputElement;
const submit = () =>
  act(async () => {
    fireEvent.submit(nameInput().form!);
  });

describe('ProfileForm submit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends the typed name to the action', async () => {
    mocks.updateProfile.mockResolvedValue({ name: 'Grace', message: 'Saved' });
    render(<ProfileForm defaultName="Ada" />);
    fireEvent.change(nameInput(), { target: { value: 'Grace' } });
    await submit();

    expect(mocks.updateProfile).toHaveBeenCalledTimes(1);
    const formData = mocks.updateProfile.mock.calls[0]![1] as FormData;
    expect(formData.get('name')).toBe('Grace');
  });

  it('disables the button while saving and shows the status afterwards', async () => {
    const pending = deferred();
    mocks.updateProfile.mockReturnValue(pending.promise);
    render(<ProfileForm defaultName="Ada" />);
    await submit();

    const button = screen.getByRole('button', { name: 'Saving…' });
    expect(button.hasAttribute('disabled')).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');

    await act(async () => pending.finish({ name: 'Ada', message: 'Saved.' }));
    expect(screen.getByRole('status').textContent).toBe('Saved.');
    const again = screen.getByRole('button', { name: 'Save changes' });
    expect(again.hasAttribute('disabled')).toBe(false);
  });

  it('marks the name invalid, explains why and focuses it after a field error', async () => {
    mocks.updateProfile.mockResolvedValue({
      error: 'Enter your name.',
      fields: ['name'],
      name: '',
    });
    render(<ProfileForm defaultName="Ada" />);
    await submit();

    const alert = screen.getByRole('alert');
    expect(alert.textContent).toBe('Enter your name.');
    expect(nameInput().getAttribute('aria-invalid')).toBe('true');
    expect(nameInput().getAttribute('aria-describedby')).toBe(alert.id);
    expect(document.activeElement).toBe(nameInput());
  });

  it('focuses the message when the error is about no one field', async () => {
    mocks.updateProfile.mockResolvedValue({
      error: 'Sign in again to update your profile.',
      name: 'Ada',
    });
    render(<ProfileForm defaultName="Ada" />);
    await submit();

    expect(nameInput().getAttribute('aria-invalid')).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('alert'));
  });
});
