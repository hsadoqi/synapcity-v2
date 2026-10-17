import type { Mode } from '@synapcity/frontend-ui/providers/mode-provider';
import { Monitor } from 'lucide-react';

export const ThemeDisclaimer = ({ theme }: { theme: { mode: Mode } }) => {
  return (
    <p className="flex items-center gap-2 text-xs text-muted-foreground">
      <Monitor className="size-3.5" />
      {theme.mode === 'system'
        ? 'Your theme will change automatically with your device.'
        : `Your workspace is always in ${theme.mode} mode.`}
    </p>
  );
};
