import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { focusPalette, focusWidget, PALETTE_FOCUS_TIMEOUT_MS } from './index';

function mount(html: string) {
  const root = document.createElement('div');
  root.innerHTML = html;
  document.body.append(root);
  return root;
}

const PALETTE =
  '<div data-slot="widget-palette"><button id="a">A</button><button id="b">B</button></div>';

describe('focusPalette', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    document.body.replaceChildren();
  });

  it('focuses the first palette button on the next frame', () => {
    mount(PALETTE);
    focusPalette();
    vi.advanceTimersByTime(20);
    expect(document.activeElement?.id).toBe('a');
  });

  it('waits while the palette is inert, then focuses it once it opens', () => {
    const root = mount(`<section inert>${PALETTE}</section>`);
    focusPalette();
    vi.advanceTimersByTime(120);
    expect(document.activeElement).toBe(document.body);
    root.querySelector('section')!.removeAttribute('inert');
    vi.advanceTimersByTime(40);
    expect(document.activeElement?.id).toBe('a');
  });

  it('never focuses hidden content and gives up after its time limit', () => {
    const root = mount(`<div hidden>${PALETTE}</div>`);
    focusPalette();
    vi.advanceTimersByTime(PALETTE_FOCUS_TIMEOUT_MS + 100);
    root.querySelector('div')!.removeAttribute('hidden');
    vi.advanceTimersByTime(100);
    // The handoff had ended: a panel opened later is not focused behind the person's back.
    expect(document.activeElement).toBe(document.body);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('stops when cancelled', () => {
    const root = mount(`<section inert>${PALETTE}</section>`);
    const cancel = focusPalette();
    cancel();
    root.querySelector('section')!.removeAttribute('inert');
    vi.advanceTimersByTime(100);
    expect(document.activeElement).toBe(document.body);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('stops when the person presses a key or a pointer first', () => {
    for (const type of ['keydown', 'pointerdown']) {
      const root = mount(`<section inert>${PALETTE}</section>`);
      focusPalette();
      document.dispatchEvent(new Event(type));
      root.querySelector('section')!.removeAttribute('inert');
      vi.advanceTimersByTime(100);
      expect(document.activeElement).toBe(document.body);
      root.remove();
    }
  });

  it('is replaced by a newer handoff, so only one is ever pending', () => {
    const first = mount(`<section inert>${PALETTE}</section>`);
    const spy = vi.spyOn(document, 'removeEventListener');
    focusPalette();
    focusPalette();
    // Starting the second ended the first, which released its listeners.
    expect(spy).toHaveBeenCalledWith('keydown', expect.any(Function), true);
    first.remove();
    expect(vi.getTimerCount()).toBe(1);
  });

  it('leaves no listeners behind after success', () => {
    mount(PALETTE);
    const remove = vi.spyOn(document, 'removeEventListener');
    focusPalette();
    vi.advanceTimersByTime(20);
    expect(remove).toHaveBeenCalledWith('keydown', expect.any(Function), true);
    expect(remove).toHaveBeenCalledWith(
      'pointerdown',
      expect.any(Function),
      true,
    );
  });
});

describe('focusWidget', () => {
  afterEach(() => document.body.replaceChildren());

  it('focuses a widget cell and says so', () => {
    mount('<div data-widget-id="w1" tabindex="0"></div>');
    expect(focusWidget('w1')).toBe(true);
    expect(document.activeElement).toHaveProperty('dataset.widgetId', 'w1');
  });

  it('reports false for a missing cell', () => {
    expect(focusWidget('nope')).toBe(false);
  });

  it('reports false and leaves focus alone for a cell behind an inert region', () => {
    mount(
      '<button id="keep">Keep</button><main inert><div data-widget-id="w1" tabindex="0"></div></main>',
    );
    document.getElementById('keep')!.focus();
    expect(focusWidget('w1')).toBe(false);
    expect(document.activeElement?.id).toBe('keep');
  });
});
