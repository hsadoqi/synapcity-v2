'use client';

import { useEffect, useState } from 'react';

import type { AuthState } from '@/app/auth/actions';

/**
 * Lets a "Check your email" state be left again without losing what was typed.
 * A typo in the address would otherwise be a dead end: the only ways out were
 * resending to the wrong inbox or abandoning the page.
 *
 * `edit` dismisses the confirmation for the current result only, so submitting
 * again shows the next confirmation. `formState` is what the form should
 * render: the same result without the success message, which belongs to the
 * confirmation, not to the form it returns to.
 */
export function useConfirmation(state: AuthState) {
  const [dismissed, setDismissed] = useState<AuthState | null>(null);
  const editing = dismissed === state;
  const confirmed = Boolean(state.success) && !editing;

  useEffect(() => {
    if (editing) document.getElementById('email')?.focus();
  }, [editing]);

  const formState: AuthState = state.success ? { data: state.data } : state;

  return { confirmed, edit: () => setDismissed(state), formState };
}
