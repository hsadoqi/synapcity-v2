import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ViewProvider } from '@/components/view-provider';
import { findBuiltInRun } from '@/lib/runs/catalog';
import { newSession, setRating } from '@/lib/session/model';
import { boardStore, historyStore, sessionStore } from '@/lib/storage/stores';
import { RunPlayer } from './run-player';

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  usePathname: () => '/run/morning',
}));

const morning = findBuiltInRun('morning')!;

function mount(runId = 'morning') {
  return render(
    <ViewProvider initial="focus">
      <RunPlayer runId={runId} />
    </ViewProvider>,
  );
}

beforeEach(() => {
  push.mockClear();
  sessionStore.set(null);
  historyStore.set([]);
});

describe('RunPlayer', () => {
  it('starts a run with the first step timer at that step’s own length', async () => {
    mount();
    expect(
      await screen.findByRole('heading', { name: 'Energy Check' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('timer')).toHaveTextContent('0:30');
    expect(screen.getByText(/run 3:53/)).toBeInTheDocument();
    expect(sessionStore.getSnapshot()?.runId).toBe('morning');
  });

  it('shows a different starting time for a run with different steps', async () => {
    mount('reset');
    await screen.findByRole('heading', { name: 'Breathing Exercise' });
    expect(screen.getByRole('timer')).toHaveTextContent('0:38');
    expect(screen.getByText(/run 1:08/)).toBeInTheDocument();
  });

  it('disables Continue until a required step is answered, and explains why', async () => {
    const user = userEvent.setup();
    mount();
    await screen.findByRole('heading', { name: 'Energy Check' });
    const next = screen.getByRole('button', { name: /Continue/ });
    expect(next).toBeDisabled();
    expect(
      screen.getByText('Pick a number to continue, or skip.'),
    ).toBeInTheDocument();
    expect(screen.getByText(/^Required/)).toBeInTheDocument();

    await user.keyboard('7');
    expect(screen.getByRole('radio', { name: '7 of 10' })).toBeChecked();
    expect(next).toBeEnabled();
  });

  it('rates with number keys, and 0 means ten', async () => {
    const user = userEvent.setup();
    mount();
    await screen.findByRole('heading', { name: 'Energy Check' });
    await user.keyboard('0');
    expect(screen.getByRole('radio', { name: '10 of 10' })).toBeChecked();
  });

  it('continues with Enter and lands on the next step', async () => {
    const user = userEvent.setup();
    mount();
    await screen.findByRole('heading', { name: 'Energy Check' });
    await user.keyboard('6{Enter}');
    expect(
      await screen.findByRole('heading', { name: 'Breathing Exercise' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('timer')).toHaveTextContent('0:38');
    expect(sessionStore.getSnapshot()?.stepIndex).toBe(1);
  });

  it('does not continue with Enter while the step is unanswered', async () => {
    const user = userEvent.setup();
    mount();
    await screen.findByRole('heading', { name: 'Energy Check' });
    await user.keyboard('{Enter}');
    expect(
      screen.getByRole('heading', { name: 'Energy Check' }),
    ).toBeInTheDocument();
  });

  it('marks a skipped step and moves on', async () => {
    const user = userEvent.setup();
    mount();
    await screen.findByRole('heading', { name: 'Energy Check' });
    await user.click(screen.getByRole('button', { name: 'Skip' }));
    expect(
      await screen.findByRole('heading', { name: 'Breathing Exercise' }),
    ).toBeInTheDocument();
    expect(sessionStore.getSnapshot()?.skipped).toEqual([morning.steps[0]!.id]);
  });

  it('pauses and resumes the timer with the button and the P key', async () => {
    const user = userEvent.setup();
    mount();
    await screen.findByRole('heading', { name: 'Energy Check' });
    await user.click(screen.getByRole('button', { name: 'Pause timer' }));
    expect(
      screen.getByRole('button', { name: 'Resume timer' }),
    ).toBeInTheDocument();
    await user.keyboard('p');
    expect(
      screen.getByRole('button', { name: 'Pause timer' }),
    ).toBeInTheDocument();
  });

  it('leaves straight away when nothing has been answered', async () => {
    const user = userEvent.setup();
    mount();
    await screen.findByRole('heading', { name: 'Energy Check' });
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(push).toHaveBeenCalledWith('/');
    expect(sessionStore.getSnapshot()).toBeNull();
  });

  it('asks before abandoning a partly done run, and keeps it if you stay', async () => {
    const user = userEvent.setup();
    mount();
    await screen.findByRole('heading', { name: 'Energy Check' });
    await user.keyboard('5{Escape}');
    const dialog = await screen.findByRole('alertdialog');
    expect(within(dialog).getByText('Leave this run?')).toBeInTheDocument();
    await user.click(
      within(dialog).getByRole('button', { name: 'Keep going' }),
    );
    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
    );
    expect(push).not.toHaveBeenCalled();
    expect(sessionStore.getSnapshot()?.answers[morning.steps[0]!.id]).toBe(5);
  });

  it('can leave and keep progress, or discard it', async () => {
    const user = userEvent.setup();
    const first = mount();
    await screen.findByRole('heading', { name: 'Energy Check' });
    await user.keyboard('5{Escape}');
    await user.click(
      await screen.findByRole('button', { name: 'Leave, keep progress' }),
    );
    expect(push).toHaveBeenCalledWith('/');
    expect(sessionStore.getSnapshot()).not.toBeNull();
    first.unmount();

    push.mockClear();
    mount();
    await screen.findByRole('heading', { name: 'Energy Check' });
    await user.keyboard('{Escape}');
    await user.click(
      await screen.findByRole('button', { name: 'Discard run' }),
    );
    expect(push).toHaveBeenCalledWith('/');
    expect(sessionStore.getSnapshot()).toBeNull();
  });

  it('restarts after confirming, clearing answers', async () => {
    const user = userEvent.setup();
    mount();
    await screen.findByRole('heading', { name: 'Energy Check' });
    await user.keyboard('9');
    await user.click(screen.getByRole('button', { name: 'Restart' }));
    await user.click(
      await screen.findByRole('button', { name: 'Restart run' }),
    );
    await waitFor(() =>
      expect(sessionStore.getSnapshot()?.answers).toEqual({}),
    );
    expect(
      await screen.findByRole('heading', { name: 'Energy Check' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('timer')).toHaveTextContent('0:30');
  });

  it('resumes an interrupted run on the saved step, with the timer waiting', async () => {
    let s = newSession(morning);
    s = setRating(s, morning.steps[0]!.id, 8);
    sessionStore.set({ ...s, stepIndex: 2, elapsedMs: 20_000 });
    mount();
    expect(
      await screen.findByRole('heading', { name: 'Gratitude' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Resume timer' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('timer')).toHaveTextContent('0:40');
  });

  it('offers to resume a different run instead of overwriting it', async () => {
    sessionStore.set(newSession(findBuiltInRun('evening')!));
    mount('morning');
    expect(
      await screen.findByText('You are partway through another run.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Resume Evening wind-down/ }),
    ).toBeInTheDocument();
  });

  it('shows a clear message for a run that does not exist', async () => {
    mount('nope');
    expect(
      await screen.findByText('That run is not on this device.'),
    ).toBeInTheDocument();
  });

  it('finishes a run: saves history, files the board and goes to the result', async () => {
    const user = userEvent.setup();
    mount('reset');
    await screen.findByRole('heading', { name: 'Breathing Exercise' });
    await user.keyboard('{Enter}');
    await screen.findByRole('heading', { name: "What's next?" });
    const radios = screen.getAllByRole('radio');
    await user.click(radios[0]!);
    await act(async () => {
      await user.keyboard('{Enter}');
    });

    expect(historyStore.getSnapshot()).toHaveLength(1);
    const entry = historyStore.getSnapshot()[0]!;
    expect(entry.runId).toBe('reset');
    expect(entry.cards.map((c) => c.dest)).toEqual(['Focus']);
    expect(entry.intention.headline).toBe(
      'Today I am focusing on finish the draft.',
    );
    expect(boardStore.getSnapshot().items.Focus?.[0]?.text).toBe(
      'Finish the draft',
    );
    expect(sessionStore.getSnapshot()).toBeNull();
    expect(push).toHaveBeenCalledWith(`/done/${entry.id}`);
  });
});
