import type { StepKind } from '@/lib/runs/schema';

export type KeyTarget = 'text' | 'choice' | 'button' | 'body';

export type KeyAction =
  | { type: 'rate'; value: number }
  | { type: 'continue' }
  | { type: 'exit' }
  | { type: 'togglePause' }
  | { type: 'back' }
  | { type: 'skip' }
  | { type: 'focusOptions' };

export type KeyLike = {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
};

export type KeyContext = {
  kind: StepKind;
  target: KeyTarget;
  dialogOpen: boolean;
};

/** What kind of element has focus decides which keys are ours and which belong to it. */
export function classifyTarget(el: Element | null): KeyTarget {
  if (!el || el === document.body || el === document.documentElement)
    return 'body';
  if (
    el.closest(
      'input, textarea, select, [contenteditable=""], [contenteditable="true"]',
    )
  )
    return 'text';
  if (el.closest('[role="radio"], [role="checkbox"]')) return 'choice';
  if (el.closest('button, a, summary, [role="button"]')) return 'button';
  return 'body';
}

/**
 * The run's keyboard map as a pure function, so it can be tested without a browser.
 *
 * 1 to 9 and 0 rate; Enter continues; Escape leaves; P pauses; B goes back; S skips.
 * Anything that would clash with typing or with the focused control is left alone:
 * Enter still presses a focused button, and letters still type into a text field.
 */
export function interpretKey(
  event: KeyLike,
  ctx: KeyContext,
): KeyAction | null {
  if (ctx.dialogOpen) return null;
  const mod = event.ctrlKey || event.metaKey;

  if (event.key === 'Escape') return { type: 'exit' };
  if (event.key === 'Enter' && mod) return { type: 'continue' };
  if (event.altKey || mod) return null;

  if (event.key === 'Enter' && !event.shiftKey) {
    return ctx.target === 'body' || ctx.target === 'choice'
      ? { type: 'continue' }
      : null;
  }

  if (ctx.target === 'text') return null;

  if (ctx.kind === 'scale' && /^[0-9]$/.test(event.key)) {
    return { type: 'rate', value: event.key === '0' ? 10 : Number(event.key) };
  }
  if (
    ctx.kind === 'pick' &&
    ctx.target === 'body' &&
    (event.key === 'ArrowDown' || event.key === 'ArrowUp')
  ) {
    return { type: 'focusOptions' };
  }

  switch (event.key.toLowerCase()) {
    case 'p':
      return { type: 'togglePause' };
    case 'b':
      return { type: 'back' };
    case 's':
      return { type: 'skip' };
    default:
      return null;
  }
}
