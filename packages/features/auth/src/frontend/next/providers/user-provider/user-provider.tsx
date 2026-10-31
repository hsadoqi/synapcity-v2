'use client';

import { createContext, useContext, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

import type { CurrentUser } from '@synapcity/domain-identity';
import {
  shouldRefreshOnAuthEvent,
  type createBrowserSupabaseClient,
} from '@synapcity/frontend-supabase';

// `undefined` means "no provider above", which is a bug; `null` means signed out.
const UserContext = createContext<CurrentUser | null | undefined>(undefined);

/**
 * Hands the server-verified user to client components. The value is exactly
 * the `user` prop, with no copy in state, so it can never disagree with the
 * session cookie the server just read. When the browser client reports a change
 * (another tab signed out, the user was updated), the router re-renders the
 * server tree and a fresh `user` flows in.
 *
 * Display only: the server re-checks everything it authorizes.
 */
export function UserProvider({
  user,
  createClient,
  children,
}: {
  user: CurrentUser | null;
  /** The host's browser client; it owns the environment values (M7.3). */
  createClient: () => ReturnType<typeof createBrowserSupabaseClient>;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const knownUserId = useRef<string | null>(user?.id ?? null);

  useEffect(() => {
    knownUserId.current = user?.id ?? null;
  }, [user?.id]);

  const fixture = user?.fixture === true;

  useEffect(() => {
    // A fixture user has no session; the browser client would only report
    // signed-out events and refresh the page away from it.
    if (fixture) return;
    const { data } = createClient().auth.onAuthStateChange((event, session) => {
      // Synchronous work only: awaiting Supabase calls in here can deadlock.
      if (
        shouldRefreshOnAuthEvent(
          event,
          session?.user.id ?? null,
          knownUserId.current,
        )
      ) {
        router.refresh();
      }
    });
    return () => data.subscription.unsubscribe();
  }, [router, fixture, createClient]);

  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

/** The signed-in user, or null when signed out. Display only. */
export function useCurrentUser(): CurrentUser | null {
  const user = useContext(UserContext);
  if (user === undefined) {
    throw new Error('useCurrentUser must be used inside <UserProvider>.');
  }
  return user;
}
