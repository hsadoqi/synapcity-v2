import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ViewProvider } from '@/components/view-provider';
import { buildHistoryEntry } from '@/lib/storage/actions';
import { findBuiltInRun } from '@/lib/runs/catalog';
import type { PickStep } from '@/lib/runs/schema';
import { newSession, setRating, togglePick } from '@/lib/session/model';
import { historyStore } from '@/lib/storage/stores';
import { CompletionScreen } from './completion-screen';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/done/x',
}));

const run = findBuiltInRun('morning')!;
let session = setRating(newSession(run), run.steps[0]!.id, 8);
session = togglePick(session, run.steps[3] as PickStep, 'Finish the draft');
session = togglePick(session, run.steps[4] as PickStep, 'Making things');
const entry = buildHistoryEntry(
  run,
  session,
  new Date(2026, 9, 25, 8, 30),
  'entry-1',
);

const mount = () =>
  render(
    <ViewProvider initial="focus">
      <CompletionScreen entryId="entry-1" />
    </ViewProvider>,
  );

beforeEach(() => {
  historyStore.set([entry]);
});

describe('CompletionScreen', () => {
  it('turns the answers into one intention card', async () => {
    mount();
    const card = await screen.findByRole('region', {
      name: "Today's intention",
    });
    expect(card).toHaveTextContent('Today I am focusing on making things.');
    expect(card).toHaveTextContent('8/10, pretty good');
    expect(card).toHaveTextContent('Finish the draft');
  });

  it('lists where each answer went', async () => {
    mount();
    await screen.findByRole('region', { name: "Today's intention" });
    // Cards are revealed one at a time, so the third takes a moment.
    await waitFor(
      () =>
        expect(screen.getByText('Focus: Making things')).toBeInTheDocument(),
      { timeout: 4000 },
    );
    expect(screen.getByText('1 task added')).toBeInTheDocument();
  });

  it('copies the intention as text', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    mount();
    await user.click(await screen.findByRole('button', { name: 'Copy' }));
    expect(writeText).toHaveBeenCalledOnce();
    expect(writeText.mock.calls[0]![0]).toContain(
      'Today I am focusing on making things.',
    );
    expect(await screen.findByText('Copied to clipboard')).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it('downloads the intention as Markdown', async () => {
    const user = userEvent.setup();
    const create = vi.fn(() => 'blob:x');
    URL.createObjectURL = create;
    URL.revokeObjectURL = vi.fn();
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});
    mount();
    await user.click(await screen.findByRole('button', { name: 'Markdown' }));
    expect(create).toHaveBeenCalledOnce();
    const blob = (create.mock.calls[0] as unknown as [Blob])[0];
    expect(await blob.text()).toMatch(/^# Intention for/);
    expect(click).toHaveBeenCalled();
    click.mockRestore();
  });

  it('links to a focus session', async () => {
    mount();
    expect(
      await screen.findByRole('link', { name: /Start focus session/ }),
    ).toHaveAttribute('href', '/focus');
  });

  it('explains when the run is gone', async () => {
    historyStore.set([]);
    mount();
    expect(
      await screen.findByText('We could not find that run.'),
    ).toBeInTheDocument();
  });
});
