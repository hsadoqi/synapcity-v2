'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';
import type { Mode, ResolvedMode } from '../../types';
import { resolveMode } from '../../utils';

export function ModeProvider({
  children,
  initialMode = 'system',
  ...props
}: React.ComponentProps<typeof NextThemesProvider> & {
  initialMode?: Mode;
}) {
  return (
    <NextThemesProvider {...props} defaultTheme={initialMode}>
      {children}
    </NextThemesProvider>
  );
}

export const useMode = () => {
  const { theme, setTheme } = useTheme();

  const resolvedMode = React.useMemo(() => {
    return resolveMode(theme as Mode);
  }, [theme]);

  const setMode = React.useCallback(
    (next: Mode) => {
      setTheme(next);
    },
    [setTheme],
  );

  return {
    mode: resolvedMode as ResolvedMode,
    nativeMode: theme as Mode,
    setMode,
  };
};
