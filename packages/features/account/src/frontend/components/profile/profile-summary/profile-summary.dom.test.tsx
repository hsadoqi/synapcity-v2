import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/** The toast is the success feedback: replace it so the tests can see what it was given. */
const toasts = vi.hoisted(() => ({ add: vi.fn() }));
vi.mock('@synapcity/frontend-ui/components/toast', () => ({
  toast: { add: toasts.add },
}));

const mocks = vi.hoisted(() => ({
  updateName: vi.fn(),
  updateAvatar: vi.fn(),
}));

import { ProfileSummary } from './profile-summary';

const edit = (item: 'name' | 'photo') =>
  screen.getByRole('button', { name: `Edit ${item}` });

const signInHref = (to: string) => `/auth/login?next=${encodeURIComponent(to)}`;

describe('ProfileSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the name and the photo with an edit button for each', () => {
    render(
      <ProfileSummary
        actions={{
          updateName: mocks.updateName,
          updateAvatar: mocks.updateAvatar,
        }}
        signInHref={signInHref}
        names={{
          firstName: 'Ada',
          lastName: 'Lovelace',
          displayName: 'Ada Lovelace',
        }}
        imageUrl={null}
      />,
    );

    expect(screen.getByText('Ada Lovelace')).toBeTruthy();
    expect(edit('name')).toBeTruthy();
    expect(edit('photo')).toBeTruthy();
    expect(screen.queryByLabelText('First name')).toBeNull();
  });

  it('edits only the names: first, last and display, focusing the first', () => {
    render(
      <ProfileSummary
        actions={{
          updateName: mocks.updateName,
          updateAvatar: mocks.updateAvatar,
        }}
        signInHref={signInHref}
        names={{ firstName: 'Ada', lastName: '', displayName: '' }}
        imageUrl={null}
      />,
    );

    fireEvent.click(edit('name'));

    expect(document.activeElement).toBe(screen.getByLabelText('First name'));
    expect(screen.getByLabelText('Display name')).toBeTruthy();
    expect(screen.queryByLabelText('Photo')).toBeNull();
    // The photo row is still just displayed.
    expect(edit('photo')).toBeTruthy();
  });

  it('edits only the photo: the form has just that field', () => {
    render(
      <ProfileSummary
        actions={{
          updateName: mocks.updateName,
          updateAvatar: mocks.updateAvatar,
        }}
        signInHref={signInHref}
        names={{ firstName: 'Ada', lastName: '', displayName: '' }}
        imageUrl={null}
      />,
    );

    fireEvent.click(edit('photo'));

    expect(screen.getByLabelText('Photo')).toBeTruthy();
    expect(screen.queryByLabelText('First name')).toBeNull();
    expect(edit('name')).toBeTruthy();
  });

  it('cancels back to the display and returns focus to the button that opened it', () => {
    render(
      <ProfileSummary
        actions={{
          updateName: mocks.updateName,
          updateAvatar: mocks.updateAvatar,
        }}
        signInHref={signInHref}
        names={{ firstName: 'Ada', lastName: '', displayName: '' }}
        imageUrl={null}
      />,
    );
    fireEvent.click(edit('name'));

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByLabelText('First name')).toBeNull();
    expect(document.activeElement).toBe(edit('name'));
  });

  it('shows the new name and announces the save once it is saved', async () => {
    mocks.updateName.mockResolvedValue({
      saved: true,
      firstName: 'Ada',
      lastName: '',
      name: 'Grace Hopper',
      message: 'Name updated.',
    });
    render(
      <ProfileSummary
        actions={{
          updateName: mocks.updateName,
          updateAvatar: mocks.updateAvatar,
        }}
        signInHref={signInHref}
        names={{ firstName: 'Ada', lastName: '', displayName: '' }}
        imageUrl={null}
      />,
    );
    fireEvent.click(edit('name'));
    fireEvent.change(screen.getByLabelText('Display name'), {
      target: { value: 'Grace Hopper' },
    });

    await act(async () => {
      fireEvent.submit(screen.getByLabelText('First name').closest('form')!);
    });

    expect(screen.getByText('Grace Hopper')).toBeTruthy();
    expect(screen.queryByLabelText('First name')).toBeNull();
    expect(toasts.add).toHaveBeenCalledWith({
      type: 'success',
      title: 'Name updated.',
    });
  });

  it('stays in the editor and shows the error when the save is refused', async () => {
    mocks.updateName.mockResolvedValue({
      error: 'Enter your first name.',
      fields: ['firstName'],
      firstName: '',
    });
    render(
      <ProfileSummary
        actions={{
          updateName: mocks.updateName,
          updateAvatar: mocks.updateAvatar,
        }}
        signInHref={signInHref}
        names={{ firstName: 'Ada', lastName: '', displayName: '' }}
        imageUrl={null}
      />,
    );
    fireEvent.click(edit('name'));

    await act(async () => {
      fireEvent.submit(screen.getByLabelText('First name').closest('form')!);
    });

    expect(screen.getByRole('alert').textContent).toBe(
      'Enter your first name.',
    );
    expect(screen.getByLabelText('First name')).toBeTruthy();
  });
});

describe('ProfileSummary without a display name', () => {
  it('shows the first name', () => {
    render(
      <ProfileSummary
        actions={{ updateName: vi.fn(), updateAvatar: vi.fn() }}
        signInHref={(to) => to}
        names={{ firstName: 'Ada', lastName: 'Lovelace', displayName: '' }}
        imageUrl={null}
      />,
    );

    expect(screen.getByText('Ada')).toBeTruthy();
  });
});
