'use client';

import { useEffect, useState } from 'react';

import type { AuthState } from '@/features/auth/shared/form-state';

/**
 * Seconds to wait before another email can be requested. A courtesy so the
 * button explains itself instead of failing with "Too many attempts"; the
 * server still enforces the real limit.
 */
const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Counts down from the moment a confirmation screen appears, and again after
 * each accepted resend. Returns the seconds left; 0 means the button is free.
 * The state result is the trigger: a new successful result restarts the clock.
 */
export function useCooldown(
  state: AuthState,
  /** False when no email was just sent, so the first request is free. */
  waitFirst = true,
  seconds = RESEND_COOLDOWN_SECONDS,
) {
  const [left, setLeft] = useState(waitFirst ? seconds : 0);
  const [seen, setSeen] = useState(state);

  // Restart on a new accepted result. Adjusting state while rendering is the
  // supported way to derive it from a changed value without an extra effect.
  if (seen !== state) {
    setSeen(state);
    if (state.success) setLeft(seconds);
  }

  useEffect(() => {
    if (left <= 0) return;
    const timer = setTimeout(() => setLeft((current) => current - 1), 1000);
    return () => clearTimeout(timer);
  }, [left]);

  return left;
}
