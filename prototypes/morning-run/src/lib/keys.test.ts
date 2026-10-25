import { describe, expect, it } from 'vitest';

import { classifyTarget, interpretKey, type KeyContext } from './keys';

const key = (
  k: string,
  extra: Partial<
    Record<'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey', boolean>
  > = {},
) => ({
  key: k,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  shiftKey: false,
  ...extra,
});
const ctx = (over: Partial<KeyContext> = {}): KeyContext => ({
  kind: 'scale',
  target: 'body',
  dialogOpen: false,
  ...over,
});

describe('interpretKey', () => {
  it('rates with 1 to 9 and 0 for ten, only on rating steps', () => {
    expect(interpretKey(key('7'), ctx())).toEqual({ type: 'rate', value: 7 });
    expect(interpretKey(key('0'), ctx())).toEqual({ type: 'rate', value: 10 });
    expect(interpretKey(key('7'), ctx({ kind: 'pick' }))).toBeNull();
  });

  it('does not rate while typing', () => {
    expect(interpretKey(key('7'), ctx({ target: 'text' }))).toBeNull();
  });

  it('continues with Enter from the page or a choice, but not from a button or a field', () => {
    expect(interpretKey(key('Enter'), ctx())).toEqual({ type: 'continue' });
    expect(interpretKey(key('Enter'), ctx({ target: 'choice' }))).toEqual({
      type: 'continue',
    });
    expect(interpretKey(key('Enter'), ctx({ target: 'button' }))).toBeNull();
    expect(interpretKey(key('Enter'), ctx({ target: 'text' }))).toBeNull();
  });

  it('continues with Ctrl or Cmd Enter even from a text field', () => {
    expect(
      interpretKey(key('Enter', { ctrlKey: true }), ctx({ target: 'text' })),
    ).toEqual({ type: 'continue' });
    expect(
      interpretKey(key('Enter', { metaKey: true }), ctx({ target: 'text' })),
    ).toEqual({ type: 'continue' });
  });

  it('exits with Escape from anywhere, unless a dialog is open', () => {
    expect(interpretKey(key('Escape'), ctx({ target: 'text' }))).toEqual({
      type: 'exit',
    });
    expect(interpretKey(key('Escape'), ctx({ dialogOpen: true }))).toBeNull();
  });

  it('pauses, goes back and skips with single letters outside text fields', () => {
    expect(interpretKey(key('p'), ctx())).toEqual({ type: 'togglePause' });
    expect(interpretKey(key('B'), ctx())).toEqual({ type: 'back' });
    expect(interpretKey(key('s'), ctx())).toEqual({ type: 'skip' });
    expect(interpretKey(key('p'), ctx({ target: 'text' }))).toBeNull();
  });

  it('leaves browser shortcuts alone', () => {
    expect(interpretKey(key('p', { ctrlKey: true }), ctx())).toBeNull();
    expect(interpretKey(key('5', { altKey: true }), ctx())).toBeNull();
  });

  it('sends arrows to the options when nothing is focused', () => {
    expect(interpretKey(key('ArrowDown'), ctx({ kind: 'pick' }))).toEqual({
      type: 'focusOptions',
    });
    expect(
      interpretKey(key('ArrowDown'), ctx({ kind: 'pick', target: 'choice' })),
    ).toBeNull();
  });
});

describe('classifyTarget', () => {
  it('recognises fields, choices, buttons and the page', () => {
    document.body.innerHTML = `
      <input id="i"/><div id="c" contenteditable="true"><span id="cs"></span></div>
      <button role="radio" id="r"></button><button id="b"><span id="bs"></span></button>`;
    const el = (id: string) => document.getElementById(id);
    expect(classifyTarget(el('i'))).toBe('text');
    expect(classifyTarget(el('cs'))).toBe('text');
    expect(classifyTarget(el('r'))).toBe('choice');
    expect(classifyTarget(el('bs'))).toBe('button');
    expect(classifyTarget(document.body)).toBe('body');
    expect(classifyTarget(null)).toBe('body');
  });
});
