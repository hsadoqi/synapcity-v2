import z from 'zod';

import { bodyFonts, codeFonts, headingFonts } from './fonts';

/**
 * The corner radius and density presets. Names only: the factor behind each lives in one place,
 * tokens/preferences.css, as a `[data-radius]` / `[data-density]` rule, so the app and the live
 * preview cannot disagree about what "rounded" or "compact" means. The default of each is the
 * look the app had before these settings existed.
 */
export const radii = ['sharp', 'default', 'rounded', 'round'] as const;
export const densities = ['compact', 'comfortable', 'spacious'] as const;

// The font, radius and density fields carry their own default, as the appearance schema does,
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
};
