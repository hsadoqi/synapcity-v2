import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ariaKeyShortcuts,
  useKeyboardShortcut,
  type KeyboardShortcut,
} from './use-keyboard-shortcut';

const MOD_K: KeyboardShortcut = { key: 'k', mod: true };

function press(
  init: KeyboardEventInit,
  target: EventTarget = document.body,
): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    ...init,
  });
  target.dispatchEvent(event);
  return event;
}

function mount<T extends HTMLElement>(element: T): T {
  document.body.append(element);
  return element;
}

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe('useKeyboardShortcut', () => {
  it('runs on Control or Command and marks the event handled', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcut(MOD_K, handler));
    const ctrl = press({ key: 'k', ctrlKey: true });
    const meta = press({ key: 'K', metaKey: true });
    expect(handler).toHaveBeenCalledTimes(2);
    expect(ctrl.defaultPrevented).toBe(true);
    expect(meta.defaultPrevented).toBe(true);
  });

  it('needs the modifiers it names and no others', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcut(MOD_K, handler));
    press({ key: 'k' });
    press({ key: 'k', ctrlKey: true, shiftKey: true });
    press({ key: 'k', metaKey: true, altKey: true });
    press({ key: 'j', ctrlKey: true });
    expect(handler).not.toHaveBeenCalled();

    const escape = vi.fn();
    renderHook(() => useKeyboardShortcut({ key: 'Escape' }, escape));
    press({ key: 'Escape', ctrlKey: true });
    expect(escape).not.toHaveBeenCalled();
    press({ key: 'Escape' });
    expect(escape).toHaveBeenCalledTimes(1);
  });

  it('leaves an event a nearer handler already handled', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcut(MOD_K, handler));
    const control = mount(document.createElement('button'));
    control.addEventListener('keydown', (event) => event.preventDefault());
    press({ key: 'k', ctrlKey: true }, control);
    expect(handler).not.toHaveBeenCalled();
  });

  it('ignores keys that belong to an IME composition', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcut({ key: 'Escape' }, handler));
    press({ key: 'Escape', isComposing: true });
    // Safari reports the composition's last key as 229 without isComposing.
    press({ key: 'Escape', keyCode: 229 });
    expect(handler).not.toHaveBeenCalled();
  });

  it('ignores a held key unless the shortcut allows repeats', () => {
    const once = vi.fn();
    const repeating = vi.fn();
    renderHook(() => useKeyboardShortcut(MOD_K, once));
    renderHook(() =>
      useKeyboardShortcut({ key: 'b', mod: true }, repeating, {
        allowRepeat: true,
      }),
    );
    press({ key: 'k', ctrlKey: true, repeat: true });
    press({ key: 'b', ctrlKey: true, repeat: true });
    expect(once).not.toHaveBeenCalled();
    expect(repeating).toHaveBeenCalledTimes(1);
  });

  it('ignores keys while the document is hidden', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcut(MOD_K, handler));
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    press({ key: 'k', ctrlKey: true });
    expect(handler).not.toHaveBeenCalled();
  });

  it('leaves text fields and editors alone unless the shortcut opts in', () => {
    const handler = vi.fn();
    const inEditable = vi.fn();
    renderHook(() => useKeyboardShortcut({ key: 'b', mod: true }, handler));
    renderHook(() =>
      useKeyboardShortcut(MOD_K, inEditable, { allowInEditable: true }),
    );
    const input = mount(document.createElement('input'));
    const textarea = mount(document.createElement('textarea'));
    const editor = mount(document.createElement('div'));
    editor.setAttribute('contenteditable', 'true');
    const paragraph = editor.appendChild(document.createElement('p'));
    for (const target of [input, textarea, paragraph]) {
      const bold = press({ key: 'b', ctrlKey: true }, target);
      expect(bold.defaultPrevented).toBe(false);
      press({ key: 'k', ctrlKey: true }, target);
    }
    expect(handler).not.toHaveBeenCalled();
    expect(inEditable).toHaveBeenCalledTimes(3);

    const checkbox = mount(document.createElement('input'));
    checkbox.type = 'checkbox';
    press({ key: 'b', ctrlKey: true }, checkbox);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('leaves the event unhandled when the handler declines it', () => {
    renderHook(() => useKeyboardShortcut({ key: 'Escape' }, () => false));
    expect(press({ key: 'Escape' }).defaultPrevented).toBe(false);
  });

  it('does nothing while disabled', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcut(MOD_K, handler, { enabled: false }));
    const event = press({ key: 'k', ctrlKey: true });
    expect(handler).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it('calls the latest handler without listening again', () => {
    const add = vi.spyOn(window, 'addEventListener');
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(
      ({ handler }) => useKeyboardShortcut({ key: 'k', mod: true }, handler),
      { initialProps: { handler: first } },
    );
    rerender({ handler: second });
    press({ key: 'k', ctrlKey: true });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
    expect(add.mock.calls.filter(([type]) => type === 'keydown')).toHaveLength(
      1,
    );
  });

  it('stops listening when unmounted', () => {
    const remove = vi.spyOn(window, 'removeEventListener');
    const handler = vi.fn();
    const { unmount } = renderHook(() => useKeyboardShortcut(MOD_K, handler));
    unmount();
    press({ key: 'k', ctrlKey: true });
    expect(handler).not.toHaveBeenCalled();
    expect(remove.mock.calls.some(([type]) => type === 'keydown')).toBe(true);
  });
});

describe('ariaKeyShortcuts', () => {
  it('names both platform modifiers for a mod shortcut', () => {
    expect(ariaKeyShortcuts({ key: 'b', mod: true })).toBe('Control+B Meta+B');
    expect(ariaKeyShortcuts({ key: 'k', mod: true, shift: true })).toBe(
      'Control+Shift+K Meta+Shift+K',
    );
    expect(ariaKeyShortcuts({ key: 'Escape' })).toBe('Escape');
  });
});
