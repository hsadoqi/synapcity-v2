import {
  firstNameSchema,
  lastNameSchema,
  nameSchema,
} from '@synapcity/domain-identity';
import { z } from 'zod';

/**
 * An optional display name: blank or missing becomes `undefined`, so the
 * person is shown by their first name; otherwise the display-name rule.
 */
const optionalDisplayNameSchema = z
  .string()
  .optional()
  .transform((value) => value?.trim() || undefined)
  .pipe(nameSchema.optional());

/**
 * What the profile-setup step and the settings name form submit: a required
 * first name, an optional last name and an optional display name. Built from
 * the domain's name rules, so the form, the server and the database check
 * agree. Saving it completes profile setup.
 */
export const profileNamesSchema = z.object({
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  displayName: optionalDisplayNameSchema,
});

export type ProfileNamesInput = z.input<typeof profileNamesSchema>;
export type ProfileNamesValues = z.output<typeof profileNamesSchema>;
