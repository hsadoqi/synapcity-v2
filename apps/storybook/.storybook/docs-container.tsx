import { useEffect, useState } from 'react';
import type { ComponentProps } from 'react';
import { DocsContainer } from '@storybook/addon-docs/blocks';
import { darkDocsTheme, lightDocsTheme } from './theme';

/*
 * Docs pages draw their own chrome (page background, headings, props table) from
 * `parameters.docs.theme`, which is a fixed value. This container picks the dark or light docs
 * theme from the `.light` / `.dark` class the toolbar switcher puts on <html> instead, so the page follows the stories on it.
 */
const readMode = () =>
  document.documentElement.classList.contains('light') ? 'light' : 'dark';

export function ThemedDocsContainer(
  props: Omit<ComponentProps<typeof DocsContainer>, 'theme'>,
) {
  const [mode, setMode] = useState<'light' | 'dark'>(readMode);

  // addon-themes writes the class on <html> after the docs page first renders and does not
  // always announce it on the channel, so watch the class itself.
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setMode(readMode());
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return (
    <DocsContainer
      {...props}
      theme={mode === 'light' ? lightDocsTheme : darkDocsTheme}
    />
  );
}
