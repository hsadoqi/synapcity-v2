import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/** The toast is the success feedback: replace it so the tests can see what it was given. */
const toasts = vi.hoisted(() => ({ add: vi.fn() }));
vi.mock('@synapcity/frontend-ui/core/toast', () => ({
  toast: { add: toasts.add },
}));

import type { ProfileState } from '@/features/account/types';

/** Only the Server Action boundary is replaced; React runs the real form. */
const mocks = vi.hoisted(() => ({ updateAvatar: vi.fn() }));

vi.mock('@/features/account/server/actions/avatar-actions', () => ({
  updateAvatar: mocks.updateAvatar,
}));

import { AvatarForm } from './avatar-form';

const photoInput = () => screen.getByLabelText('Photo') as HTMLInputElement;
const submit = (button?: HTMLElement) =>
  act(async () => {
    if (button) fireEvent.click(button);
    else fireEvent.submit(photoInput().form!);
  });

describe('AvatarForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('labels the file input, limits its types and describes the rules', () => {
    render(<AvatarForm name="Ada Lovelace" imageUrl={null} />);

    expect(photoInput().type).toBe('file');
    expect(photoInput().accept).toBe('image/png,image/jpeg,image/webp');
    const hint = document.getElementById(
      photoInput().getAttribute('aria-describedby')!,
    );
    expect(hint?.textContent).toBe('PNG, JPEG or WebP, up to 2 MB.');
  });

  it('shows initials and no default-photo button when there is no photo', () => {
    render(<AvatarForm name="Ada Lovelace" imageUrl={null} />);

    expect(screen.getByText('AL')).toBeTruthy();
    expect(
      screen.queryByRole('button', { name: 'Use default photo' }),
    ).toBeNull();
  });

  it('offers the default photo for an uploaded one, sending the remove intent', async () => {
    mocks.updateAvatar.mockResolvedValue({
      avatarUrl: null,
      message: 'Photo removed.',
      saved: true,
    } satisfies ProfileState);
    render(
      <AvatarForm
        name="Ada"
        imageUrl="https://x.supabase.co/storage/v1/object/public/avatars/u/a.png"
      />,
    );

    await submit(screen.getByRole('button', { name: 'Use default photo' }));

    const formData = mocks.updateAvatar.mock.calls[0]![1] as FormData;
    expect(formData.get('intent')).toBe('remove');
    expect(toasts.add).toHaveBeenCalledWith({
      type: 'success',
      title: 'Photo removed.',
    });
    expect(screen.queryByRole('status')).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'Use default photo' }),
    ).toBeNull();
  });

  it('words the button as what it does, whether the default is a provider picture or the icon', () => {
    render(
      <AvatarForm
        name="Ada"
        imageUrl="https://x.supabase.co/storage/v1/object/public/avatars/u/a.png"
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Use default photo' }),
    ).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Remove photo' })).toBeNull();
  });

  it('cannot remove a provider picture, only replace it', () => {
    render(
      <AvatarForm
        name="Ada"
        imageUrl="https://avatars.githubusercontent.com/u/1"
      />,
    );

    expect(
      screen.queryByRole('button', { name: /remove|default photo/i }),
    ).toBeNull();
  });

  it('shows the default person icon when there is no name and no picture', () => {
    render(<AvatarForm name={null} imageUrl={null} />);

    expect(screen.getByText('Default photo')).toBeTruthy();
  });

  it('marks the input invalid, explains why and focuses it after a field error', async () => {
    mocks.updateAvatar.mockResolvedValue({
      error: 'Use a PNG, JPEG or WebP image.',
      fields: ['avatar'],
      avatarUrl: null,
    } satisfies ProfileState);
    render(<AvatarForm name="Ada" imageUrl={null} />);
    await submit();

    const alert = screen.getByRole('alert');
    expect(alert.textContent).toBe('Use a PNG, JPEG or WebP image.');
    expect(photoInput().getAttribute('aria-invalid')).toBe('true');
    expect(photoInput().getAttribute('aria-describedby')).toBe(alert.id);
    expect(document.activeElement).toBe(photoInput());
  });

  it('keeps showing the current photo after a failed submit', async () => {
    mocks.updateAvatar.mockResolvedValue({
      error: 'Could not save your changes. Try again.',
      avatarUrl:
        'https://x.supabase.co/storage/v1/object/public/avatars/u/a.png',
    } satisfies ProfileState);
    render(
      <AvatarForm
        name="Ada"
        imageUrl="https://x.supabase.co/storage/v1/object/public/avatars/u/a.png"
      />,
    );
    await submit();

    expect(
      screen.getByRole('button', { name: 'Use default photo' }),
    ).toBeTruthy();
  });
});
