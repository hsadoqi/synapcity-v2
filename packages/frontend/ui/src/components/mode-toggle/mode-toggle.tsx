'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import type { Mode } from '@synapcity/frontend-ui/providers/mode-provider';
import { useMode } from '@synapcity/frontend-ui/providers/mode-provider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@synapcity/frontend-ui/core/dropdown-menu';
import {
  IconButton,
  IconButtonProps,
  IconSize,
} from '@synapcity/frontend-ui/components/icon-button';
import { ButtonVariant } from '@synapcity/frontend-ui/core/button';

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
  const { mode, setMode } = useMode();

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={(props) => (
            <ModeButton {...props} size={size} variant={variant} />
          )}
        />
        <DropdownMenuContent align="end">
          <ModeMenu value={isMode(mode) ? mode : 'system'} onUpdate={setMode} />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export { ModeMenu, ModeButton, ModeToggle };
export type { Mode };
