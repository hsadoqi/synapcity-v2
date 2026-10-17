'use client';

import { useActionState, useId } from 'react';
import { CircleCheck } from 'lucide-react';
import { Button } from '@synapcity/frontend-ui/core/button';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@synapcity/frontend-ui/core/alert-dialog';

import {
  connectAccount,
  disconnectAccount,
} from '@/features/auth/server/actions/actions';
import { useConnectedAccounts } from '@/features/auth/client';
import {
  OAUTH_PROVIDERS,
  providerLabel,
  type OAuthProvider,
} from '@/features/auth/shared/oauth-providers';
import type { ConnectedAccount } from '@/features/auth/shared/connected-accounts';
import type { AuthState } from '@/features/auth/types';
import { FormMessage } from '@/components/forms/form-message';
import { SignInAgain } from '../sign-in-again';

const initialState: AuthState = {};

/**
 * Disconnecting, behind a confirmation. It can be undone by connecting again,
 * but it changes how the person can sign in, so it is not one click. The
 * server refuses to remove the last way to sign in and says so here; when it
 * works, the row stops being connected and this goes away with it.
 */
function DisconnectButton({ provider }: { provider: OAuthProvider }) {
  const [state, formAction, pending] = useActionState(
    disconnectAccount,
    initialState,
  );
  const messageId = useId();
  const label = providerLabel(provider);

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label={`Disconnect ${label}`}
          />
        }
      >
        Disconnect
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Disconnect {label}?</AlertDialogTitle>
          <AlertDialogDescription>
            You will no longer be able to sign in with {label}. You can connect
            it again later.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="provider" value={provider} />
          <FormMessage id={messageId} state={{ error: state.error }} />
          {state.signedOut ? <SignInAgain /> : null}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              type="submit"
              variant="destructive"
              disabled={pending}
              aria-busy={pending}
            >
              {pending ? 'Disconnecting…' : 'Disconnect'}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ProviderRow({
  provider,
  account,
}: {
  provider: OAuthProvider;
  account: ConnectedAccount | undefined;
}) {
  const [state, formAction, pending] = useActionState(
    connectAccount,
    initialState,
  );
  const messageId = useId();
  const label = providerLabel(provider);

  return (
    <li className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">{label}</span>
          {account ? (
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CircleCheck aria-hidden className="size-4 text-success" />
              {account.detail ? `Connected as ${account.detail}` : 'Connected'}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">Not connected</span>
          )}
        </div>
        {account ? (
          <DisconnectButton provider={provider} />
        ) : (
          <form action={formAction}>
            <input type="hidden" name="provider" value={provider} />
            <Button
              type="submit"
              variant="outline"
              size="sm"
              disabled={pending}
              aria-busy={pending}
            >
              {pending ? 'Opening…' : `Connect ${label}`}
            </Button>
          </form>
        )}
      </div>
      <FormMessage id={messageId} state={{ error: state.error }} />
      {state.signedOut ? <SignInAgain /> : null}
    </li>
  );
}

/**
 * Which Google and GitHub accounts are linked to this one, and a way to link
 * the others. Connecting sends the person to the provider and back; what is
 * connected comes from the server (`useConnectedAccounts`), so it is right on
 * every device and after every reload.
 */
export function ConnectedAccounts() {
  const accounts = useConnectedAccounts();
  const headingId = useId();

  return (
    <div
      role="group"
      aria-labelledby={headingId}
      className="flex flex-col gap-3"
    >
      <span id={headingId} className="text-xs text-muted-foreground">
        Connected accounts
      </span>
      <ul className="flex flex-col gap-4">
        {OAUTH_PROVIDERS.map((provider) => (
          <ProviderRow
            key={provider}
            provider={provider}
            account={accounts.find((item) => item.provider === provider)}
          />
        ))}
      </ul>
    </div>
  );
}
