import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { FileText, PanelRight, PenLine } from 'lucide-react';
import { ModeProvider } from '@synapcity/frontend-preferences';
import { TooltipProvider } from '@synapcity/frontend-ui/core/tooltip';

import { ContextualPanelShell, type ContextualPanelDestination } from '.';
import { SidebarShell } from '../sidebar-shell';
import { RootSidebar } from '../sidebar-shell/root-sidebar';
import { GlobalPanelToggle } from '../root-shell/global-panel';
import { sampleSidebarGroups } from '../../testing/sidebar-sample';
import { RegionProbe } from '../../testing/region-probe';
import { PlaceholderPanelResource } from '../../testing/review-placeholders';
import { ProposedWorkspace } from '../../testing/proposed-workspace';
import { AuthenticatedShell } from '../root-shell';
import { ContextSwitcher } from '../context-switcher';

/**
 * Story content only. "Context" is the app's empty placeholder; "Resource"
 * stands in for another Document or Dashboard shown beside the work: cards
 * laid out by the panel's own width, enough of them to scroll.
 */
const destinations: ContextualPanelDestination[] = [
  {
    id: 'context',
    label: 'Context',
    icon: PanelRight,
    content: (
      <p className="p-4 text-sm text-muted-foreground">
        Nothing here yet. Context for your work will appear here.
      </p>
    ),
  },
  {
    id: 'resource',
    label: 'Resource',
    icon: FileText,
    content: <RegionProbe region="panel" />,
  },
];

const meta: Meta<typeof ContextualPanelShell> = {
  title: 'Blocks/ContextualPanel',
  component: ContextualPanelShell,
  parameters: { layout: 'fullscreen' },
  argTypes: {
    destinations: { control: false },
    children: { control: false },
  },
  args: { destinations, children: <RegionProbe region="main" /> },
  decorators: [
    (Story) => (
      <ModeProvider>
        <TooltipProvider>
          <Story />
        </TooltipProvider>
      </ModeProvider>
    ),
  ],
  // The shell follows its container, not the window. Wide stories give it at
  // least 64rem, whatever the test browser's window, and scroll past it.
  render: (args) => (
    <div className="h-svh overflow-auto">
      <div className="flex h-full w-full min-w-5xl">
        <ContextualPanelShell {...args} />
      </div>
    </div>
  ),
};
export default meta;
type Story = StoryObj<typeof ContextualPanelShell>;

/** Waits until the shell has measured its container, as a person's first click would. */
const laidOut = (canvasElement: HTMLElement) =>
  waitFor(() =>
    expect(
      canvasElement
        .querySelector('[data-slot="contextual-main"]')!
        .getBoundingClientRect().width,
    ).toBeGreaterThan(0),
  );

const mainWidth = (canvasElement: HTMLElement) =>
  canvasElement
    .querySelector('[data-slot="contextual-main"]')!
    .getBoundingClientRect().width;

/** Resolves once an element's width has stopped changing (the panel glides). */
async function settledWidth(read: () => number) {
  let last = -1;
  let stableFrames = 0;
  while (stableFrames < 5) {
    await new Promise(requestAnimationFrame);
    const width = read();
    stableFrames = width === last ? stableFrames + 1 : 0;
    last = width;
  }
  return last;
}

