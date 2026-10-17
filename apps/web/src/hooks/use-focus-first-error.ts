'use client';

import { useEffect, useRef } from 'react';

/**
 * Puts keyboard focus where the person has to act after a failed submit.
 * Disabling the submit button while it runs drops focus to the page, so
 * without this the next Tab restarts at the skip link.
 *
 * Target: the first marked field that is empty (a failed sign-in clears the
 * password but keeps the email, so the password is what needs retyping), then
 * the first marked field, then the form's own error message when no field is
 * marked. Everything is looked up inside this form, never the whole page, so
 * another form's message cannot take the focus.
 */
export function useFocusFirstError(state: { error?: string }) {
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
      form.current?.querySelector<HTMLElement>('[role="alert"]');
    target?.focus();
  }, [state]);

  return form;
}
