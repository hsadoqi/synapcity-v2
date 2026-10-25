'use client';

import {
  createContext,
  useActionState,
  useContext,
  useEffect,
  useEffectEvent,
  useId,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@synapcity/frontend-ui/core/button';
import { LinkButton } from '@synapcity/frontend-ui/next/link-button';
import { toast } from '@synapcity/frontend-ui/core/toast';

import type { ProfileState } from '../../../../contracts';
import { FormMessage, useFocusFirstError } from '@synapcity/frontend-forms';

type ProfileFormContextValue = {
  state: ProfileState;
  /** The id of the form's message, for a field's `aria-describedby`. */
  messageId: string;
  pending: boolean;
};

const ProfileFormContext = createContext<ProfileFormContextValue | null>(null);

/** What a field inside a `ProfileFormShell` needs from its form. */
export function useProfileForm(): ProfileFormContextValue {
  const context = useContext(ProfileFormContext);
  if (!context) {
    throw new Error('A profile field must be inside a ProfileFormShell.');
  }
  return context;
}

/**
 * The form around whichever profile fields are passed as children: it runs the
 * action, shows its message, moves focus to the first error and disables the
 * button while saving. The fields read their state from it, so the same shell
 * serves a form with just a name, just a photo, or both.
 */
export function ProfileFormShell({
  action,
  initialState,
  submitLabel,
  signInHref,
  onSaved,
  secondaryAction,
  children,
}: {
  action: (previous: ProfileState, formData: FormData) => Promise<ProfileState>;
  initialState: ProfileState;
  submitLabel: string;
  /** Where "Sign in again" goes, given the page to come back to. The host owns the route. */
  signInHref: (returnTo: string) => string;
  /** Called once a submit was saved, with the result. */
  onSaved?: (state: ProfileState) => void;
  /** Shown beside the submit button, such as a cancel button. */
  secondaryAction?: ReactNode;
  children: ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const formRef = useFocusFirstError(state);
  const messageId = useId();
  // Where to come back to after signing in again. The sign-in page checks it.
  const here = usePathname() ?? '/';

  const handleSaved = useEffectEvent((saved: ProfileState) => {
    toast.add({ type: 'success', title: saved.message ?? 'Saved.' });
    onSaved?.(saved);
  });
  useEffect(() => {
    if (state.saved) handleSaved(state);
  }, [state]);

  return (
    <ProfileFormContext value={{ state, messageId, pending }}>
      <form
        ref={formRef}
        action={formAction}
        noValidate
        className="flex flex-col gap-4"
      >
        {children}
        {/* A saved change is confirmed by the toast. The message here is only
            for errors: they stay beside the field, linked to it and focused. */}
        <FormMessage id={messageId} state={{ error: state.error }} />
        {state.signedOut ? (
          <LinkButton
            href={signInHref(here)}
            variant="link"
            size="sm"
            className="self-start"
          >
            Sign in again
          </LinkButton>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button
            type="submit"
            size="lg"
            disabled={pending}
            aria-busy={pending}
          >
            {pending ? 'Saving…' : submitLabel}
          </Button>
          {secondaryAction}
        </div>
      </form>
    </ProfileFormContext>
  );
}
