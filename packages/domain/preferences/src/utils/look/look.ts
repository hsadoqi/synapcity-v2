import { z } from 'zod';
import {
  bodyFonts,
  codeFonts,
  contrastModes,
  densities,
  headingFonts,
  radii,
  textSizeRange,
  themeSchema,
  type Settings,
} from '../../schemas';
import { displaySchema } from '../scope';

/** Light, dark, or follow the system. */
export const lookModes = themeSchema.shape.mode.options;

export const LOOK_VERSION = 1;

/** The cookie that carries the look between browser hosts on one parent domain. */
export const LOOK_COOKIE_NAME = 'synapcity-look';

/**
 * The look: the display choices every host shows the same (ADR-0010,
 * amendment). It holds nothing else, so nothing private reaches a cookie.
 */
export const lookSchema = z.object({
  v: z.literal(LOOK_VERSION),
  // Every field is required, with no defaults: a cookie that is missing one is
  // rejected, never completed. The boot scripts apply the same rule from the
  // same lists, so the browser, React and the server accept the same cookies.
  theme: z.object({
    mode: z.enum(lookModes),
    headingFont: z.enum(headingFonts),
    bodyFont: z.enum(bodyFonts),
    codeFont: z.enum(codeFonts),
    radius: z.enum(radii),
    density: z.enum(densities),
    textSize: z
      .number()
      .int()
      .min(textSizeRange.min)
      .max(textSizeRange.max)
      .multipleOf(textSizeRange.step),
  }),
  appearance: z.object({
    animationsEnabled: z.boolean(),
    reducedMotion: z.boolean(),
    contrastMode: z.enum(contrastModes),
    showBorders: z.boolean(),
  }),
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
