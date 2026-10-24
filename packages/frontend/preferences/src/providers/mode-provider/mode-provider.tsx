'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';
import type { Mode, ResolvedMode } from '../../types';
import { shareMode } from '../../store';
import { resolveMode } from '../../utils';

const ShareLookContext = React.createContext(false);

export function ModeProvider({
  children,
  initialMode = 'system',
  shareLook = false,
  ...props
}: React.ComponentProps<typeof NextThemesProvider> & {
  initialMode?: Mode;
  /**
   * Write the chosen mode into the shared look cookie. Off by default: only
   * the apps turn it on, so Storybook, which shares `localhost` with them,
   * never changes a person's real look.
   */
  shareLook?: boolean;
}) {
  return (
    <ShareLookContext.Provider value={shareLook}>
      <NextThemesProvider {...props} defaultTheme={initialMode}>
        {children}
      </NextThemesProvider>
    </ShareLookContext.Provider>
  );
}

export const useMode = () => {
  const { theme, setTheme } = useTheme();
  const shareLook = React.useContext(ShareLookContext);

  const resolvedMode = React.useMemo(() => {
    return resolveMode(theme as Mode);
  }, [theme]);

  const setMode = React.useCallback(
    (next: Mode) => {
      setTheme(next);
      if (shareLook) shareMode(next);
    },
    [setTheme, shareLook],
  );

  return {
    mode: resolvedMode as ResolvedMode,
    nativeMode: theme as Mode,
    setMode,
  };
};
