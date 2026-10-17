'use client';

import { useEffect, useRef } from 'react';

import type { AuthState } from '@/app/auth/actions';
import { FORM_MESSAGE_ID } from './form-message';

/**
 * Puts keyboard focus where the person has to act after a failed submit.
 * Disabling the submit button while it runs drops focus to the page, so
 * without this the next Tab restarts at the skip link.
 *
 * Target: the first marked field that is empty (a failed sign-in clears the
 * password but keeps the email, so the password is what needs retyping), then
 * the first marked field, then the message itself when no field is marked.
 */
export function useFocusFirstError(state: AuthState) {
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.error) return;
    const invalid = Array.from(
      form.current?.querySelectorAll<HTMLInputElement>(
        '[aria-invalid="true"]',
      ) ?? [],
    );
    const target =
      invalid.find((field) => !field.value) ??
      invalid[0] ??
      document.getElementById(FORM_MESSAGE_ID);
    target?.focus();
  }, [state]);

  return form;
}