/** Collapsed to its rail; choose a rail icon to expand on that destination. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await laidOut(canvasElement);
    const canvas = within(canvasElement);
    const rail = canvas.getByRole('toolbar', { name: 'Contextual panel' });
    const resource = within(rail).getByRole('button', { name: 'Resource' });
    const before = await settledWidth(() => mainWidth(canvasElement));

    await userEvent.click(resource);
    await waitFor(() =>
      expect(resource).toHaveAttribute('aria-pressed', 'true'),
    );
    const region = canvas.getByRole('region', {
      name: 'Contextual panel: Resource',
    });
    await expect(region).toBeVisible();
    await waitFor(() => expect(region).toHaveFocus());
    const opened = await settledWidth(() => mainWidth(canvasElement));
    await expect(opened).toBeLessThan(before);

    // The panel scrolls on its own; the page does not move.
    const scroller = region.querySelector<HTMLElement>(
      '[data-slot="contextual-panel-content"]',
    )!;
    scroller.scrollTop = 200;
    await expect(scroller.scrollTop).toBeGreaterThan(0);
    await expect(document.scrollingElement?.scrollTop ?? 0).toBe(0);

    // Keyboard resizing: arrows on the handle widen the panel.
    const handle = canvas.getByRole('separator', {
      name: 'Resize contextual panel',
    });
    handle.focus();
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}{ArrowLeft}');
    const widened = await settledWidth(() => mainWidth(canvasElement));
    await expect(widened).toBeLessThan(opened);

    // Collapsing returns focus to the rail and gives the room back.
    await userEvent.click(
      canvas.getByRole('button', { name: 'Collapse contextual panel' }),
    );
    await waitFor(() => expect(resource).toHaveFocus());
    await expect(
      await settledWidth(() => mainWidth(canvasElement)),
    ).toBeGreaterThan(widened);

    // Reopening restores the width chosen by resizing, within sub-pixel
    // rounding of the percentage layout.
    await userEvent.click(resource);
    await expect(
      Math.abs((await settledWidth(() => mainWidth(canvasElement))) - widened),
    ).toBeLessThan(4);
  },
};

/** Opened on the resource placeholder, for looking at the expanded layout. */
export const Expanded: Story = {
  play: async ({ canvasElement }) => {
    await laidOut(canvasElement);
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Resource' }));
    await expect(
      await canvas.findByRole('region', { name: 'Contextual panel: Resource' }),
    ).toBeVisible();
  },
};

/** The rail is one tab stop; arrow keys move along it and Enter chooses. */
export const KeyboardRail: Story = {
  play: async ({ canvasElement }) => {
    await laidOut(canvasElement);
    const canvas = within(canvasElement);
    const context = canvas.getByRole('button', { name: 'Context' });
    const resource = canvas.getByRole('button', { name: 'Resource' });
    context.focus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(resource).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() =>
      expect(resource).toHaveAttribute('aria-pressed', 'true'),
    );
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
    await expect(resource).not.toHaveFocus();
  },
};

/**
 * In a container too narrow for both regions (here 24rem), the expanded panel
 * takes the work area and the page beneath it is inert until it collapses.
 */
