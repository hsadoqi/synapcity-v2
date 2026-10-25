import { applyRunToBoard } from '@/lib/board/model';
import type { HistoryEntry } from '@/lib/history/model';
import { MAX_HISTORY } from '@/lib/history/model';
import { buildIntention } from '@/lib/intention';
import { energyOf, focusPlanOf, routeAnswers } from '@/lib/routing';
import type { Run } from '@/lib/runs/schema';
import {
  answeredCount,
  newSession,
  totalSpentMs,
  type RunSession,
} from '@/lib/session/model';
import {
  boardStore,
  customRunsStore,
  historyStore,
  prefsStore,
  sessionStore,
} from './stores';

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function startRun(run: Run): void {
  sessionStore.set(newSession(run));
}

export function discardSession(): void {
  sessionStore.set(null);
}

/** The pure part of finishing a run: a history entry built from the session. */
export function buildHistoryEntry(
  run: Run,
  session: RunSession,
  now: Date,
  id = newId(),
): HistoryEntry {
  const cards = routeAnswers(run, session);
  return {
    id,
    runId: run.id,
    runName: run.name,
    group: run.group,
    startedAt: session.startedAt,
    completedAt: now.toISOString(),
    durationSec: Math.round(totalSpentMs(session) / 1000),
    totalSteps: run.steps.length,
    answered: answeredCount(run, session),
    skipped: session.skipped.length,
    energy: energyOf(run, session),
    intention: buildIntention(run, session, cards, now),
    focusPlan: focusPlanOf(run, session, cards),
    cards,
  };
}

/** Save the run to history, file its answers on today's board, and clear the active session. */
export function completeRun(
  run: Run,
  session: RunSession,
  now: Date = new Date(),
): HistoryEntry {
  const entry = buildHistoryEntry(run, session, now);
  historyStore.set((history) => [entry, ...history].slice(0, MAX_HISTORY));
  boardStore.set((board) => applyRunToBoard(board, entry, now));
  sessionStore.set(null);
  return entry;
}

export function togglePin(runId: string): void {
  prefsStore.set((prefs) => ({
    ...prefs,
    pinned: prefs.pinned.includes(runId)
      ? prefs.pinned.filter((id) => id !== runId)
      : [...prefs.pinned, runId],
  }));
}

export function saveCustomRun(run: Run): void {
  customRunsStore.set((runs) => {
    const exists = runs.some((r) => r.id === run.id);
    return exists
      ? runs.map((r) => (r.id === run.id ? run : r))
      : [...runs, run];
  });
}

export function deleteCustomRun(runId: string): void {
  customRunsStore.set((runs) => runs.filter((r) => r.id !== runId));
  prefsStore.set((prefs) => ({
    ...prefs,
    pinned: prefs.pinned.filter((id) => id !== runId),
  }));
  sessionStore.set((session) => (session?.runId === runId ? null : session));
}

export function newRunId(): string {
  return `custom-${newId().slice(0, 8)}`;
}
