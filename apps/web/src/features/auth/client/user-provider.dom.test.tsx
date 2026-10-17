import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  UserProvider,
  useCurrentUser,
} from '@/features/auth/client/user-provider';
import type { CurrentUser } from '@/features/auth/shared/current-user';

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  unsubscribe: vi.fn(),
  onAuthStateChange: vi.fn(),
}));

// Next's router object is stable across renders, so the mock is too.
vi.mock('next/navigation', () => {
  const router = { refresh: mocks.refresh };
  return { useRouter: () => router };
});
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { onAuthStateChange: mocks.onAuthStateChange },
  }),
}));

type Listener = (
  event: string,
  session: { user: { id: string } } | null,
) => void;

/** The callback the provider handed to the SDK's `onAuthStateChange`. */
function listener(): Listener {
  const call = mocks.onAuthStateChange.mock.calls.at(-1);
  if (!call) throw new Error('The provider never subscribed.');
  return call[0] as Listener;
}

const ada = { id: 'user-1', email: 'ada@b.co' } as CurrentUser;
const grace = { id: 'user-2', email: 'grace@b.co' } as CurrentUser;

function Who() {
  return <p>{useCurrentUser()?.email ?? 'signed out'}</p>;
}

describe('UserProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mocks.unsubscribe } },
    });
  });

  it('hands the server-provided user to consumers and follows new props', () => {
    const { rerender } = render(
      <UserProvider user={ada}>
        <Who />
      </UserProvider>,
    );
    expect(screen.getByText('ada@b.co')).toBeTruthy();

    rerender(
      <UserProvider user={null}>
        <Who />
      </UserProvider>,
    );
    expect(screen.getByText('signed out')).toBeTruthy();
  });

  it('refreshes once when another tab signs the user out', () => {
    render(
      <UserProvider user={ada}>
        <Who />
      </UserProvider>,
    );
    act(() => listener()('SIGNED_OUT', null));
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
  });

  it('ignores events that do not change who is signed in', () => {
    render(
      <UserProvider user={ada}>
        <Who />
      </UserProvider>,
    );
    act(() => {
      listener()('INITIAL_SESSION', { user: { id: 'user-1' } });
      listener()('TOKEN_REFRESHED', { user: { id: 'user-1' } });
      listener()('SIGNED_IN', { user: { id: 'user-1' } });
    });
    expect(mocks.refresh).not.toHaveBeenCalled();
  });

  it('refreshes on a sign-in as a different user and on a user update', () => {
    render(
      <UserProvider user={ada}>
        <Who />
      </UserProvider>,
    );
    act(() => listener()('SIGNED_IN', { user: { id: 'user-2' } }));
    act(() => listener()('USER_UPDATED', { user: { id: 'user-1' } }));
    expect(mocks.refresh).toHaveBeenCalledTimes(2);
  });

  it('judges events against the latest server user, not the first one', () => {
    const { rerender } = render(
      <UserProvider user={ada}>
        <Who />
      </UserProvider>,
    );
    rerender(
      <UserProvider user={grace}>
        <Who />
      </UserProvider>,
    );
    act(() => listener()('SIGNED_IN', { user: { id: 'user-2' } }));
    expect(mocks.refresh).not.toHaveBeenCalled();
  });

  it('does not refresh a sign-out when nobody was signed in', () => {
    render(
      <UserProvider user={null}>
        <Who />
      </UserProvider>,
    );
    act(() => listener()('SIGNED_OUT', null));
    expect(mocks.refresh).not.toHaveBeenCalled();
  });

  it('subscribes once and unsubscribes on unmount', () => {
    const { rerender, unmount } = render(
      <UserProvider user={ada}>
        <Who />
      </UserProvider>,
    );
    rerender(
      <UserProvider user={grace}>
        <Who />
      </UserProvider>,
    );
    expect(mocks.onAuthStateChange).toHaveBeenCalledTimes(1);
    unmount();
    expect(mocks.unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('refuses to be read without a provider', () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Who />)).toThrow(/inside <UserProvider>/);
    quiet.mockRestore();
  });
});
