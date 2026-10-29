import { act, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { BaseRecord } from '@synapcity/domain-records';
import { TooltipProvider } from '@synapcity/frontend-ui/core/tooltip';
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
