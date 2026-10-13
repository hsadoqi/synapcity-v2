'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { IconButton, IconButtonProps, IconSize } from './icon-button';
import { ButtonVariant } from './ui/button';

type Mode = 'light' | 'dark' | 'system';

const ModeButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, ...props }, ref) => {
    return (
      <IconButton
        data-slot="mode-button"
        aria-label="Theme"
        variant="outline"
        ref={ref}
        className={className}
        {...props}
      >
        <Sun className="scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
        <Moon className="absolute scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
        <span className="sr-only">Theme</span>
      </IconButton>
    );
  },
);

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

function ModeToggle({
  className,
  size = 'md',
  variant = 'default',
}: {
  className?: string;
  size?: IconSize;
  variant?: ButtonVariant;
}) {
  const { theme, setTheme } = useTheme();

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={(props) => (
            <ModeButton {...props} size={size} variant={variant} />
          )}
        />
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
