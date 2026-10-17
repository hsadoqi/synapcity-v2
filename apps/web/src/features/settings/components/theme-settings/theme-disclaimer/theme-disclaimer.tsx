import type { Mode } from '@synapcity/frontend-ui/providers/mode-provider';
import { Monitor } from 'lucide-react';

// Whole sentences, not "always in ${mode} mode": a translation can then reorder
// or inflect the mode name instead of inheriting the English word order. Each
// describes the option, not the workspace, so it reads true for a choice that
// is still unsaved as well as a saved one.
const messages: Record<Mode, string> = {
  system: 'Follows your device, switching between light and dark with it.',
  light: 'Always light, whatever your device is set to.',
  dark: 'Always dark, whatever your device is set to.',
};

export const ThemeDisclaimer = ({ theme }: { theme: { mode: Mode } }) => {
  return (
    <p className="flex items-center gap-2 text-xs text-muted-foreground">
      <Monitor className="size-3.5" />
      {messages[theme.mode]}
    </p>
  );
};
