import { useEffect, useEffectEvent } from 'react';

/**
 * A key and the modifiers it needs. `mod` is Command on Apple keyboards and
 * Control elsewhere; either is accepted, so one shortcut works on both. A
 * modifier left out must not be held.
 */
export type KeyboardShortcut = {
  /** Compared with `KeyboardEvent.key`, ignoring case. */
  key: string;
  mod?: boolean;
  shift?: boolean;
  alt?: boolean;
};

export type KeyboardShortcutOptions = {
  enabled?: boolean;
  /** Run again for each repeat while the key is held. Off by default. */
  allowRepeat?: boolean;
  /** Run while a text field or editor has focus. Off by default, so typing keeps its own keys. */
  allowInEditable?: boolean;
};

/** Inputs that take typed text; the rest (checkbox, button, range…) do not. */
const NON_TEXT_INPUTS = new Set([
  'button',
  'checkbox',
  'color',
  'file',
  'image',
  'radio',
  'range',
  'reset',
  'submit',
]);

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  if (target instanceof HTMLInputElement)
    return !NON_TEXT_INPUTS.has(target.type);
  return (
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target.closest('[contenteditable]:not([contenteditable="false"])') !== null
  );
}

function matches(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  return (
    event.key.toLowerCase() === shortcut.key.toLowerCase() &&
    (event.metaKey || event.ctrlKey) === !!shortcut.mod &&
    event.shiftKey === !!shortcut.shift &&
    event.altKey === !!shortcut.alt
  );
}

/**
 * A window-level shortcut, for the shell and the app only. It runs last: a
 * control, the editor or an open overlay that handles the key first calls
 * `preventDefault`, and the shortcut then stands aside. It also stands aside
 * during IME composition, for a held key, while the page is hidden and, unless
 * asked, in text fields and editors. A shortcut it runs is marked handled,
 * unless the handler returns `false` to leave the key to someone else.
 */
export function useKeyboardShortcut(
  shortcut: KeyboardShortcut,
  handler: (event: KeyboardEvent) => void | false,
  {
    enabled = true,
    allowRepeat = false,
    allowInEditable = false,
  }: KeyboardShortcutOptions = {},
): void {
  const { key, mod, shift, alt } = shortcut;
  const onShortcut = useEffectEvent(handler);

  useEffect(() => {
    if (!enabled) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        // 229 is the key Safari reports for the keydown that ends a composition.
        event.isComposing ||
        event.keyCode === 229 ||
        (event.repeat && !allowRepeat) ||
        document.visibilityState === 'hidden' ||
        (!allowInEditable && isEditable(event.target)) ||
        !matches(event, { key, mod, shift, alt })
      )
        return;
      if (onShortcut(event) !== false) event.preventDefault();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, allowRepeat, allowInEditable, key, mod, shift, alt]);
}

function ariaKey(key: string): string {
  return key.length === 1 ? key.toUpperCase() : key;
}

/** The `aria-keyshortcuts` value for a shortcut, naming both platform modifiers for `mod`. */
export function ariaKeyShortcuts({
  key,
  mod,
  shift,
  alt,
}: KeyboardShortcut): string {
  const rest = [alt && 'Alt', shift && 'Shift', ariaKey(key)]
    .filter(Boolean)
    .join('+');
  return mod ? `Control+${rest} Meta+${rest}` : rest;
}
