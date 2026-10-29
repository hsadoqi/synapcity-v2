import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  save: vi.fn(),
  browserSave: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));
vi.mock('next/link', () => ({
  default: (props: React.ComponentProps<'a'>) => <a {...props} />,
}));
vi.mock('../../server/actions/dashboard-composition-actions', () => ({
  saveDashboardComposition: mocks.save,
}));
// The real browser storage, with its saveComposition watched.
vi.mock('@synapcity/features-dashboards/frontend', async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import('@synapcity/features-dashboards/frontend')
    >();
  return {
    ...actual,
    browserDashboardStorage: (
      options: Parameters<typeof actual.browserDashboardStorage>[0],
    ) => {
      const storage = actual.browserDashboardStorage(options);
      return {
        ...storage,
        saveComposition: (
          ...args: Parameters<typeof storage.saveComposition>
        ) => {
          mocks.browserSave(...args);
          return storage.saveComposition(...args);
        },
      };
    },
  };
});

import { createComposition } from '@synapcity/domain-dashboards';
import type { BaseRecord } from '@synapcity/domain-records';
import { TooltipProvider } from '@synapcity/frontend-ui/core/tooltip';
import { DashboardView } from './dashboard-view';

// The panel library lays out against browser measurements; supply them, as the
// shells package's own tests do, and let each flush play ResizeObserver.
let containerWidth = 1200;
const observers = new Set<{
  callback: ResizeObserverCallback;
  elements: Set<Element>;
}>();
beforeEach(() => {
  containerWidth = 1200;
  mocks.refresh.mockReset();
  mocks.save.mockReset();
  mocks.browserSave.mockReset();
  localStorage.clear();
  mocks.save.mockImplementation(
    async (_id: string, _c: unknown, base: number) => ({
      ok: true,
      revision: base + 1,
    }),
  );
  vi.stubGlobal(
    'ResizeObserver',
    class {
      elements = new Set<Element>();
      constructor(public callback: ResizeObserverCallback) {
        observers.add(this);
      }
      observe(element: Element) {
        this.elements.add(element);
      }
      unobserve(element: Element) {
        this.elements.delete(element);
      }
      disconnect() {
        observers.delete(this);
      }
    },
  );
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(
    function (this: HTMLElement) {
      if (this.hasAttribute('data-separator')) return 4;
      if (this.hasAttribute('data-panel'))
        return (Number(this.style.flexGrow || 0) / 100) * (containerWidth - 52);
      return containerWidth;
    },
  );
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(800);
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
    () => new DOMRect(0, 0, containerWidth, 800),
  );
});
afterEach(() => {
  observers.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

async function layout() {
  await act(async () => {
    for (const observer of observers) {
      observer.callback(
        [...observer.elements].map((target) => {
          const width = (target as HTMLElement).offsetWidth;
          return {
            target,
            borderBoxSize: [{ blockSize: 800, inlineSize: width }],
            contentBoxSize: [],
            devicePixelContentBoxSize: [],
            contentRect: new DOMRect(0, 0, width, 800),
          };
        }),
        { observe() {}, unobserve() {}, disconnect() {} },
      );
    }
  });
}

const DASHBOARD = {
  id: '11111111-1111-4111-8111-111111111111',
  ownerId: '22222222-2222-4222-8222-222222222222',
  name: 'Project status',
  icon: 'layout-dashboard',
} as unknown as BaseRecord;

const ITEMS = [
  {
    id: 's1',
    kind: 'space' as const,
    name: 'Research',
    icon: 'folder',
    href: '/home/spaces/s1',
    pinnedAt: '2026-10-20T00:00:00Z',
    lastViewedAt: '2026-10-21T00:00:00Z',
  },
];

type Props = Partial<React.ComponentProps<typeof DashboardView>>;
const view = (props: Props = {}) => (
  <TooltipProvider>
    <DashboardView
      dashboard={DASHBOARD}
      composition={null}
      revision={3}
      items={ITEMS}
      persistence="server"
      {...props}
    />
  </TooltipProvider>
);

async function setup(props: Props = {}) {
  const result = render(view(props));
  await layout();
  return {
    ...result,
    rerenderWith: async (next: Props) => {
      result.rerender(view(next));
      await layout();
    },
  };
}

const rail = () => screen.getByRole('toolbar', { name: 'Contextual panel' });
const railButton = (name: string) =>
  within(rail()).getByRole('button', { name });
const region = () =>
  document.querySelector<HTMLElement>('[data-contextual-panel-region]')!;
const main = () =>
  document.querySelector<HTMLElement>('[data-slot="contextual-main"]')!;
/** The toggle in the canvas toolbar; the Widgets destination also offers one while editing is off. */
const editToggle = () =>
  screen
    .getAllByRole('button', { name: 'Edit layout' })
    .find((button) => button.hasAttribute('aria-pressed'))!;
const palette = () =>
  screen.queryByRole('region', { name: 'Add to dashboard' });

async function press(element: HTMLElement) {
  fireEvent.click(element);
  await layout();
}

describe('DashboardView composition', () => {
  it('renders the heading, the rail with Widgets then Context and the canvas on the first render', async () => {
    await setup();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Project status' }),
    ).toBeTruthy();
    expect(
      within(rail())
        .getAllByRole('button')
        .map((button) => button.getAttribute('aria-label')),
    ).toEqual(['Widgets', 'Context']);
    expect(screen.getByText('No widgets yet')).toBeTruthy();
    expect(screen.queryByText('Loading dashboard…')).toBeNull();
    expect(region().hasAttribute('inert')).toBe(true);
  });

  describe('Edit layout and the Widgets destination', () => {
    it('opens the panel on Widgets and shows the palette', async () => {
      await setup();
      await press(editToggle());
      expect(editToggle().getAttribute('aria-pressed')).toBe('true');
      expect(railButton('Widgets').getAttribute('aria-pressed')).toBe('true');
      expect(region().hasAttribute('inert')).toBe(false);
      expect(palette()).toBeTruthy();
    });

    it('switches a panel showing Context to Widgets', async () => {
      await setup();
      await press(railButton('Context'));
      expect(railButton('Context').getAttribute('aria-pressed')).toBe('true');
      await press(editToggle());
      expect(railButton('Widgets').getAttribute('aria-pressed')).toBe('true');
      expect(railButton('Context').getAttribute('aria-pressed')).toBe('false');
    });

    it('turning editing off leaves the panel as it is', async () => {
      await setup();
      await press(editToggle());
      await press(editToggle());
      expect(editToggle().getAttribute('aria-pressed')).toBe('false');
      expect(railButton('Widgets').getAttribute('aria-pressed')).toBe('true');
      // Collapsed by the person, then editing toggled twice: still collapsed.
      await press(railButton('Widgets'));
      expect(region().hasAttribute('inert')).toBe(true);
      await press(editToggle());
      await press(editToggle());
      expect(editToggle().getAttribute('aria-pressed')).toBe('false');
    });

    it('choosing Widgets while not editing explains, and does not start editing', async () => {
      await setup();
      await press(railButton('Widgets'));
      expect(screen.getByText(/Choose Edit layout/)).toBeTruthy();
      expect(palette()).toBeNull();
      expect(editToggle().getAttribute('aria-pressed')).toBe('false');
    });

    it('its explicit Edit layout button starts editing and keeps focus in the panel', async () => {
      await setup();
      await press(railButton('Widgets'));
      const idle = document.querySelector<HTMLElement>(
        '[data-slot="widgets-destination-idle"]',
      )!;
      await press(within(idle).getByRole('button', { name: 'Edit layout' }));
      expect(editToggle().getAttribute('aria-pressed')).toBe('true');
      expect(palette()).toBeTruthy();
      await vi.waitFor(() =>
        expect(region().contains(document.activeElement)).toBe(true),
      );
    });

    it('the empty state offers Add a widget, which opens the palette and focuses its first button', async () => {
      await setup();
      await press(screen.getByRole('button', { name: 'Add a widget' }));
      expect(editToggle().getAttribute('aria-pressed')).toBe('true');
      expect(railButton('Widgets').getAttribute('aria-pressed')).toBe('true');
      await vi.waitFor(() =>
        expect(document.activeElement).toBe(
          within(palette()!).getAllByRole('button')[0],
        ),
      );
    });
  });

  describe('the panel never owns Dashboard state', () => {
    async function editedWithPinned() {
      const result = await setup();
      await press(editToggle());
      await press(within(palette()!).getByRole('button', { name: 'Pinned' }));
      expect(screen.getByText('Unsaved changes')).toBeTruthy();
      return result;
    }

    it('closing the panel keeps edit mode, the widget and the unsaved status', async () => {
      await editedWithPinned();
      await press(railButton('Widgets'));
      expect(region().hasAttribute('inert')).toBe(true);
      expect(editToggle().getAttribute('aria-pressed')).toBe('true');
      expect(screen.getByRole('region', { name: 'Pinned' })).toBeTruthy();
      expect(screen.getByText('Unsaved changes')).toBeTruthy();
    });

    it('switching to Context and back keeps editing, the widget and the palette', async () => {
      await editedWithPinned();
      await press(railButton('Context'));
      expect(editToggle().getAttribute('aria-pressed')).toBe('true');
      await press(railButton('Widgets'));
      expect(palette()).toBeTruthy();
      expect(screen.getByRole('region', { name: 'Pinned' })).toBeTruthy();
      expect(screen.getByText('Unsaved changes')).toBeTruthy();
    });

    it('saves what was edited while the panel was closed and reopened', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      await editedWithPinned();
      await press(railButton('Widgets'));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(500);
      });
      expect(mocks.save).toHaveBeenCalledTimes(1);
      expect(mocks.save.mock.calls[0]?.[2]).toBe(3);
      expect(await screen.findByText('Saved')).toBeTruthy();
    });
  });

  describe('Reload after a conflict', () => {
    it('replaces the dashboard and keeps the panel, its destination and edit mode', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      mocks.save.mockResolvedValue({ ok: false, reason: 'conflict' });
      const result = await setup();
      await press(editToggle());
      await press(within(palette()!).getByRole('button', { name: 'Pinned' }));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(500);
      });
      expect(await screen.findByText(/Changed elsewhere/)).toBeTruthy();
      const frame = document.querySelector('[data-slot="resource-frame"]');

      await press(screen.getByRole('button', { name: 'Reload' }));
      expect(mocks.refresh).toHaveBeenCalledTimes(1);
      // The page refreshed: the server hands over its newer, empty dashboard.
      await result.rerenderWith({ composition: null, revision: 9 });

      expect(document.querySelector('[data-slot="resource-frame"]')).toBe(
        frame,
      );
      expect(screen.queryByRole('region', { name: 'Pinned' })).toBeNull();
      expect(screen.getByText('No widgets yet')).toBeTruthy();
      expect(editToggle().getAttribute('aria-pressed')).toBe('true');
      expect(railButton('Widgets').getAttribute('aria-pressed')).toBe('true');
      expect(region().hasAttribute('inert')).toBe(false);
      expect(screen.queryByText(/Changed elsewhere/)).toBeNull();
      expect(screen.getByText('Saved')).toBeTruthy();
      // The conflicted draft is gone for good: nothing more is written.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });
      expect(mocks.save).toHaveBeenCalledTimes(1);
    });

    it('saves later edits from the new revision', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const result = await setup();
      await result.rerenderWith({ composition: null, revision: 9 });
      await press(editToggle());
      await press(within(palette()!).getByRole('button', { name: 'Pinned' }));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(500);
      });
      expect(mocks.save.mock.calls[0]?.[2]).toBe(9);
    });
  });

  describe('in a container too narrow for the canvas and the panel together', () => {
    beforeEach(() => {
      containerWidth = 400;
    });

    it('keeps the panel open after adding a widget, announces it outside the inert canvas, and leaves focus in the panel', async () => {
      await setup();
      await press(editToggle());
      expect(main().hasAttribute('inert')).toBe(true);
      expect(region().hasAttribute('inert')).toBe(false);

      const pinned = within(palette()!).getByRole('button', { name: 'Pinned' });
      pinned.focus();
      await press(pinned);

      expect(region().hasAttribute('inert')).toBe(false);
      expect(railButton('Widgets').getAttribute('aria-pressed')).toBe('true');
      const announcement = screen.getByText('Pinned added');
      expect(announcement.getAttribute('role')).toBe('status');
      expect(announcement.closest('[inert]')).toBeNull();
      // The new widget is behind the panel; focus stays on a control that works.
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 150));
      });
      expect(region().contains(document.activeElement)).toBe(true);
      expect(main().contains(document.activeElement)).toBe(false);
    });

    it('returns to the canvas, with the widget there, when the panel is collapsed', async () => {
      await setup();
      await press(editToggle());
      await press(within(palette()!).getByRole('button', { name: 'Pinned' }));
      await press(railButton('Widgets'));
      expect(main().hasAttribute('inert')).toBe(false);
      expect(screen.getByRole('region', { name: 'Pinned' })).toBeTruthy();
      expect(editToggle().getAttribute('aria-pressed')).toBe('true');
    });
  });

  describe('browser fixture mode', () => {
    it('shows the frame with a skeleton while the browser storage is read, then the canvas', async () => {
      const result = render(view({ persistence: 'browser' }));
      expect(
        screen.getByRole('heading', { level: 1, name: 'Project status' }),
      ).toBeTruthy();
      expect(screen.getByText('Loading dashboard…')).toBeTruthy();
      await layout();
      expect(await screen.findByText('No widgets yet')).toBeTruthy();
      expect(rail()).toBeTruthy();
      result.unmount();
    });

    const fixture = (id: string) =>
      ({ ...DASHBOARD, id }) as unknown as BaseRecord;
    const dashboardWrites = () =>
      Object.keys(localStorage).filter((key) =>
        key.startsWith('synapcity.dashboard.'),
      );

    it('a seeded fixture dashboard shows its widgets on first open and saves nothing until it is edited', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      render(
        view({
          persistence: 'browser',
          dashboard: fixture('fixture-dashboard-project-status'),
        }),
      );
      await layout();
      expect(
        await screen.findByRole('region', { name: 'Pinned' }),
      ).toBeTruthy();
      expect(screen.getByRole('region', { name: 'Last opened' })).toBeTruthy();
      expect(screen.getByRole('region', { name: 'Spaces' })).toBeTruthy();
      expect(screen.queryByText('No widgets yet')).toBeNull();

      // Well past the save debounce: rendering wrote nothing.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });
      expect(mocks.browserSave).not.toHaveBeenCalled();
      expect(dashboardWrites()).toEqual([]);

      // The first edit saves through the scheduler, seed included.
      await press(editToggle());
      await press(within(palette()!).getByRole('button', { name: 'Spaces' }));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(500);
      });
      expect(mocks.browserSave).toHaveBeenCalledTimes(1);
      const [id, saved] = mocks.browserSave.mock.calls[0] as [
        string,
        { widgets: { type: string }[] },
      ];
      expect(id).toBe('fixture-dashboard-project-status');
      expect(saved.widgets.map((widget) => widget.type)).toEqual([
        'pinned',
        'last-opened',
        'spaces',
        'spaces',
      ]);
      expect(dashboardWrites()).toHaveLength(1);
    });

    it('a stored composition wins over the seed, even an empty one', async () => {
      const id = 'fixture-dashboard-project-status';
      localStorage.setItem(
        `synapcity.dashboard.${DASHBOARD.ownerId}.${id}.v1`,
        JSON.stringify(createComposition()),
      );
      render(view({ persistence: 'browser', dashboard: fixture(id) }));
      await layout();
      expect(await screen.findByText('No widgets yet')).toBeTruthy();
      expect(screen.queryByRole('region', { name: 'Pinned' })).toBeNull();
    });

    it('keeps reading-progress empty', async () => {
      render(
        view({
          persistence: 'browser',
          dashboard: fixture('fixture-dashboard-reading-progress'),
        }),
      );
      await layout();
      expect(await screen.findByText('No widgets yet')).toBeTruthy();
      expect(mocks.browserSave).not.toHaveBeenCalled();
    });

    it('does not seed in server mode', async () => {
      await setup({ dashboard: fixture('fixture-dashboard-project-status') });
      expect(screen.getByText('No widgets yet')).toBeTruthy();
    });
  });
});
