'use client';

import { useActionState, useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@synapcity/frontend-ui/core/button';

import { usePendingEmail } from '../../../providers/pending-email';
import type { AuthState, AuthAction } from '../../../../contracts';
import {
  FormField,
  FormMessage,
  fieldErrorProps,
  useFocusFirstError,
} from '@synapcity/frontend-forms';
import { SignInAgain } from '../sign-in-again';
import { ResendEmailChange } from './resend-email-change';
import type { createBrowserSupabaseClient } from '@synapcity/frontend-supabase';

const initialState: AuthState = {};

/** How often a waiting change is looked at again while the page stays open. */
const LOOK_AGAIN_MS = 15_000;

/**
 * The email address, and changing it. Nothing changes when the form is sent:
 * a confirmation link goes out, and the page shows the change as waiting until
 * the link is used. What is waiting comes from the server (`usePendingEmail`),
 * so it survives a reload and shows on every device.
 */
export function EmailChange({
  email,
  requestEmailChange,
  resendEmailChange,
  signInHref,
  createClient,
}: {
  email: string | null;
  requestEmailChange: AuthAction;
  resendEmailChange: AuthAction;
  signInHref: (returnTo: string) => string;
  createClient: () => ReturnType<typeof createBrowserSupabaseClient>;
}) {
  const pendingEmail = usePendingEmail();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [state, formAction, sending] = useActionState(
    requestEmailChange,
    initialState,
  );
  const formRef = useFocusFirstError(state);
  const messageId = useId();

  // The form's state cannot be reset, so remember which result was already
  // there when the form was opened and show only what comes after it. Without
  // this, cancelling and reopening would show the last attempt's error again.
  const [baseline, setBaseline] = useState(state);
  const shown = state === baseline ? initialState : state;
  const openForm = () => {
    setBaseline(state);
    setEditing(true);
  };

  // Once a request is accepted, close the form: the waiting state takes over.
  const [seen, setSeen] = useState(state);
  if (seen !== state) {
    setSeen(state);
    if (state.success) setEditing(false);
  }

  // While a change waits, look again now and then and whenever the tab comes
  // back into view: the link is usually opened somewhere else. A hidden tab
  // skips its regular look; it catches up once on return.
  useEffect(() => {
    if (!pendingEmail) return;
    const lookAgain = () => router.refresh();
    const timer = setInterval(() => {
      if (document.visibilityState !== 'hidden') lookAgain();
    }, LOOK_AGAIN_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') lookAgain();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [pendingEmail, router]);

  // A request that was accepted may have changed the address at once (a
  // project that confirms without email), and this session still has the old
  // one. Pull the new one in; harmless when a link was sent instead.
  useEffect(() => {
    if (!state.success) return;
    const refresh = () => router.refresh();
    void createClient().auth.refreshSession().then(refresh, refresh);
  }, [state, router, createClient]);

  // When a waiting change stops waiting, pull the new address into this
  // session. A link opened in another browser changes the account but not this
  // browser's token, which would keep showing the old address for up to an hour.
  const wasWaiting = useRef(pendingEmail);
  useEffect(() => {
    if (wasWaiting.current && !pendingEmail) {
      const refresh = () => router.refresh();
      void createClient().auth.refreshSession().then(refresh, refresh);
    }
    wasWaiting.current = pendingEmail;
  }, [pendingEmail, router, createClient]);

  if (editing) {
    return (
      <form
        ref={formRef}
        action={formAction}
        noValidate
        className="flex flex-col gap-4"
      >
        <FormField
          id="email"
          {...fieldErrorProps(shown, 'email', messageId)}
          label="New email address"
          hint="We will send a link to confirm it. Your email does not change until you use it."
          type="email"
          autoComplete="email"
          defaultValue={shown.data?.user?.email}
          autoFocus
          required
        />
        <FormMessage id={messageId} state={{ error: shown.error }} />
        {shown.signedOut ? <SignInAgain signInHref={signInHref} /> : null}
        <div className="flex flex-wrap gap-2">
          <Button
            type="submit"
            size="lg"
            disabled={sending}
            aria-busy={sending}
          >
            {sending ? 'Sending…' : 'Send confirmation link'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => setEditing(false)}
          >
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Email</span>
          <span className="text-sm font-medium">
            {email ?? 'No email on this account'}
          </span>
        </div>
        {pendingEmail ? null : (
          <Button type="button" variant="outline" size="sm" onClick={openForm}>
            Change email
          </Button>
        )}
      </div>

      {pendingEmail ? (
        <>
          <div role="status" className="flex items-start gap-3">
            <Loader2
              aria-hidden
              className="mt-0.5 size-4 shrink-0 text-muted-foreground motion-safe:animate-spin"
            />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">
                Waiting for you to confirm {pendingEmail}
              </p>
              <p className="text-sm text-muted-foreground">
                {email
                  ? `Your email is still ${email}. `
                  : 'Your email has not changed yet. '}
                Open the link we sent to {pendingEmail}. If we also sent one to
                your current address, confirm that one too. This page updates by
                itself.
              </p>
            </div>
          </div>
          <ResendEmailChange
            resendEmailChange={resendEmailChange}
            signInHref={signInHref}
            justRequested={Boolean(state.success)}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="self-start"
            onClick={openForm}
          >
            Use a different address
          </Button>
        </>
      ) : state.success ? (
        // The request was accepted but the server has not reported it waiting
        // yet; say so rather than show nothing.
        <FormMessage id={messageId} state={{ message: state.message }} />
      ) : null}
    </div>
  );
}
