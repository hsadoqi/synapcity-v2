import { FORM_MESSAGE_ID } from '@/components/forms/form-message';

import type { AuthFieldName, AuthState } from './form-state';

/** Props that mark a field invalid when the current error is about it. */
export function fieldErrorProps(state: AuthState, field: AuthFieldName) {
  return {
    invalid: Boolean(state.error && state.fields?.includes(field)),
    messageId: FORM_MESSAGE_ID,
  };
}
