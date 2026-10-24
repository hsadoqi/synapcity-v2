import z from 'zod';

import { bodyFonts, codeFonts, headingFonts } from '../fonts';

/**
 * The corner radius and density presets. Names only: the factor behind each lives in one place,
 * tokens/preferences.css, as a `[data-radius]` / `[data-density]` rule, so the app and the live
 * preview cannot disagree about what "rounded" or "compact" means. The default of each is the
 * look the app had before these settings existed.
 */
export const radii = ['sharp', 'default', 'soft', 'rounded'] as const;
export const densities = ['compact', 'comfortable', 'spacious'] as const;

/**
 * Text size, as a percentage of the default body size. A number rather than presets so it can be
 * stepped: tokens/preferences.css multiplies the base size by it, so any allowed step works
 * without a CSS rule of its own.
 */
export const textSizeRange = { min: 80, max: 150, step: 5 } as const;
const textSizeSchema = z
  .number()
  .int()
  .min(textSizeRange.min)
  .max(textSizeRange.max)
  .multipleOf(textSizeRange.step);

/**
 * Text size was once three presets saved as `appearance.fontSize`. Each maps to the step nearest
 * the size it set (14px and 17px of the 15px default), for stored settings and old exports.
 */
export const legacyFontSizes = { small: 95, medium: 100, large: 115 } as const;

// The font, radius, density and text size fields carry their own default, as the appearance schema does,
// so a saved or imported object from before they existed still parses. `mode` has no
// default on purpose: the provider reads `themeSchema.shape.mode` to tell a real
// mode from "not known yet".
export const themeSchema = z.object({
  mode: z.enum(['light', 'dark', 'system']),
  headingFont: z.enum(headingFonts).default('default'),
  bodyFont: z.enum(bodyFonts).default('default'),
  codeFont: z.enum(codeFonts).default('default'),
  radius: z.enum(radii).default('default'),
  density: z.enum(densities).default('comfortable'),
  textSize: textSizeSchema.default(100),
});

export type ThemeSettings = z.infer<typeof themeSchema>;
export type ThemeSettingsPatch = Partial<ThemeSettings>;

export const themeDefaults: ThemeSettings = {
  mode: 'system',
  headingFont: 'default',
  bodyFont: 'default',
  codeFont: 'default',
  radius: 'default',
  density: 'comfortable',
  textSize: 100,
};
