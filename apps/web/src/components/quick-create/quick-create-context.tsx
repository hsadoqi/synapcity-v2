'use client';

import { createContext, useContext } from 'react';

import type { CollectionKind } from '../app-sidebar';

const QuickCreateContext = createContext<(kind: CollectionKind) => void>(
  () => {},
);

/** Provided by the app shell, which owns the one quick-create dialog. */
export const QuickCreateProvider = QuickCreateContext.Provider;

/**
 * Opens the shell's quick-create dialog for a kind, so every "New …" button
 * leads to the same place. Outside the shell it does nothing.
 */
export function useQuickCreate(): (kind: CollectionKind) => void {
  return useContext(QuickCreateContext);
}
