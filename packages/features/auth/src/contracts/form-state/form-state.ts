import type { AuthFieldName } from '@synapcity/domain-identity';

/**
 * `email` echoes the submitted address so a failed submit can refill the field:
 * React 19 resets a form after its action finishes. Passwords are never echoed.
 */
export type AuthState = {
  error?: string;
  /** The fields `error` is about; absent or empty when it concerns no one field. */
  fields?: AuthFieldName[];
  message?: string;
  success?: boolean;
  /** The address is valid but unconfirmed, so the form can offer a new link. */
  unconfirmed?: boolean;
  /**
   * True when the error is that there is no session any more, so the form can
   * offer a way to sign in. A dropped connection is not this.
   */
  signedOut?: boolean;
  data?: {
    user?: UserData;
  };
};

type UserData = {
  email: string;
  /** Only collected when registering. */
  name?: string;
};

/**
 * A refused submit. `user` is echoed back so the form refills what was typed;
 * `fields` is left out (not empty) when the error is about no one field, so the
 * result stays exactly what the actions returned before they shared this.
 */
export function authFailure(
  error: string,
  user: UserData,
  fields?: AuthFieldName[],
): AuthState {
  return {
    error,
    ...(fields ? { fields } : {}),
    data: { user },
  };
}

/** An accepted submit that stays on the page, with the message to show. */
export function authSuccess(message: string, user: UserData): AuthState {
  return { success: true, message, data: { user } };
}

/**
 * A save or submit action as the host supplies it: a Server Action in the web
 * app. A package cannot import app code, so components receive their actions
 * as props (ADR-0014 section 3).
 */
export type AuthAction = (
  previous: AuthState,
  formData: FormData,
) => Promise<AuthState>;

/** An action used directly as a form's `action`, such as sign-in with a provider or sign-out. */
export type AuthFormAction = (formData: FormData) => void | Promise<void>;
