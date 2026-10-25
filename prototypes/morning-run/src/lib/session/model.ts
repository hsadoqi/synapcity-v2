import { z } from 'zod';

import type { PickStep, Run, Step } from '@/lib/runs/schema';

const answerSchema = z.union([z.number(), z.array(z.string()), z.string()]);

/** The single run in progress. Persisted after every change so a refresh resumes it. */
export const sessionSchema = z.object({
  runId: z.string(),
  startedAt: z.string(),
  stepIndex: z.number().int().min(0),
  answers: z.record(z.string(), answerSchema),
  notes: z.record(z.string(), z.string()),
  /** Options the person typed in themselves, per step. */
  custom: z.record(z.string(), z.array(z.string())),
  skipped: z.array(z.string()),
  /** Time already counted on the current step. */
  elapsedMs: z.number().min(0),
  /** Time spent on steps already left, by step id. */
  spentMs: z.record(z.string(), z.number().min(0)),
});

export type RunSession = z.infer<typeof sessionSchema>;

export function newSession(
  run: Pick<Run, 'id'>,
  now: Date = new Date(),
): RunSession {
  return {
    runId: run.id,
    startedAt: now.toISOString(),
    stepIndex: 0,
    answers: {},
    notes: {},
    custom: {},
    skipped: [],
    elapsedMs: 0,
    spentMs: {},
  };
}

function isAnswered(step: Step, session: RunSession): boolean {
  const answer = session.answers[step.id];
  switch (step.kind) {
    case 'scale':
      return typeof answer === 'number';
    case 'pick':
      return Array.isArray(answer) && answer.length > 0;
    case 'text':
      return typeof answer === 'string' && answer.trim().length > 0;
    case 'breathe':
      return true;
  }
}

/** Whether Continue is enabled. Optional and breathing steps never block. */
export function canContinue(step: Step, session: RunSession): boolean {
  return (
    step.optional === true ||
    step.kind === 'breathe' ||
    isAnswered(step, session)
  );
}

export function isRequired(step: Step): boolean {
  return step.kind !== 'breathe' && step.optional !== true;
}

/** True once there is anything worth confirming before the person leaves. */
export function hasProgress(session: RunSession): boolean {
  return (
    session.stepIndex > 0 ||
    Object.keys(session.answers).length > 0 ||
    Object.values(session.notes).some((n) => n.trim().length > 0)
  );
}

export function answeredCount(run: Run, session: RunSession): number {
  return run.steps.filter(
    (step) =>
      step.kind !== 'breathe' &&
      isAnswered(step, session) &&
      !session.skipped.includes(step.id),
  ).length;
}

export function setRating(
  session: RunSession,
  stepId: string,
  rating: number,
): RunSession {
  return {
    ...session,
    answers: { ...session.answers, [stepId]: rating },
    skipped: session.skipped.filter((id) => id !== stepId),
  };
}

export function setText(
  session: RunSession,
  stepId: string,
  text: string,
): RunSession {
  const answers = { ...session.answers };
  if (text.trim().length === 0) delete answers[stepId];
  else answers[stepId] = text;
  return {
    ...session,
    answers,
    skipped: session.skipped.filter((id) => id !== stepId),
  };
}

export function setNote(
  session: RunSession,
  stepId: string,
  note: string,
): RunSession {
  const notes = { ...session.notes };
  if (note.trim().length === 0) delete notes[stepId];
  else notes[stepId] = note;
  return { ...session, notes };
}

export function optionsFor(step: PickStep, session: RunSession): string[] {
  return step.options.concat(session.custom[step.id] ?? []);
}

function setPicks(
  session: RunSession,
  step: PickStep,
  picks: string[],
): RunSession {
  const answers = omit(session.answers, step.id);
  if (picks.length === 0) return { ...session, answers };
  return {
    ...session,
    answers: { ...answers, [step.id]: picks },
    skipped: session.skipped.filter((id) => id !== step.id),
  };
}

/**
 * Pick one replaces the choice. Pick many toggles, up to `max`; a full list ignores new picks
 * until something is removed.
 */
export function togglePick(
  session: RunSession,
  step: PickStep,
  label: string,
): RunSession {
  const current = session.answers[step.id];
  const picked = Array.isArray(current) ? current : [];
  if (step.max === 1)
    return setPicks(session, step, picked[0] === label ? [] : [label]);
  if (picked.includes(label))
    return setPicks(
      session,
      step,
      picked.filter((x) => x !== label),
    );
  return picked.length < step.max
    ? setPicks(session, step, [...picked, label])
    : session;
}

/** Adds an option the person typed and selects it when there is room. */
export function addCustomOption(
  session: RunSession,
  step: PickStep,
  raw: string,
): RunSession {
  const label = raw.trim().slice(0, 60);
  if (!label) return session;
  const withOption = optionsFor(step, session).includes(label)
    ? session
    : {
        ...session,
        custom: {
          ...session.custom,
          [step.id]: [...(session.custom[step.id] ?? []), label],
        },
      };
  const current = withOption.answers[step.id];
  const picked = Array.isArray(current) ? current : [];
  if (picked.includes(label)) return withOption;
  if (step.max === 1) return setPicks(withOption, step, [label]);
  return picked.length < step.max
    ? setPicks(withOption, step, [...picked, label])
    : withOption;
}

function omit<T extends Record<string, unknown>>(obj: T, key: string): T {
  const copy = { ...obj };
  delete copy[key];
  return copy;
}

function leaveStep(session: RunSession, step: Step): RunSession {
  return {
    ...session,
    spentMs: {
      ...session.spentMs,
      [step.id]: (session.spentMs[step.id] ?? 0) + session.elapsedMs,
    },
    elapsedMs: 0,
  };
}

export type Advance = { session: RunSession; finished: boolean };

export function advance(run: Run, session: RunSession): Advance {
  const step = run.steps[session.stepIndex];
  if (!step) return { session, finished: true };
  const left = leaveStep(session, step);
  if (session.stepIndex >= run.steps.length - 1)
    return { session: left, finished: true };
  return {
    session: { ...left, stepIndex: session.stepIndex + 1 },
    finished: false,
  };
}

export function skip(run: Run, session: RunSession): Advance {
  const step = run.steps[session.stepIndex];
  if (!step) return { session, finished: true };
  const answers = omit(session.answers, step.id);
  const skipped = session.skipped.includes(step.id)
    ? session.skipped
    : [...session.skipped, step.id];
  return advance(run, { ...session, answers, skipped });
}

export function goTo(run: Run, session: RunSession, index: number): RunSession {
  const step = run.steps[session.stepIndex];
  const target = Math.min(Math.max(0, index), run.steps.length - 1);
  if (!step || target === session.stepIndex) return session;
  return { ...leaveStep(session, step), stepIndex: target };
}

export function totalSpentMs(session: RunSession): number {
  return (
    Object.values(session.spentMs).reduce((a, b) => a + b, 0) +
    session.elapsedMs
  );
}
