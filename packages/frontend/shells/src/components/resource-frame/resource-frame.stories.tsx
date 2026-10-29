import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';
import {
  FileText,
  Link2,
  PanelRight,
  PenLine,
  Share2,
  Star,
} from 'lucide-react';
import { ModeProvider } from '@synapcity/frontend-preferences';
import { TooltipProvider } from '@synapcity/frontend-ui/core/tooltip';
import { cn } from '@synapcity/frontend-ui/lib/utils';

import { ResourceFrame, ResourceHeader } from '.';
import type { ContextualPanelDestination } from '../contextual-panel';
import { PlaceholderPanelResource } from '../../testing/review-placeholders';

/** Story content only: illustrative actions and destinations. */
const actions = [
  { label: 'Favourite', icon: <Star className="size-4" /> },
  { label: 'Copy link', icon: <Link2 className="size-4" /> },
  { label: 'Share', icon: <Share2 className="size-4" /> },
  { label: 'Rename' },
];

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
    id: 'related',
    label: 'Related resource',
    icon: FileText,
    content: <PlaceholderPanelResource />,
  },
];

const LONG_TITLE =
  'Quarterly planning notes for the garden, the studio and everything that has to happen before spring';

function Body() {
  return (
    <div className="mx-auto flex w-full max-w-prose flex-col gap-4 px-4 py-6">
      {Array.from({ length: 30 }, (_, index) => (
        <p key={index} className="text-sm text-muted-foreground">
          Paragraph {index + 1} of the resource body, long enough to scroll.
        </p>
      ))}
    </div>
  );
}

const meta: Meta<typeof ResourceFrame> = {
  title: 'Blocks/ResourceFrame',
  component: ResourceFrame,
  parameters: { layout: 'fullscreen' },
  argTypes: {
    header: { control: false },
    destinations: { control: false },
    children: { control: false },
  },
  args: {
    label: 'Garden plans',
    header: (
      <ResourceHeader
        title="Garden plans"
        icon={<PenLine className="size-4" />}
        actions={actions}
      />
    ),
    destinations,
    children: <Body />,
  },
  decorators: [
    (Story) => (
      <ModeProvider>
        <TooltipProvider>
          <Story />
        </TooltipProvider>
      </ModeProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ResourceFrame>;

/** The frame fills a container of a given width, as the work area would. */
const atWidth =
  (width: string): Story['render'] =>
  (args) => (
    <div className="h-svh overflow-auto">
      <div className={cn('flex h-full', width)}>
        <ResourceFrame {...args} />
      </div>
    </div>
  );

const visible = (element: Element) =>
  getComputedStyle(element).display !== 'none';

/** The body scrolls; the frame and the page around it do not. */
async function onlyBodyScrolls(canvasElement: HTMLElement) {
  const body = canvasElement.querySelector<HTMLElement>(
    '[data-slot="resource-body"]',
  )!;
  const frame = canvasElement.querySelector<HTMLElement>(
    '[data-slot="resource-frame"]',
  )!;
  await expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
  await expect(frame.scrollHeight).toBeLessThanOrEqual(frame.clientHeight);
}

/** Wide: every icon action shows as a button, the rest in "More actions". */
export const Wide: Story = {
  render: atWidth('w-350'),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('heading', { level: 1, name: 'Garden plans' }),
    ).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Share' })).toBeVisible();
    await expect(
      canvas.getByRole('toolbar', { name: 'Contextual panel' }),
    ).toBeVisible();
    await onlyBodyScrolls(canvasElement);
  },
};

export const Medium: Story = { render: atWidth('w-225') };

/** Narrow: the long title truncates to one line. */
export const Narrow: Story = {
  render: atWidth('w-120'),
  args: {
    label: LONG_TITLE,
    header: (
      <ResourceHeader
        title={LONG_TITLE}
        icon={<PenLine className="size-4" />}
        actions={actions}
      />
    ),
  },
  play: async ({ canvasElement }) => {
    const heading = within(canvasElement).getByRole('heading', { level: 1 });
    await expect(heading.scrollWidth).toBeGreaterThan(heading.clientWidth);
    await expect(heading.getBoundingClientRect().height).toBeLessThan(24);
    await onlyBodyScrolls(canvasElement);
  },
};

/** Very narrow: the icon actions fold into "More actions". */
export const VeryNarrow: Story = {
  render: atWidth('w-70'),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const share = canvasElement.querySelector('[aria-label="Share"]')!;
    await expect(visible(share)).toBe(false);
    await expect(
      canvas.getByRole('button', { name: 'More actions' }),
    ).toBeVisible();
  },
};

/** With no header: the frame holds only the body and its panel. */
export const WithoutHeader: Story = {
  render: atWidth('w-225'),
  args: { header: undefined },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole('heading')).toBeNull();
    await onlyBodyScrolls(canvasElement);
  },
};

/** With no destinations: no contextual panel or rail. */
export const WithoutPanel: Story = {
  render: atWidth('w-225'),
  args: { destinations: [] },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole('toolbar')).toBeNull();
  },
};
