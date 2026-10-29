import { act, render, screen, within } from '@testing-library/react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { regionalDefaults } from '@synapcity/domain-preferences';
import type { BaseRecord } from '@synapcity/domain-records';
import { RegionalProvider } from '@synapcity/frontend-preferences';
import { TooltipProvider } from '@synapcity/frontend-ui/core/tooltip';
import { DocumentDetails } from './document-details';
import { DocumentView } from './document-view';

// The panel library lays out against browser measurements; supply them, as
// the Dashboard view's test does, and let each flush play ResizeObserver.
const observers = new Set<{
  callback: ResizeObserverCallback;
  elements: Set<Element>;
}>();
beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      elements = new Set<Element>();
      constructor(public callback: ResizeObserverCallback) {
        observers.add(this);
      }
      observe(element: Element) {
        this.elements.add(element);
      }
      unobserve(element: Element) {
        this.elements.delete(element);
      }
      disconnect() {
        observers.delete(this);
      }
    },
  );
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(
    function (this: HTMLElement) {
      if (this.hasAttribute('data-separator')) return 4;
      if (this.hasAttribute('data-panel'))
        return (Number(this.style.flexGrow || 0) / 100) * (1200 - 52);
      return 1200;
    },
  );
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(800);
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
    () => new DOMRect(0, 0, 1200, 800),
  );
});
afterEach(() => {
  observers.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

async function layout() {
  await act(async () => {
    for (const observer of observers) {
      observer.callback(
        [...observer.elements].map((target) => {
          const width = (target as HTMLElement).offsetWidth;
          return {
            target,
            borderBoxSize: [{ blockSize: 800, inlineSize: width }],
            contentBoxSize: [],
            devicePixelContentBoxSize: [],
            contentRect: new DOMRect(0, 0, width, 800),
          };
        }),
        { observe() {}, unobserve() {}, disconnect() {} },
      );
    }
  });
}

const DOCUMENT: BaseRecord = {
  id: 'fixture-document-launch-plan',
  ownerId: '11111111-1111-4111-8111-111111111111',
  name: 'Launch plan',
  description: 'Steps, owners, and dates for the spring launch.',
  icon: 'notebook',
  tags: ['work', 'planning'],
  createdAt: '2026-10-14T09:00:00Z',
  updatedAt: '2026-10-17T16:20:00Z',
  pinnedAt: null,
  lastViewedAt: null,
};

async function setup(overrides: Partial<BaseRecord> = {}) {
  const document = { ...DOCUMENT, ...overrides };
  const result = render(
    <TooltipProvider>
      <DocumentView document={document} />
    </TooltipProvider>,
  );
  await layout();
  return result;
}

/** The frame's scrolling body, named after the document. */
const body = (name = DOCUMENT.name) =>
  screen.getByRole('group', { name: `${name} contents` });

describe('DocumentView reading page', () => {
  it("names the page with the document's name as its only level-one heading", async () => {
    await setup();
    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]!.textContent).toBe('Launch plan');
  });

  it('shows the description when there is one and omits it when there is not', async () => {
    const { unmount } = await setup();
    expect(
      within(body()).getByText(
        'Steps, owners, and dates for the spring launch.',
      ),
    ).toBeTruthy();
    unmount();

    await setup({ description: undefined });
    expect(
      within(body()).queryByText(
        'Steps, owners, and dates for the spring launch.',
      ),
    ).toBeNull();
  });

  it('says the content cannot be shown yet', async () => {
    await setup();
    expect(
      within(body()).getByText(/This document’s content can’t be shown yet\./),
    ).toBeTruthy();
  });

  it("keeps the complete title in the heading's accessible name when the name is long", async () => {
    // Truncation is CSS only; the heading's text and name stay whole.
    const name = 'A'.repeat(100) + ' ' + 'B'.repeat(99);
    expect(name).toHaveLength(200);
    await setup({ name });
    const heading = screen.getByRole('heading', { level: 1, name });
    expect(heading.textContent).toBe(name);
    expect(body(name)).toBeTruthy();
  });

  it('offers no editing control', async () => {
    await setup();
    const group = body();
    expect(within(group).queryAllByRole('textbox')).toHaveLength(0);
    expect(within(group).queryAllByRole('button')).toHaveLength(0);
    expect(within(group).queryAllByRole('link')).toHaveLength(0);
    expect(group.querySelector('[contenteditable]')).toBeNull();
    expect(
      screen.queryByRole('button', { name: /edit|save|bold/i }),
    ).toBeNull();
  });
});

