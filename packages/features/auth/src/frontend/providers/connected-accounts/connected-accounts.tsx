'use client';

import { createContext, useContext } from 'react';

import type { ConnectedAccount } from '@synapcity/features-auth/contracts';

/** A stable empty list, so reading it without a provider never re-renders. */
const NONE: readonly ConnectedAccount[] = [];

const ConnectedAccountsContext =
  createContext<readonly ConnectedAccount[]>(NONE);

/**
 * Hands the linked Google and GitHub accounts to the components that show
 * them. The page reads them from the provider and passes them in, so, like the
 * current user, this is exactly the server's value. Display only: just the
 * provider and a name or address per account, never the identity record.
 */
export function ConnectedAccountsProvider({
  accounts,
  children,
}: {
  accounts: readonly ConnectedAccount[];
  children: React.ReactNode;
}) {
  return (
    <ConnectedAccountsContext.Provider value={accounts}>
      {children}
    </ConnectedAccountsContext.Provider>
  );
}

/** The accounts linked to this one; empty when none are, or none are known. */
export function useConnectedAccounts(): readonly ConnectedAccount[] {
  return useContext(ConnectedAccountsContext);
}
