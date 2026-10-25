import { describe, expect, it } from 'vitest';

import { BUILT_IN_RUNS, findBuiltInRun } from '@/lib/runs/catalog';
import type { PickStep, ScaleStep } from '@/lib/runs/schema';
import {
  addCustomOption,
  advance,
  canContinue,
  goTo,
  hasProgress,
  isRequired,
  newSession,
  setNote,
  setRating,
  skip,
  togglePick,
  totalSpentMs,
} from './model';

const morning = findBuiltInRun('morning')!;
const energyStep = morning.steps[0] as ScaleStep;
const gratitude = morning.steps[2] as PickStep;
const focus = morning.steps[4] as PickStep;

describe('required and optional steps', () => {
  it('blocks Continue on unanswered rating and pick steps', () => {
    const s = newSession(morning);
    expect(isRequired(energyStep)).toBe(true);
    expect(canContinue(energyStep, s)).toBe(false);
    expect(canContinue(energyStep, setRating(s, energyStep.id, 7))).toBe(true);
    expect(canContinue(gratitude, s)).toBe(false);
  });

  it('never blocks breathing steps', () => {
    const breathing = morning.steps[1]!;
    expect(isRequired(breathing)).toBe(false);
    expect(canContinue(breathing, newSession(morning))).toBe(true);
  });

  it('lets optional text steps pass empty', () => {
    const body = findBuiltInRun('body')!;
    const text = body.steps.find((s) => s.kind === 'text')!;
    expect(canContinue(text, newSession(body))).toBe(true);
  });

  it('requires the mind dump text', () => {
    const mind = findBuiltInRun('mind')!;
    const text = mind.steps.find((s) => s.kind === 'text')!;
    expect(canContinue(text, newSession(mind))).toBe(false);
  });
});

describe('picking', () => {
  it('pick one replaces the choice and toggles it off', () => {
    let s = newSession(morning);
    s = togglePick(s, focus, 'Learning');
    s = togglePick(s, focus, 'People');
    expect(s.answers[focus.id]).toEqual(['People']);
    s = togglePick(s, focus, 'People');
    expect(s.answers[focus.id]).toBeUndefined();
  });

  it('pick many stops at the limit until something is removed', () => {
    let s = newSession(morning);
    for (const o of [
      'People in my life',
      'My health',
      'A good meal',
      'A quiet moment',
    ]) {
      s = togglePick(s, gratitude, o);
    }
    expect(s.answers[gratitude.id]).toEqual([
      'People in my life',
      'My health',
      'A good meal',
    ]);
    s = togglePick(s, gratitude, 'My health');
    s = togglePick(s, gratitude, 'A quiet moment');
    expect(s.answers[gratitude.id]).toEqual([
      'People in my life',
      'A good meal',
      'A quiet moment',
    ]);
  });

  it('adds a custom option and selects it', () => {
    let s = addCustomOption(newSession(morning), focus, '  Sketching ');
    expect(s.custom[focus.id]).toEqual(['Sketching']);
    expect(s.answers[focus.id]).toEqual(['Sketching']);
    s = addCustomOption(s, focus, 'Sketching');
    expect(s.custom[focus.id]).toEqual(['Sketching']);
    expect(addCustomOption(s, focus, '   ')).toBe(s);
  });

  it('does not select a custom option when the list is full', () => {
    let s = newSession(morning);
    for (const o of gratitude.options.slice(0, 3))
      s = togglePick(s, gratitude, o);
    s = addCustomOption(s, gratitude, 'Extra');
    expect(s.custom[gratitude.id]).toEqual(['Extra']);
    expect(s.answers[gratitude.id]).toHaveLength(3);
  });
});

describe('moving through a run', () => {
  it('records time spent on a step when leaving it', () => {
    let s = { ...newSession(morning), elapsedMs: 12_000 };
    const result = advance(morning, s);
    s = result.session;
    expect(result.finished).toBe(false);
    expect(s.stepIndex).toBe(1);
    expect(s.elapsedMs).toBe(0);
    expect(totalSpentMs(s)).toBe(12_000);
  });

  it('finishes on the last step', () => {
    const last = {
      ...newSession(morning),
      stepIndex: morning.steps.length - 1,
    };
    expect(advance(morning, last).finished).toBe(true);
  });

  it('skipping clears the answer and marks the step skipped', () => {
    let s = setRating(newSession(morning), energyStep.id, 6);
    const result = skip(morning, s);
    s = result.session;
    expect(s.answers[energyStep.id]).toBeUndefined();
    expect(s.skipped).toContain(energyStep.id);
    expect(s.stepIndex).toBe(1);
  });

  it('answering a skipped step un-skips it', () => {
    let s = skip(morning, newSession(morning)).session;
    s = setRating(s, energyStep.id, 4);
    expect(s.skipped).not.toContain(energyStep.id);
  });

  it('goTo clamps to the run', () => {
    expect(goTo(morning, newSession(morning), 99).stepIndex).toBe(
      morning.steps.length - 1,
    );
  });

  it('knows when there is progress worth confirming', () => {
    const fresh = newSession(morning);
    expect(hasProgress(fresh)).toBe(false);
    expect(hasProgress(setRating(fresh, energyStep.id, 3))).toBe(true);
    expect(hasProgress(setNote(fresh, energyStep.id, 'slept badly'))).toBe(
      true,
    );
    expect(hasProgress({ ...fresh, stepIndex: 1 })).toBe(true);
  });
});

describe('catalog', () => {
  it('has unique step ids and valid pick limits', () => {
    const ids = new Set<string>();
    for (const run of BUILT_IN_RUNS) {
      for (const step of run.steps) {
        expect(ids.has(step.id)).toBe(false);
        ids.add(step.id);
        if (step.kind === 'pick') {
          expect(step.max).toBeLessThanOrEqual(step.options.length);
        }
      }
    }
  });
});
