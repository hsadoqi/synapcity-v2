'use client';

import { useId } from 'react';
import { PanelLeft, FileText, Plus, ArrowUpRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePrefersDark } from '../../../hooks/use-prefers-dark';
import { previewFontStyle } from '../../../shared/font-preferences';
import {
  previewShapeAttributes,
  previewTextScaleStyle,
} from '../../../shared/theme-shape';
import { usePreviewFont } from '../../../hooks/use-preview-font';
import type { ThemeSettings } from '../../../types/theme';

/**
 * A sample workspace in the theme being chosen, before it is saved. The page
 * keeps its saved theme until then, so the mode and fonts are scoped to the
 * sample: a `light`/`dark` class (System resolves against the device, and follows
 * it as it changes) and `--font-preference-*` on the frame, which the `@theme
 * inline` role tokens read right there.
 *
 * A figure, named by its visible caption, so the mockup is announced once as an
 * illustration. Its sample sidebar, heading and text are hidden from assistive
 * tech: read aloud they would pass for real page content, and the heading would
 * join the settings outline.
 */
export const ThemeLivePreview = ({ theme }: { theme: ThemeSettings }) => {
  const prefersDark = usePrefersDark();
  const mode =
    theme.mode === 'system' ? (prefersDark ? 'dark' : 'light') : theme.mode;
  usePreviewFont(theme.headingFont);
  usePreviewFont(theme.bodyFont);
  usePreviewFont(theme.codeFont);
  // Browsers name a figure from its figcaption on their own; the explicit link
  // makes that hold for every assistive-tech stack, jsdom's included.
  const captionId = useId();
  // Deliberately inline: the draft's fonts and text scale are runtime data, not static styling.
  const frameStyle = {
    ...previewFontStyle(theme),
    ...previewTextScaleStyle(theme),
  };
  return (
    <figure aria-labelledby={captionId} className="flex flex-col gap-3">
      <figcaption id={captionId} className="text-xs text-muted-foreground">
        Live preview
      </figcaption>
      {/* Dynamic, so inline: the chosen fonts and text size are data, not a static style. */}
      <div
        aria-hidden
        className={cn(
          'overflow-hidden rounded-lg border border-border bg-background font-body text-foreground',
          mode,
        )}
        style={frameStyle}
        {...previewShapeAttributes(theme)}
      >
        <div className="flex h-9 items-center justify-between border-b border-border bg-muted/40 px-3">
          <div className="flex gap-1.5">
            <span className="size-1.5 rounded-sm bg-muted-foreground/40" />
            <span className="size-1.5 rounded-sm bg-muted-foreground/40" />
            <span className="size-1.5 rounded-sm bg-muted-foreground/40" />
          </div>
          <span className="text-xs text-muted-foreground">Your workspace</span>
          <PanelLeft className="size-3 text-muted-foreground" />
        </div>
        {/* A fixed height, not a minimum: a font loading in or a heading
            wrapping differently reflows inside the frame instead of resizing
            it, so the popover around it does not jump. */}
        <div className="flex h-72 overflow-hidden">
          <div className="hidden w-36 shrink-0 flex-col gap-5 border-r border-border bg-muted/30 p-4 sm:flex">
            <div className="flex items-center gap-2 text-xs font-medium">
              <div className="flex size-5 items-center justify-center rounded-sm bg-primary text-primary-foreground">
                S
              </div>
              Personal
            </div>
            <div className="flex flex-col gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-2 text-foreground">
                <FileText className="size-3" />
                All notes
              </span>
              <span className="flex items-center gap-2">
                <Plus className="size-3" />
                New collection
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="h-1.5 w-16 rounded-sm bg-muted" />
              <div className="h-1.5 w-20 rounded-sm bg-muted" />
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-5 p-5 sm:p-7">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Personal / Notes
              </span>
              <ArrowUpRight className="size-3 text-muted-foreground" />
            </div>
            <div className="flex flex-col gap-2">
              <p className="font-heading text-lg font-medium tracking-tight text-balance">
                A little room to think.
              </p>
              <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
                Collect your ideas. Connect the dots. Make something that
                matters to you.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="h-1.5 w-4/5 rounded-sm bg-muted" />
              <div className="h-1.5 w-3/5 rounded-sm bg-muted" />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex size-4 items-center justify-center rounded-sm bg-primary text-primary-foreground">
                <Check className="size-3" />
              </span>
              Make space for the next idea
            </div>
          </div>
        </div>
      </div>
    </figure>
  );
};
