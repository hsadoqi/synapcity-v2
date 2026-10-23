'use client';

import { useState } from 'react';
import { Eye } from 'lucide-react';
import { Button } from '@synapcity/frontend-ui/core/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@synapcity/frontend-ui/core/popover';
import { useSettingsTabActive } from '../../../shared/settings-tabs/settings-tab-active';
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
 *
 * Pressing another settings tab is also an outside press, and the Theme tab
 * stays mounted while hidden, so the preview closes itself when its tab is no
 * longer the one shown. It stays closed on return.
 */
export const ThemePreviewPopover = ({
  theme,
  hasChanges,
}: {
  theme: ThemeSettings;
  /** Unsaved choices exist, and the preview is the way to see them. */
  hasChanges: boolean;
}) => {
  const active = useSettingsTabActive();
  const [open, setOpen] = useState(false);
  if (!active && open) setOpen(false);
  return (
    <Popover
      open={open}
      onOpenChange={(next, details) => {
        if (
          details.reason === 'outside-press' ||
          details.reason === 'focus-out'
        )
          return details.cancel();
        setOpen(next);
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
        className="w-lg max-w-(--available-width)"
      >
        <ThemeLivePreview theme={theme} />
      </PopoverContent>
    </Popover>
  );
};