describe('DocumentView details', () => {
  /** The details list, found through the heading that names it. */
  const details = () => {
    const heading = screen.getByRole('heading', {
      level: 2,
      name: 'Document details',
    });
    const list = heading.nextElementSibling;
    expect(list?.tagName).toBe('DL');
    return list as HTMLElement;
  };
  /** The value beside a term in the details list. */
  const value = (term: string) => {
    const entry = within(details())
      .getAllByRole('term')
      .find((element) => element.textContent === term);
    return entry?.nextElementSibling as HTMLElement | undefined;
  };

  it('uses a description list named Document details', async () => {
    await setup();
    expect(details()).toBeTruthy();
    // The body adds no second level-one heading.
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('lists created and updated dates as time elements with machine-readable values', async () => {
    await setup();
    const updated = value('Updated')?.querySelector('time');
    const created = value('Created')?.querySelector('time');
    expect(updated?.getAttribute('dateTime')).toBe('2026-10-17T16:20:00Z');
    expect(created?.getAttribute('dateTime')).toBe('2026-10-14T09:00:00Z');
    expect(updated?.textContent).toMatch(/2026/);
    expect(created?.textContent).toMatch(/2026/);
  });

  it('omits Updated when the document was never edited', async () => {
    await setup({ updatedAt: DOCUMENT.createdAt });
    expect(value('Updated')).toBeUndefined();
    expect(value('Created')?.querySelector('time')).toBeTruthy();
  });

  it('lists each tag as a list item', async () => {
    await setup();
    const tags = within(value('Tags')!).getByRole('list', { name: 'Tags' });
    expect(
      within(tags)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['work', 'planning']);
  });

  it('omits the tags row when there are none', async () => {
    await setup({ tags: [] });
    expect(value('Tags')).toBeUndefined();
    expect(screen.queryByRole('list', { name: 'Tags' })).toBeNull();
  });

  it('hydrates the server-written dates without a mismatch', async () => {
    // The server writes dates in the account's zone; hydration must read the
    // same zone, whatever this browser's own is. 23:30 UTC is the next day in
    // Tokyo, so a zone mismatch would change the text.
    const regional = { ...regionalDefaults, timezone: 'Asia/Tokyo' };
    const ui = (
      <RegionalProvider regional={regional} deviceTimeZone={null}>
        <DocumentDetails
          createdAt="2026-10-14T23:30:00Z"
          updatedAt="2026-10-17T23:30:00Z"
          tags={['work']}
        />
      </RegionalProvider>
    );
    const html = renderToString(ui);
    expect(html).toContain('Oct 15, 2026');
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.append(container);
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    const recoverable = vi.fn();
    const root = await act(async () =>
      hydrateRoot(container, ui, { onRecoverableError: recoverable }),
    );
    expect(recoverable).not.toHaveBeenCalled();
    expect(errors).not.toHaveBeenCalled();
    act(() => root.unmount());
    container.remove();
  });
});

describe('DocumentView unavailable content', () => {
  const note = () => screen.getByRole('note', { name: 'Document content' });

  it('states the content is unavailable in a note region', async () => {
    await setup();
    expect(within(body()).getByRole('note')).toBe(note());
    expect(note().textContent).toMatch(/can’t be shown yet/);
  });

  it('does not say the document is empty', async () => {
    await setup({ description: undefined, tags: [] });
    expect(body().textContent).not.toMatch(/empty|no content/i);
  });

  it('has no button or link inside the note', async () => {
    await setup();
    expect(within(note()).queryAllByRole('button')).toHaveLength(0);
    expect(within(note()).queryAllByRole('link')).toHaveLength(0);
  });
});
