import type { CSSProperties } from 'react';
import type { FontChoice, Look } from '@synapcity/domain-preferences';
import {
  fontPreferenceVariables,
  fontStack,
} from '../../scripts/font-preferences';

type LookStyle = CSSProperties & Record<string, string | number | undefined>;

export type LookHtmlAttributes = {
  'data-synapcity-look': string;
  className?: 'light' | 'dark';
  'data-animations': string;
  'data-borders': string;
  'data-contrast': string;
  'data-density': string;
  'data-radius': string;
  'data-reduced-motion': string;
  'data-text-size': string;
  style: LookStyle;
};

const fontFields = {
  heading: 'headingFont',
  body: 'bodyFont',
  code: 'codeFont',
} as const;

/**
 * Turns an already validated look into the attributes the shared preference
 * CSS reads from `<html>`. It has no browser or framework dependency, so both
 * Next.js hosts can render the same first-paint contract from a request cookie.
 */
export function lookHtmlAttributes(look: Look): LookHtmlAttributes {
  const style: LookStyle = {
    '--text-scale': String(look.theme.textSize / 100),
  };
  for (const [role, field] of Object.entries(fontFields)) {
    const choice: FontChoice = look.theme[field];
    if (choice !== 'default') {
      style[fontPreferenceVariables[role as keyof typeof fontFields]] =
        fontStack(choice);
    }
  }
  if (look.theme.mode !== 'system') style.colorScheme = look.theme.mode;

  return {
    'data-synapcity-look': JSON.stringify(look),
    ...(look.theme.mode === 'system' ? {} : { className: look.theme.mode }),
    'data-animations': String(look.appearance.animationsEnabled),
    'data-borders': String(look.appearance.showBorders),
    'data-contrast': look.appearance.contrastMode,
    'data-density': look.theme.density,
    'data-radius': look.theme.radius,
    'data-reduced-motion': String(look.appearance.reducedMotion),
    'data-text-size': String(look.theme.textSize),
    style,
  };
}
