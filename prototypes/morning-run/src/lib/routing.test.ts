import { describe, expect, it } from 'vitest';

import { findBuiltInRun } from '@/lib/runs/catalog';
import type { PickStep } from '@/lib/runs/schema';
import { buildIntention, intentionMarkdown, intentionText } from './intention';
import { routeAnswers } from './routing';
import {
  newSession,
  setNote,
  setRating,
  togglePick,
  setText,
  type RunSession,
} from './session/model';

function answerMorning(): RunSession {
  const run = findBuiltInRun('morning')!;
  let s = newSession(run);
  s = setRating(s, run.steps[0]!.id, 8);
  s = togglePick(s, run.steps[2] as PickStep, 'My health');
  s = togglePick(s, run.steps[3] as PickStep, 'Finish the draft');
  s = togglePick(s, run.steps[3] as PickStep, 'Move my body');
  s = togglePick(s, run.steps[4] as PickStep, 'Making things');
  return setNote(s, run.steps[3]!.id, 'Draft is due at noon');
}

describe('routeAnswers', () => {
  const run = findBuiltInRun('morning')!;
  const cards = routeAnswers(run, answerMorning());
  const byDest = Object.fromEntries(cards.map((c) => [c.dest, c]));

  it('creates one card per destination', () => {
    expect(cards.map((c) => c.dest)).toEqual([
      'Journal',
      'Tasks',
      'Focus',
      'Schedule',
    ]);
  });

  it('paces the day from the energy rating', () => {
    expect(byDest.Schedule?.headline).toBe(
      '9:00 AM to 11:00 AM: Making things',
    );
    expect(byDest.Schedule?.detail).toContain('energy is high');
    expect(byDest.Focus?.detail).toContain('50 minutes');
  });

  it('carries notes and counts tasks', () => {
    expect(byDest.Tasks?.headline).toBe('2 tasks added');
    expect(byDest.Tasks?.note).toBe('Draft is due at noon');
    expect(byDest.Journal?.items).toEqual(['Energy Check 8/10', 'My health']);
  });

  it('marks destinations empty when their steps were skipped', () => {
    const empty = routeAnswers(run, newSession(run));
    expect(empty.every((c) => c.empty)).toBe(true);
  });

  it('routes inbox choices by option', () => {
    const inbox = findBuiltInRun('inbox')!;
    let s = newSession(inbox);
    s = togglePick(s, inbox.steps[0] as PickStep, 'Let go');
    s = togglePick(s, inbox.steps[1] as PickStep, 'Make a task');
    const result = routeAnswers(inbox, s);
    expect(result.map((c) => c.dest)).toEqual(['Archive', 'Tasks']);
    expect(result[0]?.detail).toContain('Archived, not deleted');
  });

  it('routes text answers', () => {
    const mind = findBuiltInRun('mind')!;
    const step = mind.steps.find((x) => x.kind === 'text')!;
    const s = setText(newSession(mind), step.id, 'Too many tabs open.');
    const journal = routeAnswers(mind, s).find((c) => c.dest === 'Journal');
    expect(journal?.items).toContain('Too many tabs open.');
  });
});

describe('intention', () => {
  const run = findBuiltInRun('morning')!;
  const session = answerMorning();
  const cards = routeAnswers(run, session);
  const intention = buildIntention(
    run,
    session,
    cards,
    new Date(2026, 9, 25, 8, 30),
  );

  it('leads with the focus', () => {
    expect(intention.headline).toBe('Today I am focusing on making things.');
    expect(intention.dateLabel).toContain('25 October');
  });

  it('summarises energy and priorities', () => {
    expect(intention.lines).toContainEqual({
      label: 'Energy',
      text: '8/10, pretty good',
    });
    expect(intention.lines).toContainEqual({
      label: 'Priorities',
      text: 'Finish the draft and Move my body',
    });
  });

  it('renders plain text and markdown', () => {
    expect(intentionText(intention)).toContain(
      'Today I am focusing on making things.',
    );
    expect(intentionMarkdown(intention)).toMatch(/^# Intention for/);
    expect(intentionMarkdown(intention)).toContain(
      '- **Energy:** 8/10, pretty good',
    );
  });

  it('falls back gracefully when nothing was answered', () => {
    const fresh = newSession(run);
    const i = buildIntention(run, fresh, routeAnswers(run, fresh), new Date());
    expect(i.headline).toContain('quick morning');
  });
});
