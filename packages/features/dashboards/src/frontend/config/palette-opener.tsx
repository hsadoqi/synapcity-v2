'use client';

import { createContext, useContext } from 'react';

const noop = () => {};

const PaletteOpenerContext = createContext<() => void>(noop);

/** Serves the editor surface's "show the palette" action to the canvas parts that need it. */
export const PaletteOpenerProvider = PaletteOpenerContext.Provider;

/**
 * Asks for the widgets palette: the host shows it (for example by opening a
 * panel destination) and focus then moves to its first button. A no-op outside
 * an editor surface.
 */
export function usePaletteOpener(): () => void {
  return useContext(PaletteOpenerContext);
}
