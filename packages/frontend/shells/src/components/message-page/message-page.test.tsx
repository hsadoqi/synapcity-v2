import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MessagePage } from '.';

describe('MessagePage', () => {
  it('has one h1 with the title, the description and the ways forward', () => {
    render(
      <MessagePage title="Oops" description="Something happened.">
        <button type="button">Do the thing</button>
      </MessagePage>,
    );

    screen.getByRole('heading', { level: 1, name: 'Oops' });
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByText('Something happened.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Do the thing' })).toBeTruthy();
  });

  it('lets the heading take focus without joining the tab order', () => {
    render(
      <MessagePage title="Oops" description="x">
        <span />
      </MessagePage>,
    );

    const heading = screen.getByRole('heading', { name: 'Oops' });
    expect(heading.getAttribute('tabindex')).toBe('-1');
    heading.focus();
    expect(document.activeElement).toBe(heading);
  });

  it('leaves focus alone unless asked to take it', () => {
    render(
      <>
        <button type="button">Before</button>
        <MessagePage title="Oops" description="x">
          <span />
        </MessagePage>
      </>,
    );
    expect(document.activeElement).toBe(document.body);
  });

  it('moves focus to its heading when it appears and when the focus key changes', () => {
    const view = render(
      <MessagePage title="Oops" description="x" focusKey="first">
        <button type="button">Retry</button>
      </MessagePage>,
    );
    const heading = screen.getByRole('heading', { name: 'Oops' });
    expect(document.activeElement).toBe(heading);

    screen.getByRole('button', { name: 'Retry' }).focus();
    view.rerender(
      <MessagePage title="Oops" description="x" focusKey="first">
        <button type="button">Retry</button>
      </MessagePage>,
    );
    expect(document.activeElement).not.toBe(heading);

    view.rerender(
      <MessagePage title="Oops" description="x" focusKey="second">
        <button type="button">Retry</button>
      </MessagePage>,
    );
    expect(document.activeElement).toBe(heading);
  });

  it('focuses its own heading when another message page is on the page', () => {
    render(
      <>
        <MessagePage title="Not found" description="x">
          <span />
        </MessagePage>
        <MessagePage title="Could not load" description="x" focusKey="error">
          <span />
        </MessagePage>
      </>,
    );
    expect(document.activeElement).toBe(
      screen.getByRole('heading', { name: 'Could not load' }),
    );
  });
});
