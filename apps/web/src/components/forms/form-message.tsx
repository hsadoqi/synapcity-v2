/** Shared id so fields can point `aria-describedby` at the message. */
export const FORM_MESSAGE_ID = 'form-message';

/** What the message needs: any form result with an error or a status text. */
export type FormMessageState = { error?: string; message?: string };

export function FormMessage({ state }: { state: FormMessageState }) {
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
