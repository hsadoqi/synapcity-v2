/** What the message needs: any form result with an error or a status text. */
export type FormMessageState = { error?: string; message?: string };

/**
 * The form's error or status line. `id` comes from the form (`useId()`), so
 * its fields can point `aria-describedby` at it and two forms on one page,
 * such as sign-in and its resend form, never share an id.
 */
export function FormMessage({
  id,
  state,
}: {
  id: string;
  state: FormMessageState;
}) {
  if (state.error) {
    return (
      <p
        id={id}
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
      <p id={id} role="status" className="text-sm text-success">
        {state.message}
      </p>
    );
  }
  return null;
}
