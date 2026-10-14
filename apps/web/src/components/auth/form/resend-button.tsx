'use client';

import { Button } from '@synapcity/frontend-ui/core/button';

/**
 * The submit for a resend form. It stays focusable while it waits: a disabled
 * button would drop keyboard focus to the page, and an unreachable control
 * cannot say why it is waiting. `aria-disabled` plus a blocked click keeps both
 * the focus and the explanation (`hint`, read out with the button).
 */
export function ResendButton({
  label,
  pending,
  wait,
  hintId,
}: {
  label: string;
  pending: boolean;
  /** Seconds left before another email can be requested; 0 when free. */
  wait: number;
  hintId: string;
}) {
  const blocked = pending || wait > 0;

  return (
    <>
      <Button
        type="submit"
        variant="outline"
        size="lg"
        className="w-full"
        aria-disabled={blocked || undefined}
        aria-busy={pending || undefined}
        aria-describedby={wait > 0 ? hintId : undefined}
        onClick={(event) => {
          if (blocked) event.preventDefault();
        }}
      >
        {pending ? 'Sending…' : label}
      </Button>
      {wait > 0 ? (
        <p id={hintId} className="text-center text-xs text-muted-foreground">
          You can request another in {wait}s.
        </p>
      ) : null}
    </>
  );
}
