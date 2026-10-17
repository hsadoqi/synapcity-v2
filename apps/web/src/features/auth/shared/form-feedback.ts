import { fieldErrorProps as commonFieldErrorProps } from '@/components/forms/form-feedback';

import type { AuthFieldName, AuthState } from './form-state';

/** Props that mark an auth field invalid when the current error is about it. */
export function fieldErrorProps(
  state: AuthState,
  field: AuthFieldName,
  messageId: string,
) {
  return commonFieldErrorProps(state, field, messageId);
}
