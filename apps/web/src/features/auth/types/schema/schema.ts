import { z } from 'zod';

import { nameSchema } from '@/features/account/types';

/** The shortest password the forms accept; the weak-password reply states it. */
export const MIN_PASSWORD_LENGTH = 8;

/** The reply when a password is shorter than `MIN_PASSWORD_LENGTH`. */
export const PASSWORD_TOO_SHORT_MESSAGE = `Use a password of at least ${MIN_PASSWORD_LENGTH} characters.`;

/**
 * What a new password must contain, shown beside the field and in the "too
 * weak" reply. It matches the project's Supabase setting (length, lowercase,
 * uppercase, digits and symbols); if that setting changes, change this.
 */
export const PASSWORD_REQUIREMENTS = `At least ${MIN_PASSWORD_LENGTH} characters, with a lowercase letter, an uppercase letter, a number and a symbol.`;

/**
 * The symbols Supabase counts, exactly as its documentation lists them. A
 * looser test here would let through passwords it then refuses; a stricter one
 * would refuse passwords it accepts. Anything else, such as an accented letter,
 * is not a symbol to it.
 */
const SYMBOL = /[!@#$%^&*()_+\-=[\]{};'\\:"|<>?,./`~]/;

const CHARACTER_CLASSES = [
  { present: /[a-z]/, missing: 'a lowercase letter' },
  { present: /[A-Z]/, missing: 'an uppercase letter' },
  { present: /[0-9]/, missing: 'a number' },
  { present: SYMBOL, missing: 'a symbol such as ! # or ?' },
] as const;

/** "a", "a and b", "a, b and c". */
function joinList(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;
}

/**
 * What a password still needs, worded for the person ("Add an uppercase letter
 * and a symbol such as ! # or ?."), or `null` when it has every kind of
 * character. Length is checked separately.
 */
export function missingCharactersMessage(password: string): string | null {
  const missing = CHARACTER_CLASSES.filter(
    (kind) => !kind.present.test(password),
  ).map((kind) => kind.missing);
  return missing.length > 0 ? `Add ${joinList(missing)}.` : null;
}

/**
 * A password being chosen: long enough, and with each kind of character. Not
 * for signing in, where an older account's password may predate the rule. The
 * length is reported first, then what is missing.
 */
export const newPasswordSchema = z
  .string()
  .min(MIN_PASSWORD_LENGTH, PASSWORD_TOO_SHORT_MESSAGE)
  .superRefine((value, context) => {
    const message = missingCharactersMessage(value);
    if (message) context.addIssue({ code: 'custom', message });
  });

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
  password: newPasswordSchema,
});

/** Resending a confirmation and asking for a reset link both need just this. */
export const emailRequestSchema = z.object({ email });

export const updatePasswordSchema = z
  .object({
    password: newPasswordSchema,
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