export const NarrowContainer: Story = {
  render: (args) => (
    <div className="flex h-svh w-96 border-r border-border">
      <ContextualPanelShell {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await laidOut(canvasElement);
    const canvas = within(canvasElement);
    const main = canvasElement.querySelector('[data-slot="contextual-main"]')!;
    await userEvent.click(canvas.getByRole('button', { name: 'Resource' }));
    await waitFor(() => expect(main).toHaveAttribute('inert'));
    await expect(
      await settledWidth(() => mainWidth(canvasElement)),
    ).toBeLessThan(1);
    await expect(
      canvas.queryByRole('separator', { name: 'Resize contextual panel' }),
    ).toBeNull();
    await userEvent.click(
      canvas.getByRole('button', { name: 'Collapse contextual panel' }),
    );
    await waitFor(() => expect(main).not.toHaveAttribute('inert'));
  },
};

/**
 * Inside the signed-in frame: the sidebar on the left, the app header and the
 * global panel above, and the contextual panel with its rail on the right,
 * mounted inside the work area by the view that owns it.
 */
export const InShell: Story = {
  render: (args) => (
    <div className="h-svh overflow-auto">
      <div className="flex h-full w-full min-w-5xl flex-col">
        <SidebarShell
          sidebar={<RootSidebar groups={sampleSidebarGroups} />}
          header={
            <header className="flex h-12 shrink-0 items-center justify-end border-b border-border px-2">
              <GlobalPanelToggle />
            </header>
          }
        >
          <ContextualPanelShell destinations={args.destinations}>
            {args.children}
          </ContextualPanelShell>
        </SidebarShell>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await laidOut(canvasElement);
    const canvas = within(canvasElement);
    // The rail sits outside the global panel, so choosing from it would close
    // an unlocked global panel (ADR-0011). Open the contextual panel first.
    await userEvent.click(canvas.getByRole('button', { name: 'Resource' }));
    await userEvent.click(
      canvas.getByRole('button', { name: 'Toggle global panel' }),
    );
    await expect(
      await canvas.findByRole('region', { name: 'Global panel' }),
    ).toBeVisible();
    await expect(
      await canvas.findByRole('region', { name: 'Contextual panel: Resource' }),
    ).toBeVisible();
  },
};

const columns = (grid: HTMLElement) =>
  getComputedStyle(grid).gridTemplateColumns.split(' ').length;

/**
 * The panel's content follows the panel, not the window: one column at the
 * first-open width, more as the panel is widened, and back when it narrows.
 */
export const PanelContentResponds: Story = {
  play: async ({ canvasElement }) => {
    await laidOut(canvasElement);
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Resource' }));
    const grid = await canvas.findByTestId('panel-grid');
    const main = canvasElement.querySelector<HTMLElement>(
      '[data-slot="contextual-main"]',
    )!;
    await settledWidth(() => main.getBoundingClientRect().width);
    await expect(columns(grid)).toBe(1);

    const handle = canvas.getByRole('separator', {
      name: 'Resize contextual panel',
    });
    handle.focus();
    // Widen a step at a time until the cards reflow; the panel's own width
    // decides, so a few steps past 28rem is enough.
    let steps = 0;
    while (columns(grid) === 1 && steps < 40) {
      await userEvent.keyboard('{ArrowLeft}');
      await settledWidth(() => main.getBoundingClientRect().width);
      steps += 1;
    }
    await expect(columns(grid)).toBeGreaterThan(1);

    // And back: narrowing the panel returns the content to one column.
    for (let back = 0; back < steps; back += 1)
      await userEvent.keyboard('{ArrowRight}');
    await settledWidth(() => main.getBoundingClientRect().width);
    await waitFor(() => expect(columns(grid)).toBe(1));
  },
};

/* ------------------------------------------------------------------------
 * Visual exploration: a proposed workspace inside the existing global shell.
 *
 * Existing global shell (unchanged): the sidebar with the context switcher,
 * the global header with breadcrumbs and the global panel toggle, and the
 * global panel, which opens downward from that header.
 * New, built in slice 1: the contextual panel with its rail.
 * Proposed, story only: the bounded workspace frame and its workspace header.
 * Placeholders (labelled): the Document body, the Dashboard canvas and the
 * resource shown in the panel.
 * --------------------------------------------------------------------- */

const exploreDestinations: ContextualPanelDestination[] = [
  destinations[0]!,
  {
    id: 'resource',
    label: 'Related resource',
    icon: FileText,
    content: <PlaceholderPanelResource />,
  },
];

const exploreSwitcher = (
  <ContextSwitcher
    current="Writing"
    icon={<PenLine className="size-4" />}
    options={[
      { label: 'Global', href: '#home' },
      { label: 'Writing', href: '#writing', active: true },
      { label: 'Client work', href: '#client-work' },
    ]}
    more={{ label: 'All spaces', href: '#spaces' }}
  />
);

function InGlobalShell({ kind }: { kind: 'document' | 'dashboard' }) {
  // The trail belongs to the workspace header; the global header gets none and
  // shows the Synapcity logo instead.
  const trail = [
    { label: 'Spaces', href: '#spaces', kind: 'collection' as const },
    { label: 'Writing', href: '#writing', kind: 'space' as const },
    { label: kind === 'document' ? 'Document title' : 'Dashboard title' },
  ];
  return (
    <div className="flex h-svh flex-col">
      <AuthenticatedShell
        account={{ homeHref: '#home', settingsHref: '#settings' }}
        sidebar={{ header: exploreSwitcher, groups: sampleSidebarGroups }}
        globalPanel={
          <p className="text-sm text-muted-foreground">
            The existing global panel, opened from the global header.
          </p>
        }
      >
        <ProposedWorkspace
          kind={kind}
          trail={trail}
          destinations={exploreDestinations}
        />
      </AuthenticatedShell>
    </div>
  );
}

/**
 * The proposed workspace around a Document placeholder. Drag the panel edge,
 * collapse it to the rail, open the global panel from the global header, fold
 * the sidebar, or narrow the window: the workspace stays one bounded surface.
 */
export const WorkspaceDocument: Story = {
  name: 'Workspace exploration: document',
  render: () => <InGlobalShell kind="document" />,
};

/** The same, around a Dashboard placeholder whose columns follow the main region. */
export const WorkspaceDashboard: Story = {
  name: 'Workspace exploration: dashboard',
  render: () => <InGlobalShell kind="dashboard" />,
};
