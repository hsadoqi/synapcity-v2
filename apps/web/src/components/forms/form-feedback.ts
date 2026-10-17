/**
 * What a form result needs for its errors to reach the right field: the error
 * and the fields it is about (absent when it concerns no one field).
 */
export type FieldFeedbackState<Field extends string> = {
  error?: string;
  fields?: readonly Field[];
};

/**
 * Props that mark a field invalid when the current error is about it, and
 * point it at the message that explains why. `messageId` is the id the form
 * gave its `FormMessage`; each form makes its own, so two forms on one page
 * never share one.
 */
export function fieldErrorProps<Field extends string>(
  state: FieldFeedbackState<Field>,
  field: Field,
  messageId: string,
) {
  return {
    invalid: Boolean(state.error && state.fields?.includes(field)),
    messageId,
  };
}
