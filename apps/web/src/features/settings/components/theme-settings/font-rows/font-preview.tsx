'use client';

import { cn } from '@/lib/utils';
import { previewFontValue } from '@synapcity/frontend-preferences';
import { fontPreferenceVariables } from '@synapcity/frontend-preferences';
import {
  googleFonts,
  type FontChoice,
  type FontRole,
} from '@synapcity/domain-preferences';
import { usePreviewFont } from '../../../hooks/use-preview-font';
import { PreviewFigure } from '../preview-figure';

const roleStyles: Record<FontRole, string> = {
  heading: 'font-heading text-xl font-semibold tracking-tight',
  body: 'font-body text-base',
  code: 'font-code text-sm',
};

const roleNames: Record<FontRole, string> = {
  heading: 'Heading',
  body: 'Body',
  code: 'Code',
};

/**
 * One sentence set in `font`, the role's chosen but not yet saved font. It sets
 * the role's `--font-preference-*` on itself only, so it shows the choice while
 * the rest of the page keeps the saved font. `PreviewFigure` marks it as a
 * sample, not content.
 */
export function FontPreview({
  role,
  font,
  children,
}: {
  role: FontRole;
  font: FontChoice;
  children: string;
}) {
  const { failed } = usePreviewFont(font);
  // Inline because it is data, not styling: the font picked in this row, set on
  // the sample alone (a class cannot carry a value chosen at runtime).
  const fontVariable = {
    [fontPreferenceVariables[role]]: previewFontValue(font),
  };
  return (
    <PreviewFigure
      label={`${roleNames[role]} font preview`}
      style={fontVariable}
    >
      <p className={cn('text-foreground', roleStyles[role])}>{children}</p>
      {failed && font !== 'default' ? (
        <p className="text-xs text-destructive">
          {`${googleFonts[font].label} couldn’t be loaded from Google Fonts, so this sample uses a fallback font.`}
        </p>
      ) : null}
    </PreviewFigure>
  );
}
