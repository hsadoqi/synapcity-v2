import { z } from 'zod';
import { nameSchema } from './name';
import { avatarFileSchema } from './avatar';

/** What the profile form submits. Add a field here and the types follow. */
export const profileSchema = z.object({
  name: nameSchema,
  avatar: avatarFileSchema.optional(),
});

export type ProfileInput = z.infer<typeof profileSchema>;
