import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ usePathname: () => '/u1/settings' }));
vi.mock('@synapcity/frontend-ui/core/toast', () => ({
  toast: { add: vi.fn() },
}));

import { MAX_AVATAR_BYTES, type ProfileState } from '@/features/account/types';
import { ProfileFormShell } from '../profile/profile-form-shell';
import { AvatarField } from './avatar-field';

const UPLOADED =
  'https://x.supabase.co/storage/v1/object/public/avatars/u1/me.png';

const show = (
  props: Partial<Parameters<typeof AvatarField>[0]> = {},
  action: (
    previous: ProfileState,
    data: FormData,
  ) => Promise<ProfileState> = async () => ({}),
  initialState: ProfileState = {},
) =>
  render(
    <ProfileFormShell
      action={action}
      initialState={initialState}
      submitLabel="Save photo"
    >
      <AvatarField name="Ada Lovelace" imageUrl={null} {...props} />
    </ProfileFormShell>,
  );

const input = () => screen.getByLabelText('Photo') as HTMLInputElement;
const pick = (file: File) =>
  fireEvent.change(input(), { target: { files: [file] } });
const image = (type = 'image/png', size = 100) =>
  new File([new Uint8Array(size)], 'me.png', { type });

describe('AvatarField', () => {
  it('shows initials when there is no photo', () => {
    show();

    expect(screen.getByText('AL')).toBeTruthy();
  });

  it('is a file input limited to the allowed image types, with its rules', () => {
    show();

    expect(input().type).toBe('file');
    expect(input().accept).toBe('image/png,image/jpeg,image/webp');
    expect(
      document.getElementById(input().getAttribute('aria-describedby')!)
        ?.textContent,
    ).toBe('PNG, JPEG or WebP, up to 2 MB.');
  });

  describe('removing an uploaded photo', () => {
    it('offers the default photo only for an uploaded one', () => {
      show({ imageUrl: UPLOADED });

      expect(
        screen.getByRole('button', { name: 'Use default photo' }),
      ).toBeTruthy();
    });

    it('does not offer it for a provider picture', () => {
      show({ imageUrl: 'https://lh3.googleusercontent.com/a/me' });

      expect(
        screen.queryByRole('button', { name: 'Use default photo' }),
      ).toBeNull();
    });

    it('does not offer it when removing is not allowed', () => {
      show({ imageUrl: UPLOADED, canRemove: false });

      expect(
        screen.queryByRole('button', { name: 'Use default photo' }),
      ).toBeNull();
    });

    it('submits the remove intent', async () => {
      const action = vi.fn().mockResolvedValue({});
      show({ imageUrl: UPLOADED }, action);

      await act(async () => {
        fireEvent.click(
          screen.getByRole('button', { name: 'Use default photo' }),
        );
      });

      // jsdom's click does not add the submitter, so the form itself submits;
      // the button is what carries the intent in a browser.
      const button = screen.getByRole('button', { name: 'Use default photo' });
      expect(button.getAttribute('name')).toBe('intent');
      expect(button.getAttribute('value')).toBe('remove');
    });
  });

  describe('choosing a file', () => {
    it('accepts a valid image without complaint', () => {
      show();

      pick(image());

      expect(screen.queryByRole('alert')).toBeNull();
      expect(input().hasAttribute('aria-invalid')).toBe(false);
    });

    it('refuses a file over the size limit', () => {
      show();

      pick(image('image/png', MAX_AVATAR_BYTES + 1));

      expect(screen.getByRole('alert').textContent).toMatch(/at most 2 MB/);
      expect(input().getAttribute('aria-invalid')).toBe('true');
      expect(input().getAttribute('aria-describedby')).toBe(
        screen.getByRole('alert').id,
      );
    });

    it('refuses a file of the wrong type', () => {
      show();

      pick(image('image/gif'));

      expect(screen.getByRole('alert').textContent).toBe(
        'Use a PNG, JPEG or WebP image.',
      );
    });

    it('drops a refused file so it cannot be submitted', () => {
      show();
      const clear = vi.spyOn(input(), 'value', 'set');

      pick(image('image/gif'));

      expect(clear).toHaveBeenCalledWith('');
    });

    it('clears the complaint once a good file is chosen', () => {
      show();
      pick(image('image/gif'));
      expect(screen.getByRole('alert')).toBeTruthy();

      pick(image());

      expect(screen.queryByRole('alert')).toBeNull();
    });
  });

  it('shows the photo the server last saved, over the one it was given', async () => {
    const action = vi
      .fn()
      .mockResolvedValue({ avatarUrl: UPLOADED, saved: true });
    show({ imageUrl: null }, action);
    expect(
      screen.queryByRole('button', { name: 'Use default photo' }),
    ).toBeNull();

    await act(async () => {
      fireEvent.submit(input().form!);
    });

    expect(
      screen.getByRole('button', { name: 'Use default photo' }),
    ).toBeTruthy();
  });

  it('marks the input invalid when the server rejects the photo', () => {
    show({}, async () => ({}), {
      error: 'Could not upload.',
      fields: ['avatar'],
    });

    expect(input().getAttribute('aria-invalid')).toBe('true');
  });
});
