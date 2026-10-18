import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  GlobalPanelShell,
  GlobalPanelToggle,
} from '@synapcity/frontend-ui/blocks/root-shell/global-panel';

// Supply browser measurements, not a mocked panel implementation. Each flush
// emulates ResizeObserver delivering the dimensions after React updates flex.
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
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(
    function (this: HTMLElement) {
      if (this.hasAttribute('data-separator')) return 4;
      if (this.hasAttribute('data-panel'))
        return (Number(this.style.flexGrow || 0) / 100) * 796;
      return 800;
    },
  );
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(1000);
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
        [...observer.elements].map((target) => ({
          target,
          borderBoxSize: [
            {
              blockSize: (target as HTMLElement).offsetHeight,
              inlineSize: 1000,
            },
          ],
          contentBoxSize: [],
          devicePixelContentBoxSize: [],
          contentRect: new DOMRect(
            0,
            0,
            1000,
            (target as HTMLElement).offsetHeight,
          ),
        })),
        { observe() {}, unobserve() {}, disconnect() {} },
      );
    }
  });
}

async function setup(panel?: React.ReactNode) {
  const view = render(
    <GlobalPanelShell header={<GlobalPanelToggle />} panel={panel}>
      <button>Page action</button>
    </GlobalPanelShell>,
  );
  await layout();
  return view;
}
async function openPanel() {
  fireEvent.click(screen.getByRole('button', { name: 'Toggle global panel' }));
  await layout();
  return screen.getByRole('region', { name: 'Global panel' });
}

