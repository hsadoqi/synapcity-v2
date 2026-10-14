import { renderToString } from 'react-dom/server';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { ModeProvider } from '../../providers/mode-provider';
import { RootHeaderContent } from './root-header';

vi.mock('next/navigation', () => ({ usePathname: () => '/' }));

// jsdom has no matchMedia, which the theme provider reads while rendering.
beforeAll(() => {
  vi.stubGlobal('matchMedia', (media: string) => ({
    matches: false,
    media,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }));
});

/**
 * Server render on purpose: the first HTML a visitor gets is what search
 * engines, link previews and no-JS clients see, and it is where a value synced
 * through state and an effect would still be wrong.
 */
function html(userId: string | null) {
  return renderToString(
    <ModeProvider>
      <RootHeaderContent userId={userId} />
    </ModeProvider>,
  );
}

describe('RootHeaderContent', () => {
  it('links the logo to the visitor home in the server-rendered HTML', () => {
    expect(html('user-1')).toContain('href="/user-1/home"');
  });

  it('links the logo to the landing page when signed out', () => {
    const markup = html(null);

    expect(markup).toContain('href="/"');
    expect(markup).not.toContain('/settings');
  });

  it('offers settings only when signed in', () => {
    expect(html('user-1')).toContain('href="/user-1/settings"');
  });
});
