import { act, fireEvent, render, screen } from '@testing-library/react';
import { FileText, Info } from 'lucide-react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from '@synapcity/frontend-ui/core/tooltip';
import {
  ContextualPanelShell,
  useContextualPanel,
  type ContextualPanelDestination,
} from '.';

// Supply browser measurements, not a mocked panel implementation: the real
// library lays out against these widths, and each flush plays the part of
// ResizeObserver reporting them after React updates flex.
let containerWidth = 1200;
const observers = new Set<{
  callback: ResizeObserverCallback;
  elements: Set<Element>;
}>();
beforeEach(() => {
  containerWidth = 1200;
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
        return (Number(this.style.flexGrow || 0) / 100) * (containerWidth - 52);
      return containerWidth;
    },
  );
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(800);
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

const DESTINATIONS: ContextualPanelDestination[] = [
  {
    id: 'notes',
    label: 'Notes',
    icon: FileText,
    content: <input aria-label="Draft" />,
  },
  {
    id: 'info',
    label: 'Info',
    icon: Info,
    content: <p>About this</p>,
  },
];

function OpenInfo() {
  const panel = useContextualPanel();
  return <button onClick={() => panel?.open('info')}>Show info</button>;
}

async function setup(destinations = DESTINATIONS) {
  const view = render(
    <TooltipProvider>
      <ContextualPanelShell destinations={destinations}>
        <button>Page action</button>
        <OpenInfo />
      </ContextualPanelShell>
    </TooltipProvider>,
  );
  await layout();
  return view;
}

const rail = () => screen.getByRole('toolbar', { name: 'Contextual panel' });
const railButton = (name: string) => screen.getByRole('button', { name });
const region = () =>
  document.querySelector<HTMLElement>('[data-contextual-panel-region]')!;

async function choose(name: string) {
  fireEvent.click(railButton(name));
  await layout();
}

describe('ContextualPanelShell', () => {
  it('renders only its children when there are no destinations', async () => {
    await setup([]);
    expect(screen.getByRole('button', { name: 'Page action' })).toBeTruthy();
    expect(screen.queryByRole('toolbar')).toBeNull();
  });

  it('starts collapsed to its rail, with nothing loaded yet', async () => {
    await setup();
    expect(rail()).toBeTruthy();
    expect(railButton('Notes').getAttribute('aria-pressed')).toBe('false');
    expect(region().hasAttribute('inert')).toBe(true);
    expect(region().getAttribute('aria-hidden')).toBe('true');
    expect(screen.queryByRole('textbox', { name: 'Draft' })).toBeNull();
  });

  it('expands on a destination, names it and moves focus into the panel', async () => {
    await setup();
    await choose('Notes');
    expect(railButton('Notes').getAttribute('aria-pressed')).toBe('true');
    expect(region().hasAttribute('inert')).toBe(false);
    expect(region().getAttribute('aria-label')).toBe('Contextual panel: Notes');
    expect(screen.getByRole('heading', { name: 'Notes' })).toBeTruthy();
    expect(document.activeElement).toBe(region());
    expect(
      document.getElementById(
        railButton('Notes').getAttribute('aria-controls')!,
      ),
    ).not.toBeNull();
  });

  it('collapses when the shown destination is chosen again, returning focus to the rail', async () => {
    await setup();
    await choose('Notes');
    screen.getByRole('textbox', { name: 'Draft' }).focus();
    await choose('Notes');
    expect(railButton('Notes').getAttribute('aria-pressed')).toBe('false');
    expect(region().hasAttribute('inert')).toBe(true);
    expect(document.activeElement).toBe(railButton('Notes'));
  });

  it('collapses from its own button, returning focus to the rail', async () => {
    await setup();
    await choose('Info');
    const collapse = screen.getByRole('button', {
      name: 'Collapse contextual panel',
    });
    collapse.focus();
    fireEvent.click(collapse);
    await layout();
    expect(region().hasAttribute('inert')).toBe(true);
    expect(document.activeElement).toBe(railButton('Info'));
  });

  it('keeps each visited destination’s state across switching and collapsing', async () => {
    await setup();
    await choose('Notes');
    fireEvent.change(screen.getByRole('textbox', { name: 'Draft' }), {
      target: { value: 'Unfinished thought' },
    });
    await choose('Info');
    expect(screen.getByText('About this')).toBeTruthy();
    await choose('Info');
    await choose('Notes');
    expect(
      (screen.getByRole('textbox', { name: 'Draft' }) as HTMLInputElement)
        .value,
    ).toBe('Unfinished thought');
  });

  it('makes the rail one tab stop that arrow keys move through', async () => {
    await setup();
    const notes = railButton('Notes');
    const info = railButton('Info');
    expect(notes.tabIndex).toBe(0);
    expect(info.tabIndex).toBe(-1);
    notes.focus();
    fireEvent.keyDown(notes, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(info);
    expect(info.tabIndex).toBe(0);
    expect(notes.tabIndex).toBe(-1);
    fireEvent.keyDown(info, { key: 'Home' });
    expect(document.activeElement).toBe(notes);
  });

  it('lets content open a destination through useContextualPanel', async () => {
    await setup();
    fireEvent.click(screen.getByRole('button', { name: 'Show info' }));
    await layout();
    expect(railButton('Info').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('About this')).toBeTruthy();
  });

  it('gives no controls outside a panel', () => {
    render(<OpenInfo />);
    fireEvent.click(screen.getByRole('button', { name: 'Show info' }));
    expect(screen.queryByRole('toolbar')).toBeNull();
  });

  it('in a container too narrow for both regions, takes the work area and makes the page inert', async () => {
    containerWidth = 400;
    await setup();
    const shell = document.querySelector(
      '[data-slot="contextual-panel-shell"]',
    );
    expect(shell?.hasAttribute('data-narrow')).toBe(true);
    const main = document.querySelector('[data-slot="contextual-main"]')!;
    expect(main.hasAttribute('inert')).toBe(false);
    await choose('Notes');
    expect(main.hasAttribute('inert')).toBe(true);
    await choose('Notes');
    expect(main.hasAttribute('inert')).toBe(false);
  });

  it('knows a container is narrow from its first render, so an early choice is not lost', async () => {
    containerWidth = 400;
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      () => new DOMRect(0, 0, containerWidth, 800),
    );
    render(
      <TooltipProvider>
        <ContextualPanelShell destinations={DESTINATIONS}>
          <button>Page action</button>
        </ContextualPanelShell>
      </TooltipProvider>,
    );
    // Chosen before ResizeObserver has reported any size.
    fireEvent.click(railButton('Notes'));
    await layout();
    const main = document.querySelector('[data-slot="contextual-main"]')!;
    expect(main.hasAttribute('inert')).toBe(true);
    expect(region().hasAttribute('inert')).toBe(false);
  });
});
