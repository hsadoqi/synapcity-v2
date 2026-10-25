import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ViewProvider } from '@/components/view-provider';
import { BUILT_IN_RUNS, findBuiltInRun } from '@/lib/runs/catalog';
import { STEP_TEMPLATES } from '@/lib/runs/templates';
import { newSession, setRating } from '@/lib/session/model';
import {
  customRunsStore,
  prefsStore,
  sessionStore,
} from '@/lib/storage/stores';
import type { View } from '@/lib/view';
import { HomeScreen } from './home-screen';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
}));

const mount = (view: View = 'focus') =>
  render(
    <ViewProvider initial={view}>
      <HomeScreen />
    </ViewProvider>,
  );

beforeEach(() => {
  sessionStore.set(null);
  prefsStore.set({ pinned: [] });
  customRunsStore.set([]);
});

describe('HomeScreen', () => {
  it.each(['focus', 'stage', 'workbench'] as const)(
    'lists every built-in run in the %s view',
    (view) => {
      mount(view);
      for (const run of BUILT_IN_RUNS) {
        expect(
          screen.getByRole('link', { name: new RegExp(run.name) }),
        ).toHaveAttribute('href', `/run/${run.id}`);
      }
    },
  );

  it('shows each run’s real length on its card', () => {
    mount();
    const morning = screen.getByRole('link', { name: /Quick morning/ });
    expect(morning).toHaveTextContent('5 steps · about 4 min');
    expect(screen.getByRole('link', { name: /Home reset/ })).toHaveTextContent(
      '2 steps · about 1 min',
    );
  });

  it('groups runs, including the personal life ones', () => {
    mount();
    for (const name of [
      'Daily',
      'Personal',
      'Reviews',
      'Switching',
      'Projects and meetings',
    ]) {
      expect(screen.getByRole('heading', { name })).toBeInTheDocument();
    }
    expect(
      screen.getByRole('link', { name: /Body and sleep/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /People who matter/ }),
    ).toBeInTheDocument();
  });

  it('offers to resume an interrupted run', async () => {
    const run = findBuiltInRun('morning')!;
    sessionStore.set({
      ...setRating(newSession(run), run.steps[0]!.id, 7),
      stepIndex: 2,
    });
    mount();
    const banner = await screen.findByRole('region', {
      name: 'Run in progress',
    });
    expect(
      within(banner).getByText('Quick morning, step 3 of 5'),
    ).toBeInTheDocument();
    expect(
      within(banner).getByRole('link', { name: /Resume/ }),
    ).toHaveAttribute('href', '/run/morning');
  });

  it('discards an interrupted run from the banner', async () => {
    const user = userEvent.setup();
    sessionStore.set(newSession(findBuiltInRun('morning')!));
    mount();
    await user.click(await screen.findByRole('button', { name: /Discard/ }));
    expect(sessionStore.getSnapshot()).toBeNull();
    expect(
      screen.queryByRole('region', { name: 'Run in progress' }),
    ).not.toBeInTheDocument();
  });

  it('pins a run to the top and unpins it again', async () => {
    const user = userEvent.setup();
    mount();
    expect(
      screen.queryByRole('heading', { name: 'Pinned' }),
    ).not.toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'Pin Body and sleep' }),
    );
    const pinned = screen.getByRole('region', { name: 'Pinned' });
    expect(
      within(pinned).getByRole('link', { name: /Body and sleep/ }),
    ).toBeInTheDocument();
    expect(prefsStore.getSnapshot().pinned).toEqual(['body']);
    await user.click(
      within(pinned).getByRole('button', { name: 'Unpin Body and sleep' }),
    );
    expect(
      screen.queryByRole('region', { name: 'Pinned' }),
    ).not.toBeInTheDocument();
  });

  it('shows runs you built under My runs, next to the built-ins', () => {
    customRunsStore.set([
      {
        id: 'custom-abc',
        group: 'My runs',
        name: 'Sunday reset',
        tagline: 'Plan the week',
        icon: 'star',
        steps: [STEP_TEMPLATES[0]!.make()],
        builtIn: false,
      },
    ]);
    mount();
    const mine = screen.getByRole('region', { name: 'My runs' });
    expect(
      within(mine).getByRole('link', { name: /Sunday reset/ }),
    ).toHaveAttribute('href', '/run/custom-abc');
  });
});
