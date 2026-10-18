import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CurrentUser } from '@/features/auth/shared/current-user';

const mocks = vi.hoisted(() => ({ user: null as CurrentUser | null }));
vi.mock('@/features/auth/client/user-provider', () => ({
  useCurrentUser: () => mocks.user,
}));

import { CurrentUserAvatar } from '.';

describe('CurrentUserAvatar', () => {
  beforeEach(() => {
    mocks.user = {
      id: 'u1',
      name: 'Ada Lovelace',
      email: 'a@b.co',
      imageUrl: null,
    };
  });

  it("shows the signed-in person's initials while there is no picture", () => {
    render(<CurrentUserAvatar />);

    expect(screen.getByText('AL')).toBeTruthy();
  });

  it('shows the default icon with no name', () => {
    mocks.user = { id: 'u1', name: null, email: null, imageUrl: null };
    render(<CurrentUserAvatar />);

    expect(screen.getByText('Default photo')).toBeTruthy();
  });

  it('shows the default icon when nobody is signed in', () => {
    mocks.user = null;
    render(<CurrentUserAvatar />);

    expect(screen.getByText('Default photo')).toBeTruthy();
  });
});
