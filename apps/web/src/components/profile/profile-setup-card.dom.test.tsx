import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  skip: vi.fn(),
  complete: vi.fn(),
  toast: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push }),
  usePathname: () => '/auth/welcome',
}));
vi.mock('@synapcity/frontend-ui/core/toast', () => ({
  toast: { add: mocks.toast },
}));
vi.mock('@/features/account/server/actions/setup-actions', () => ({
  completeProfile: mocks.complete,
  skipProfileSetup: mocks.skip,
}));

import { ProfileSetupCard } from './profile-setup-card';

const show = () =>
  render(
    <ProfileSetupCard
      defaultName="Ada Lovelace"
      imageUrl={null}
      next="/u1/home"
    />,
  );

describe('ProfileSetupCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.skip.mockResolvedValue({ saved: true });
  });

  it('welcomes the person with their name ready to confirm', () => {
    show();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Welcome' }),
    ).toBeTruthy();
    expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe(
      'Ada Lovelace',
    );
    expect(screen.getByLabelText('Photo')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Skip for now' })).toBeTruthy();
  });

  it('carries on to where they were going once the profile is saved', async () => {
    mocks.complete.mockResolvedValue({
      saved: true,
      name: 'Ada',
      message: 'Profile saved.',
    });
    show();

    await act(async () => {
      fireEvent.submit(screen.getByLabelText('Name').closest('form')!);
    });

    expect(mocks.push).toHaveBeenCalledExactlyOnceWith('/u1/home');
  });

  it('stays here while the save is refused', async () => {
    mocks.complete.mockResolvedValue({
      error: 'Enter your name.',
      fields: ['name'],
    });
    show();

    await act(async () => {
      fireEvent.submit(screen.getByLabelText('Name').closest('form')!);
    });

    expect(mocks.push).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toBe('Enter your name.');
  });

  it('skips: marks the step done, then carries on', async () => {
    show();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Skip for now' }));
    });

    expect(mocks.skip).toHaveBeenCalledTimes(1);
    expect(mocks.push).toHaveBeenCalledExactlyOnceWith('/u1/home');
    expect(mocks.complete).not.toHaveBeenCalled();
  });

  it('carries on after a skip even if marking it failed, rather than trapping them', async () => {
    mocks.skip.mockResolvedValue({ saved: false });
    show();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Skip for now' }));
    });

    expect(mocks.push).toHaveBeenCalledExactlyOnceWith('/u1/home');
  });

  it('carries on after a skip even if the request itself fails', async () => {
    mocks.skip.mockRejectedValue(new Error('network down'));
    show();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Skip for now' }));
    });

    expect(mocks.push).toHaveBeenCalledExactlyOnceWith('/u1/home');
  });

  it('disables skipping while it is working', async () => {
    mocks.skip.mockReturnValue(new Promise(() => {}));
    show();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Skip for now' }));
    });

    const button = screen.getByRole('button', { name: 'Skipping…' });
    expect(button.hasAttribute('disabled')).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
  });
});
