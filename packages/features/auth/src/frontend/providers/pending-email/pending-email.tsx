'use client';

import { createContext, useContext } from 'react';

const PendingEmailContext = createContext<string | null>(null);

/**
 * Hands the address an email change is waiting on to the components that show
 * it. The page reads it from the provider (the token's claims do not carry it)
 * and passes it in, so, like the current user, it is exactly the server's
 * value and cannot drift from it. Display only.
 */
export function PendingEmailProvider({
  pendingEmail,
  children,
}: {
  pendingEmail: string | null;
  children: React.ReactNode;
}) {
  return (
    <PendingEmailContext.Provider value={pendingEmail}>
      {children}
    </PendingEmailContext.Provider>
  );
}

/** The address waiting for confirmation, or null when none (or none is known). */
export function usePendingEmail(): string | null {
  return useContext(PendingEmailContext);
}
