import { z } from 'zod';
import { themeSchema, type Settings } from '../../schemas';
import { displaySchema } from '../scope';

export const LOOK_VERSION = 1;

/** The cookie that carries the look between browser hosts on one parent domain. */
export const LOOK_COOKIE_NAME = 'synapcity-look';

/**
 * The look: the display choices every host shows the same (ADR-0010,
 * amendment). It holds nothing else, so nothing private reaches a cookie.
 */
export const lookSchema = z.object({
  v: z.literal(LOOK_VERSION),
  theme: themeSchema.pick({
    mode: true,
    headingFont: true,
    bodyFont: true,
    codeFont: true,
    radius: true,
    density: true,
    textSize: true,
  }),
  appearance: displaySchema,
});
export type Look = z.infer<typeof lookSchema>;

/** The look in effect for these settings, with every other field left out. */
export function lookOf(settings: Settings): Look {
  const { mode, headingFont, bodyFont, codeFont, radius, density, textSize } =
    settings.theme;
  return {
    v: LOOK_VERSION,
    theme: { mode, headingFont, bodyFont, codeFont, radius, density, textSize },
    appearance: displaySchema.parse(settings.appearance),
  };
}

/** The look from untrusted input, or null for anything invalid or not version 1. */
export function parseLook(raw: unknown): Look | null {
  const parsed = lookSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
