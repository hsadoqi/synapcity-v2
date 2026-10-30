import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { PanelRight, PenLine } from 'lucide-react';
import { ModeProvider } from '@synapcity/frontend-preferences';
import { TooltipProvider } from '@synapcity/frontend-ui/core/tooltip';

import { RootContent } from '.';
import { ResourceFrame, ResourceHeader } from '../../resource-frame';

const meta: Meta<typeof RootContent> = {
  title: 'Blocks/RootContent',
  component: RootContent,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof RootContent>;

/** The page's single `main` landmark, and the target of the skip link. */
export const Default: Story = {
  args: { children: <p className="text-xs">Page content</p> },
};

/** One word with no break opportunity, wider than a phone. */
const UNBROKEN_TITLE =
  'Supercalifragilisticexpialidocious-onboarding-guide-rewrite-chapter-by-chapter-with-every-open-question-unsettled';

/** Whether `inner`'s box lies inside `outer`'s, to half a pixel. */
async function expectInside(inner: Element, outer: Element) {
  const a = inner.getBoundingClientRect();
  const b = outer.getBoundingClientRect();
  await expect(a.left).toBeGreaterThanOrEqual(b.left - 0.5);
  await expect(a.right).toBeLessThanOrEqual(b.right + 0.5);
}

/**
 * A resource with a long unbroken name in a phone-width work area: `main`
 * keeps its container's width, so the frame stays inside it, the heading
 * truncates, and an opened panel takes the whole area (the container is
 * below the panel's side-by-side width).
 */
export const LongResourceNameInNarrowContainer: Story = {
  render: () => (
    <ModeProvider>
      <TooltipProvider>
        <div data-testid="work-area" className="flex h-svh w-96 flex-col">
          <RootContent>
            <ResourceFrame
              label={UNBROKEN_TITLE}
              header={
                <ResourceHeader
                  title={UNBROKEN_TITLE}
                  icon={<PenLine className="size-4" />}
                />
              }
              destinations={[
                {
                  id: 'context',
                  label: 'Context',
                  icon: PanelRight,
                  content: (
                    <p className="p-4 text-sm text-muted-foreground">
                      Context for this resource.
                    </p>
                  ),
                },
              ]}
            >
              <p className="p-4 text-sm">The resource body.</p>
            </ResourceFrame>
          </RootContent>
        </div>
      </TooltipProvider>
    </ModeProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const area = canvas.getByTestId('work-area');
    const main = canvas.getByRole('main');
    const frame = canvasElement.querySelector('[data-slot="resource-frame"]')!;
    const header = canvasElement.querySelector(
      '[data-slot="resource-header"]',
    )!;
    const heading = canvas.getByRole('heading', {
      level: 1,
      name: UNBROKEN_TITLE,
    });

    await expectInside(main, area);
    await expectInside(frame, main);
    await expectInside(header, frame);
    await expectInside(heading, header);
    await expect(heading.scrollWidth).toBeGreaterThan(heading.clientWidth);

    await userEvent.click(canvas.getByRole('button', { name: 'Context' }));
    const shell = canvasElement.querySelector(
      '[data-slot="contextual-panel-shell"]',
    )!;
    await waitFor(() =>
      expect(shell.getAttribute('data-contextual-panel')).toBe('open'),
    );
    await expect(shell.hasAttribute('data-narrow')).toBe(true);
    await expect(
      canvasElement
        .querySelector('[data-slot="contextual-main"]')!
        .hasAttribute('inert'),
    ).toBe(true);
    await expectInside(frame, main);
    await expectInside(
      canvasElement.querySelector('[data-contextual-panel-region]')!,
      frame,
    );
  },
};