describe('GlobalPanelShell', () => {
  it('omits the action outside its provider', () => {
    render(<GlobalPanelToggle />);
    expect(screen.queryByRole('button')).toBeNull();
  });
  it('starts collapsed with an associated trigger and inert mounted contents', async () => {
    await setup(<input aria-label="Draft" defaultValue="Keep me" />);
    const toggle = screen.getByRole('button', { name: 'Toggle global panel' });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(
      document.getElementById(toggle.getAttribute('aria-controls')!),
    ).not.toBeNull();
    expect(screen.queryByRole('region', { name: 'Global panel' })).toBeNull();
    expect(
      document.querySelector('[data-root-global-panel]')?.hasAttribute('inert'),
    ).toBe(true);
    expect(document.querySelector('input')?.value).toBe('Keep me');
  });
  it('opens, explicitly closes, restores focus and preserves its content', async () => {
    await setup(<input aria-label="Draft" />);
    await openPanel();
    const input = screen.getByRole('textbox', { name: 'Draft' });
    fireEvent.change(input, { target: { value: 'Unfinished work' } });
    const close = screen.getByRole('button', { name: 'Close global panel' });
    close.focus();
    fireEvent.click(close);
    await layout();
    expect(screen.getByRole('button', { name: 'Toggle global panel' })).toBe(
      document.activeElement,
    );
    expect(screen.queryByRole('region', { name: 'Global panel' })).toBeNull();
    await openPanel();
    expect(
      (screen.getByRole('textbox', { name: 'Draft' }) as HTMLInputElement)
        .value,
    ).toBe('Unfinished work');
  });
  it('dismisses on an outside primary press and Escape, but ignores presses inside', async () => {
    await setup();
    const region = await openPanel();
    fireEvent.pointerDown(region, { button: 0 });
    expect(screen.getByRole('region', { name: 'Global panel' })).toBeTruthy();
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Page action' }), {
      button: 0,
    });
    await layout();
    expect(screen.queryByRole('region', { name: 'Global panel' })).toBeNull();
    await openPanel();
    fireEvent.keyDown(document, { key: 'Escape' });
    await layout();
    expect(screen.queryByRole('region', { name: 'Global panel' })).toBeNull();
  });
  it('keeps a locked panel open for outside/Escape, allows explicit close, and releases the lock', async () => {
    await setup();
    await openPanel();
    fireEvent.click(
      screen.getByRole('button', { name: 'Lock global panel open' }),
    );
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Page action' }), {
      button: 0,
    });
    fireEvent.keyDown(document, { key: 'Escape' });
    await layout();
    expect(
      screen
        .getByRole('button', { name: 'Unlock global panel' })
        .getAttribute('aria-pressed'),
    ).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Close global panel' }));
    await layout();
    await openPanel();
    expect(
      screen
        .getByRole('button', { name: 'Lock global panel open' })
        .getAttribute('aria-pressed'),
    ).toBe('false');
  });
  it('gives portaled layers the first Escape and ignores their pointer presses', async () => {
    const view = await setup();
    await openPanel();
    const layer = document.createElement('div');
    layer.setAttribute('role', 'dialog');
    document.body.append(layer);
    try {
      fireEvent.pointerDown(layer, { button: 0 });
      fireEvent.keyDown(layer, { key: 'Escape' });
      await layout();
      expect(screen.getByRole('region', { name: 'Global panel' })).toBeTruthy();
      layer.remove();
      fireEvent.keyDown(document, { key: 'Escape' });
      await layout();
      expect(screen.queryByRole('region', { name: 'Global panel' })).toBeNull();
      view.unmount();
    } finally {
      layer.remove();
    }
  });

  it('hides the app header only while locked and provides an explicit reveal override', async () => {
    await setup();
    const header = document.querySelector<HTMLElement>(
      '[data-slot="shell-app-header"]',
    )!;
    expect(header.hidden).toBe(false);
    await openPanel();
    expect(header.hidden).toBe(false);
    expect(
      screen.queryByRole('button', { name: 'Show app header' }),
    ).toBeNull();
    fireEvent.click(
      screen.getByRole('button', { name: 'Lock global panel open' }),
    );
    expect(header.hidden).toBe(true);
    expect(header.hasAttribute('inert')).toBe(true);
    expect(
      screen.queryByRole('button', { name: 'Toggle global panel' }),
    ).toBeNull();
    const reveal = screen.getByRole('button', { name: 'Show app header' });
    expect(reveal.getAttribute('aria-controls')).toBe(header.id);
    expect(reveal.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(reveal);
    expect(header.hidden).toBe(false);
    expect(header.hasAttribute('inert')).toBe(false);
    expect(
      screen
        .getByRole('button', { name: 'Hide app header' })
        .getAttribute('aria-expanded'),
    ).toBe('true');
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Page action' }), {
      button: 0,
    });
    fireEvent.keyDown(document, { key: 'Escape' });
    await layout();
    expect(header.hidden).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Hide app header' }));
    expect(header.hidden).toBe(true);
    fireEvent.click(
      screen.getByRole('button', { name: 'Unlock global panel' }),
    );
    expect(header.hidden).toBe(false);
    expect(
      screen.queryByRole('button', { name: 'Hide app header' }),
    ).toBeNull();
  });

  it('recovers focus when hiding the header, then restores its visible trigger on close', async () => {
    await setup();
    await openPanel();
    const trigger = screen.getByRole('button', { name: 'Toggle global panel' });
    trigger.focus();
    fireEvent.click(
      screen.getByRole('button', { name: 'Lock global panel open' }),
    );
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Unlock global panel' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Show app header' }));
    trigger.focus();
    fireEvent.click(screen.getByRole('button', { name: 'Hide app header' }));
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Show app header' }),
    );
    const close = screen.getByRole('button', { name: 'Close global panel' });
    close.focus();
    fireEvent.click(close);
    await layout();
    expect(
      document.querySelector<HTMLElement>('[data-slot="shell-app-header"]')!
        .hidden,
    ).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it('starts a fresh hidden-header session on every lock and resets visibility on collapse', async () => {
    await setup();
    await openPanel();
    fireEvent.click(
      screen.getByRole('button', { name: 'Lock global panel open' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Show app header' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Unlock global panel' }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Lock global panel open' }),
    );
    expect(
      screen.getByRole('button', { name: 'Show app header' }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Close global panel' }));
    await layout();
    expect(
      screen.getByRole('button', { name: 'Toggle global panel' }),
    ).toBeTruthy();
    await openPanel();
    expect(
      screen.queryByRole('button', { name: 'Show app header' }),
    ).toBeNull();
    expect(
      screen
        .getByRole('button', { name: 'Lock global panel open' })
        .getAttribute('aria-pressed'),
    ).toBe('false');
  });
});
