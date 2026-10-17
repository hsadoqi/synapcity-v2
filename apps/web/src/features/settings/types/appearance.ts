import { z } from 'zod';

// Every field carries its own default, as the regional schema does, so a saved
// or imported object from before a field existed still parses.
export const appearanceSchema = z.object({
  animationsEnabled: z.boolean().default(true),
  reducedMotion: z.boolean().default(false),
  contrastMode: z.enum(['none', 'high', 'low']).default('none'),
  fontSize: z.enum(['small', 'medium', 'large']).default('medium'),
  // Mirrors `theme.mode`, which the Theme tab owns. Never edited here.
  colorScheme: z.enum(['light', 'dark', 'system']).default('system'),
  showBorders: z.boolean().default(false),
});

export type AppearanceSettings = z.infer<typeof appearanceSchema>;
export type AppearanceSettingsPatch = Partial<AppearanceSettings>;

export const appearanceDefaults: AppearanceSettings = appearanceSchema.parse(
  {},
);
