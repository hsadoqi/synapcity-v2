import type { AuthState } from '@/lib/auth/auth-state/auth-state';
import type { AuthFieldName } from '@/lib/auth/error-messages/error-messages';

/** Shared id so fields can point `aria-describedby` at the message. */
export const FORM_MESSAGE_ID = 'form-message';

/** Props that mark a field invalid when the current error is about it. */
export function fieldErrorProps(state: AuthState, field: AuthFieldName) {
  return {
    invalid: Boolean(state.error && state.fields?.includes(field)),
    messageId: FORM_MESSAGE_ID,
  };
}

export function FormMessage({ state }: { state: AuthState }) {
  if (state.error) {
    return (
      <p
        id={FORM_MESSAGE_ID}
        role="alert"
        tabIndex={-1}
        className="text-sm text-destructive outline-none"
      >
        {state.error}
      </p>
    );
  }
  if (state.message) {
    return (
      <p id={FORM_MESSAGE_ID} role="status" className="text-sm text-success">
        {state.message}
      </p>
    );
  }
  return null;
}
