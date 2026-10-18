'use client';

import { Check } from 'lucide-react';
import { useSettings } from '../../../hooks/use-settings';

export const SettingsHeader = () => {
  const { status, name } = useSettings();
  return (
    <header className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-tight text-balance">
          Settings
        </h1>
        <span
          className="flex min-h-5 items-center gap-1.5 text-xs text-muted-foreground"
          role="status"
        >
          {status === 'Saved' && <Check className="size-3.5" />}
          {status}
        </span>
      </div>
      <p className="max-w-prose text-sm text-muted-foreground">
        {name ? `Welcome, ${name}.` : 'Welcome.'} This is your personal space. A
        workspace that feels like you. Make yourself at home.
      </p>
    </header>
  );
};
