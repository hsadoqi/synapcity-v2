import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/** The toast is the success feedback: replace it so the tests can see what it was given. */
const toasts = vi.hoisted(() => ({ add: vi.fn() }));
vi.mock('@synapcity/frontend-ui/core/toast', () => ({
  toast: { add: toasts.add },
}));

const mocks = vi.hoisted(() => ({
  updateName: vi.fn(),
  updateAvatar: vi.fn(),
}));

vi.mock('@/features/account/server/actions/name-actions', () => ({
  updateName: mocks.updateName,
}));
vi.mock('@/features/account/server/actions/avatar-actions', () => ({
  updateAvatar: mocks.updateAvatar,
}));

import { ProfileSummary } from './profile-summary';

const edit = (item: 'name' | 'photo') =>
  screen.getByRole('button', { name: `Edit ${item}` });

describe('ProfileSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the name and the photo with an edit button for each', () => {
    render(<ProfileSummary name="Ada Lovelace" imageUrl={null} />);

    expect(screen.getByText('Ada Lovelace')).toBeTruthy();
    expect(edit('name')).toBeTruthy();
    expect(edit('photo')).toBeTruthy();
    expect(screen.queryByLabelText('Name')).toBeNull();
  });

  it('edits only the name: the form has just that field and focuses it', () => {
    render(<ProfileSummary name="Ada" imageUrl={null} />);

    fireEvent.click(edit('name'));

    expect(document.activeElement).toBe(screen.getByLabelText('Name'));
    expect(screen.queryByLabelText('Photo')).toBeNull();
    // The photo row is still just displayed.
    expect(edit('photo')).toBeTruthy();
  });

  it('edits only the photo: the form has just that field', () => {
    render(<ProfileSummary name="Ada" imageUrl={null} />);

    fireEvent.click(edit('photo'));

    expect(screen.getByLabelText('Photo')).toBeTruthy();
    expect(screen.queryByLabelText('Name')).toBeNull();
    expect(edit('name')).toBeTruthy();
  });

  it('cancels back to the display and returns focus to the button that opened it', () => {
    render(<ProfileSummary name="Ada" imageUrl={null} />);
    fireEvent.click(edit('name'));

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByLabelText('Name')).toBeNull();
    expect(document.activeElement).toBe(edit('name'));
  });

  it('shows the new name and announces the save once it is saved', async () => {
    mocks.updateName.mockResolvedValue({
      saved: true,
      name: 'Grace Hopper',
      message: 'Name updated.',
    });
    render(<ProfileSummary name="Ada" imageUrl={null} />);
    fireEvent.click(edit('name'));
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Grace Hopper' },
    });

    await act(async () => {
      fireEvent.submit(screen.getByLabelText('Name').closest('form')!);
    });

    expect(screen.getByText('Grace Hopper')).toBeTruthy();
    expect(screen.queryByLabelText('Name')).toBeNull();
    expect(toasts.add).toHaveBeenCalledWith({
      type: 'success',
      title: 'Name updated.',
    });
  });

  it('stays in the editor and shows the error when the save is refused', async () => {
    mocks.updateName.mockResolvedValue({
      error: 'Enter your name.',
      fields: ['name'],
      name: '',
    });
    render(<ProfileSummary name="Ada" imageUrl={null} />);
    fireEvent.click(edit('name'));

    await act(async () => {
      fireEvent.submit(screen.getByLabelText('Name').closest('form')!);
    });

    expect(screen.getByRole('alert').textContent).toBe('Enter your name.');
    expect(screen.getByLabelText('Name')).toBeTruthy();
  });
});
