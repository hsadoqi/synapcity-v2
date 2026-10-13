'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

type Mode = 'light' | 'dark' | 'system';

const ModeButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof Button>
>(({ className, ...props }, ref) => {
  return (
    <Button
      variant="outline"
      size="icon"
      ref={ref}
      className={className}
      {...props}
    >
      <Sun className="scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      <span className="sr-only">Theme</span>
    </Button>
  );
});

const MODES: ReadonlyArray<{ value: Mode; label: string }> = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

const isMode = (value: unknown): value is Mode =>
  MODES.some((mode) => mode.value === value);

function ModeMenu({
  value,
  onUpdate,
}: {
  value: Mode;
  onUpdate?: (theme: Mode) => void;
}) {
  return (
    <DropdownMenuRadioGroup
      value={value}
      onValueChange={(next) => {
        if (isMode(next)) onUpdate?.(next);
      }}
    >
      {MODES.map((mode) => (
        <DropdownMenuRadioItem key={mode.value} value={mode.value}>
          {mode.label}
        </DropdownMenuRadioItem>
      ))}
    </DropdownMenuRadioGroup>
  );
}

function ModeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger render={(props) => <ModeButton {...props} />} />
        <DropdownMenuContent align="end">
          <ModeMenu
            value={isMode(theme) ? theme : 'system'}
            onUpdate={setTheme}
          />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export { ModeMenu, ModeButton, ModeToggle };
export type { Mode };
