'use client';

import { useEffect, useRef } from 'react';
import { Check, RotateCw } from 'lucide-react';
import { Button } from '@synapcity/frontend-ui/core/button';
import { useSettings } from '../../../../hooks/use-settings-lifecycle/use-settings';

export const SettingsHeader = () => {
  const {
    status,
    name,
    canRetryAccountSave,
    isRetryingAccountSave,
    retryAccountSave,
  } = useSettings();
  const statusRef = useRef<HTMLSpanElement>(null);
  const focusStatusAfterRetry = useRef(false);

  // The retry control disappears after success. Move focus to the resulting
  // live status instead of letting the browser drop keyboard focus to <body>.
  // A retry that fails again keeps the control, and focus stays on it.
  useEffect(() => {
    if (!focusStatusAfterRetry.current || isRetryingAccountSave) return;
    if (!canRetryAccountSave) statusRef.current?.focus();
    focusStatusAfterRetry.current = false;
  }, [canRetryAccountSave, isRetryingAccountSave]);

  const retry = () => {
    focusStatusAfterRetry.current = true;
    retryAccountSave();
  };

  return (
    <header className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-tight text-balance">
          Settings
        </h1>
        <div className="flex items-center gap-2">
          <span
            ref={statusRef}
            className="flex min-h-5 items-center gap-1.5 text-xs text-muted-foreground"
            role="status"
            tabIndex={-1}
          >
            {status === 'Saved' && <Check className="size-3.5" />}
            {status}
          </span>
          {/* Beside the live region, not in it: a control inside one is
              announced as part of every status change. */}
          {canRetryAccountSave && (
            <Button
              type="button"
              variant="outline"
              size="xs"
              // Disabled but still focusable: a natively disabled button
              // that holds focus drops it to <body> (the focus fixup rule).
              disabled={isRetryingAccountSave}
              focusableWhenDisabled
              aria-busy={isRetryingAccountSave}
              onClick={retry}
            >
              <RotateCw data-icon="inline-start" />
              Try again
            </Button>
          )}
        </div>
      </div>
      <p className="max-w-prose text-sm text-muted-foreground">
        {name ? `Welcome, ${name}.` : 'Welcome.'} This is your personal space. A
        workspace that feels like you. Make yourself at home.
      </p>
    </header>
  );
};
