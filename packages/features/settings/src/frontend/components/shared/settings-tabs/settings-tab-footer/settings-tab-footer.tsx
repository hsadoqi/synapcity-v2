'use client';

import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@synapcity/frontend-ui/core/button';

type SettingsTabFooterProps = {
  /** The tab's name, as its reset action says it ("Reset Regional to defaults"). */
  tab: string;
  hasChanges: boolean;
  /** Every field in the draft is already its default: there is nothing to reset. */
  atDefaults: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onReset: () => void;
};

/**
 * A settings tab's actions. Changes wait in a draft until Save, so the account
 * is written once per save rather than once per change. Reset fills the draft
 * with the defaults and waits for Save too, so Discard undoes it and it needs
 * no confirmation.
 */
export function SettingsTabFooter({
  tab,
  hasChanges,
  atDefaults,
  onSave,
  onDiscard,
  onReset,
}: SettingsTabFooterProps) {
  // "Saved." confirms the last save until the next change.
  const [saved, setSaved] = useState(false);
  if (saved && hasChanges) setSaved(false);
  return (
    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Button
        type="button"
        variant="ghost"
        disabled={atDefaults}
        focusableWhenDisabled
        onClick={onReset}
        className="self-start"
      >
        <RotateCcw data-icon="inline-start" />
        Reset {tab} to defaults
      </Button>
      <div className="flex items-center gap-3">
        <p role="status" className="me-auto text-xs text-muted-foreground">
          {hasChanges ? 'You have unsaved changes.' : saved ? 'Saved.' : ''}
        </p>
        {/* Each button disables itself when used. Focusable while disabled,
            so keyboard focus stays on it instead of falling back to the page. */}
        <Button
          type="button"
          variant="outline"
          disabled={!hasChanges}
          focusableWhenDisabled
          onClick={onDiscard}
        >
          Discard
        </Button>
        <Button
          type="button"
          disabled={!hasChanges}
          focusableWhenDisabled
          onClick={() => {
            onSave();
            setSaved(true);
          }}
        >
          Save changes
        </Button>
      </div>
    </div>
  );
}
