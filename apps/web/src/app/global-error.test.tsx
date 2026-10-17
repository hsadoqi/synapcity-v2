import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// The font loaders only run inside Next's build; here they are replaced.
vi.mock('./fonts', () => ({ fontVariables: 'font-inter-var font-geist-var' }));

import GlobalError from './global-error';

const render = (message = 'db password is hunter2') =>
  renderToStaticMarkup(
    <GlobalError
      error={Object.assign(new Error(message), { digest: 'abc123' })}
      retry={() => {}}
    />,
  );

describe('the global error page', () => {
  beforeEach(() => {
    // jsdom has no matchMedia, which the theme provider asks about.
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        matches: false,
        media: '(prefers-color-scheme: dark)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
  });

  it('is a whole document, since it replaces the root layout', () => {
    const html = render();

    expect(html).toMatch(/^<html lang="en"/);
    expect(html).toContain('<body>');
  });

  it('brings the font variables the layout would have put on the document', () => {
    expect(render()).toMatch(
      /^<html[^>]*class="font-inter-var font-geist-var"/,
    );
  });

  it("uses the app's own message card, not bare HTML", () => {
    const html = render();

    expect(html).toContain('data-slot="card"');
    expect(html).toMatch(/<h1[^>]*>Something went wrong<\/h1>/);
    expect(html.match(/<h1/g)).toHaveLength(1);
  });

  it("offers a retry and a way home, both in the app's button styles", () => {
    const html = render();

    const retry = html.match(/<button[^>]*>Try again<\/button>/)?.[0] ?? '';
    expect(retry).toContain('data-slot="button"');
    expect(retry).toContain('type="button"');
    const home = html.match(/<a[^>]*>Go to the home page<\/a>/)?.[0] ?? '';
    expect(home).toContain('href="/"');
    // The same classes the Button component gives its outline variant.
    expect(home).toContain('inline-flex');
    expect(home).toContain('border');
  });

  it('lets the heading take focus without joining the tab order', () => {
    expect(render()).toMatch(/<h1[^>]*tabindex="-1"/);
  });

  it('carries the theme provider, so light and dark follow the on-device choice', () => {
    const html = render();

    expect(html).toContain('prefers-color-scheme: dark');
    expect(html).toContain('localStorage.getItem');
  });

  it('shows none of the error, which can hold details that must stay private', () => {
    const html = render();

    expect(html).not.toMatch(/hunter2|password|abc123/i);
  });

  it('uses no hard-coded styles of its own', () => {
    expect(render()).not.toMatch(/style="/);
  });
});
