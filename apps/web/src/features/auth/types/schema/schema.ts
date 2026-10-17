import { z } from 'zod';

import { nameSchema } from '@/features/account/types';

/** The shortest password the forms accept; the weak-password reply states it. */
export const MIN_PASSWORD_LENGTH = 8;

/** The reply when a password is shorter than `MIN_PASSWORD_LENGTH`. */
export const PASSWORD_TOO_SHORT_MESSAGE = `Use a password of at least ${MIN_PASSWORD_LENGTH} characters.`;

const ENTER_EMAIL = 'Enter your email.';
const ENTER_EMAIL_AND_PASSWORD = 'Enter your email and password.';
const PASSWORDS_DO_NOT_MATCH = 'The passwords do not match.';

/** The reply when someone "changes" their email to the one they have. */
export const ALREADY_YOUR_EMAIL = 'That is already your email address.';

/**
 * Presence only. Whether an address is well formed is the provider's call: it
 * answers `validation_failed`, which `authErrorMessage` words, and a stricter
 * check here could refuse an address the provider accepts.
 */
const email = z.string().trim().min(1, ENTER_EMAIL);

/**
 * Sign-in asks only that both fields were filled in. The length rule is for
 * choosing a password, not for using one: an older account may predate it.
 */
export const signInSchema = z.object({
  email: z.string().trim().min(1, ENTER_EMAIL_AND_PASSWORD),
  password: z.string().min(1, ENTER_EMAIL_AND_PASSWORD),
});

/** The keys are in the order problems are reported: the first one wins. */
export const signUpSchema = z.object({
  email,
  name: nameSchema,
  password: z.string().min(MIN_PASSWORD_LENGTH, PASSWORD_TOO_SHORT_MESSAGE),
});

/** Resending a confirmation and asking for a reset link both need just this. */
export const emailRequestSchema = z.object({ email });

export const updatePasswordSchema = z
  .object({
    password: z.string().min(MIN_PASSWORD_LENGTH, PASSWORD_TOO_SHORT_MESSAGE),
    confirm: z.string(),
  })
  .refine((value) => value.password === value.confirm, {
    message: PASSWORDS_DO_NOT_MATCH,
    path: ['confirm'],
  });

/** Form fields an auth error can point at, so the form can mark them invalid. */
export type AuthFieldName =
  | keyof z.input<typeof signUpSchema>
  | keyof z.input<typeof updatePasswordSchema>;

const isField = (key: PropertyKey | undefined): key is AuthFieldName =>
  key === 'email' || key === 'name' || key === 'password' || key === 'confirm';

/**
 * The first problem in a failed parse: its message and the one field it is
 * about. Only the first is shown, so a form with several mistakes reports them
 * one at a time, in the order the schema lists its keys.
 */
export function firstRefusal(error: z.ZodError): {
  message: string;
  fields: AuthFieldName[];
} {
  const issue = error.issues[0];
  const key = issue?.path[0];
  return {
    message: issue?.message ?? 'Check what you entered and try again.',
    fields: isField(key) ? [key] : [],
  };
}

/**
 * The same message, with every field that had a problem, for a form that
 * marks them all at once (sign-in, where either field may be the empty one).
 */
export function everyRefusal(error: z.ZodError): {
  message: string;
  fields: AuthFieldName[];
} {
  const fields = error.issues.map((issue) => issue.path[0]).filter(isField);
  return {
    message: firstRefusal(error).message,
    fields: [...new Set(fields)],
  };
}
