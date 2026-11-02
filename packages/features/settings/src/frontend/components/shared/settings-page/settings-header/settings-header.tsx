'use client';

import { Check, RotateCw } from 'lucide-react';
import { Button } from '@synapcity/frontend-ui/core/button';
import { useSettings } from '../../../../hooks';

export const SettingsHeader = () => {
  const { status, name, canRetryAccountSave, retryAccountSave } = useSettings();
  return (
    <header className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-tight text-balance">
          Settings
        </h1>
        <div className="flex items-center gap-2">
          <span
            className="flex min-h-5 items-center gap-1.5 text-xs text-muted-foreground"
            role="status"
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
              onClick={retryAccountSave}
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
