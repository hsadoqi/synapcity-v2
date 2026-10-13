'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
      <span className="sr-only">Toggle Mode</span>
    </Button>
  );
});

const ModeMenu = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<'div'> & { onUpdate?: (theme: Mode) => void }
>(({ className, onUpdate, ...props }, ref) => {
  return (
    <div ref={ref} className={className} {...props}>
      <DropdownMenuItem onClick={() => onUpdate?.('light')}>
        Light
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onUpdate?.('dark')}>
        Dark
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onUpdate?.('system')}>
        System
      </DropdownMenuItem>
    </div>
  );
});

function ModeToggle({ className }: { className?: string }) {
  const { setTheme } = useTheme();

  const handleModeChange = (theme: Mode) => {
    console.log('ModeToggle: handleModeChange', theme);
    setTheme(theme);
  };

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={(props) => (
            <ModeButton aria-label="Toggle dark mode" {...props} />
          )}
        />
        <DropdownMenuContent align="end">
          <ModeMenu onUpdate={(theme) => handleModeChange(theme)} />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export { ModeMenu, ModeButton, ModeToggle };
export type { Mode };
