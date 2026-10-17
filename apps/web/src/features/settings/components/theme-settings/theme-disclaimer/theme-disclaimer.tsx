import type { Mode } from '@synapcity/frontend-ui/providers/mode-provider';
import { Monitor } from 'lucide-react';

// Whole sentences, not "always in ${mode} mode": a translation can then reorder
// or inflect the mode name instead of inheriting the English word order.
const messages: Record<Mode, string> = {
  system: 'Your theme will change automatically with your device.',
  light: 'Your workspace is always in light mode.',
  dark: 'Your workspace is always in dark mode.',
};

export const ThemeDisclaimer = ({ theme }: { theme: { mode: Mode } }) => {
  return (
    <p className="flex items-center gap-2 text-xs text-muted-foreground">
      <Monitor className="size-3.5" />
      {messages[theme.mode]}
    </p>
  );
};
