'use client';

import { Eye } from 'lucide-react';
import { Button } from '@synapcity/frontend-ui/core/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@synapcity/frontend-ui/core/popover';
import type { ThemeSettings } from '../../../types/theme';
import { ThemeLivePreview } from '../theme-live-preview';

/**
 * The live preview, one press away from the tab's header, which stays in view
 * however far the form is scrolled.
 *
 * Pressed open, not hovered: hover is not there for touch or the keyboard, and
 * it would close the moment the pointer moved to a control to change something.
 * It also stays open while the form is used. A popover normally closes when
 * anything outside it is pressed or focused; here that is the point of using
 * it, so only the trigger and Escape close it. The Select menus portal outside
 * the popup, so without this each choice would dismiss the preview it changes.
 */
export const ThemePreviewPopover = ({
  theme,
  hasChanges,
}: {
  theme: ThemeSettings;
  /** Unsaved choices exist, and the preview is the way to see them. */
  hasChanges: boolean;
}) => (
  <Popover
    onOpenChange={(_open, details) => {
      if (details.reason === 'outside-press' || details.reason === 'focus-out')
        details.cancel();
    }}
  >
    <PopoverTrigger render={<Button variant="outline" />}>
      <Eye data-icon="inline-start" />
      Preview
      {hasChanges && (
        <>
          <span
            aria-hidden
            className="size-1.5 rounded-full bg-primary"
            data-testid="preview-changes-dot"
          />
          <span className="sr-only">, with unsaved changes</span>
        </>
      )}
    </PopoverTrigger>
    <PopoverContent
      side="right"
      aria-label="Live preview"
      className="w-96 max-w-(--available-width)"
    >
      <ThemeLivePreview theme={theme} />
    </PopoverContent>
  </Popover>
);
