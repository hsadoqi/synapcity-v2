import z from 'zod';

import { bodyFonts, codeFonts, headingFonts } from './fonts';

// The font fields carry their own default, as the appearance schema does, so a
// saved or imported object from before they existed still parses. `mode` has no
// default on purpose: the provider reads `themeSchema.shape.mode` to tell a real
// mode from "not known yet".
export const themeSchema = z.object({
  mode: z.enum(['light', 'dark', 'system']),
  headingFont: z.enum(headingFonts).default('default'),
  bodyFont: z.enum(bodyFonts).default('default'),
  codeFont: z.enum(codeFonts).default('default'),
});

export type ThemeSettings = z.infer<typeof themeSchema>;
export type ThemeSettingsPatch = Partial<ThemeSettings>;

export const themeDefaults: ThemeSettings = {
  mode: 'system',
  headingFont: 'default',
  bodyFont: 'default',
  codeFont: 'default',
};
