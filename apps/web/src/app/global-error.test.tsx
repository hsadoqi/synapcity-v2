import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import GlobalError from './global-error';

const render = (message = 'db password is hunter2') =>
  renderToStaticMarkup(
    <GlobalError
      error={Object.assign(new Error(message), { digest: 'abc123' })}
      retry={() => {}}
    />,
  );

describe('the global error page', () => {
  it('is a whole document, since it replaces the root layout', () => {
    const html = render();

    expect(html).toMatch(/^<html lang="en">/);
    expect(html).toContain('<body>');
  });

  it('says something went wrong and offers a retry and a way home', () => {
    const html = render();

    expect(html).toContain('<h1>Something went wrong</h1>');
    expect(html).toMatch(/<button[^>]*type="button"[^>]*>Try again<\/button>/);
    expect(html).toContain('<a href="/">Go to the home page</a>');
    expect(html.match(/<h1/g)).toHaveLength(1);
  });

  it('lets the browser choose readable light or dark colours', () => {
    expect(render()).toContain(
      '<meta name="color-scheme" content="light dark"',
    );
  });

  it('shows none of the error, which can hold details that must stay private', () => {
    const html = render();

    expect(html).not.toMatch(/hunter2|password|abc123/i);
  });

  it('uses no styles of its own, because none of the app styles exist here', () => {
    const html = render();

    expect(html).not.toMatch(/style=|class=/);
  });
});
