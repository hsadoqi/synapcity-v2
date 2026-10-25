import { z } from 'zod';

/** What a run decided about focused time: what to work on and how to pace it. */
export const focusPlanSchema = z.object({
  label: z.string(),
  sessionMin: z.number().int().min(1).max(180),
  breakMin: z.number().int().min(1).max(60),
  sessions: z.number().int().min(1).max(12),
});

export type FocusPlan = z.infer<typeof focusPlanSchema>;

export const DEFAULT_FOCUS_PLAN: FocusPlan = {
  label: '',
  sessionMin: 25,
  breakMin: 5,
  sessions: 1,
};

export type FocusPhase = {
  kind: 'focus' | 'break';
  minutes: number;
  session: number;
};

/** Focus, break, focus, break, ... ending on a focus block. */
export function phasesFor(plan: FocusPlan): FocusPhase[] {
  const phases: FocusPhase[] = [];
  for (let n = 1; n <= plan.sessions; n += 1) {
    phases.push({ kind: 'focus', minutes: plan.sessionMin, session: n });
    if (n < plan.sessions)
      phases.push({ kind: 'break', minutes: plan.breakMin, session: n });
  }
  return phases;
}
