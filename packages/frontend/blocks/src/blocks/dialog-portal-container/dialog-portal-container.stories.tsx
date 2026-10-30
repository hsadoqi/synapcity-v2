import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, screen, userEvent, waitFor, within } from 'storybook/test';

import { Button } from '@synapcity/frontend-ui/core/button';
import { DialogPortalContainer } from '@/blocks/dialog-portal-container';

const longBody = (
  <div className="flex flex-col gap-2 pr-3 text-sm text-muted-foreground">
    {Array.from({ length: 30 }, (_, i) => (
      <p key={i}>Setting row {i + 1}</p>
    ))}
  </div>
);

const meta = {
  title: 'Components/Dialog Portal Container',
  component: DialogPortalContainer,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    trigger: <Button variant="outline">Open dialog</Button>,
    title: 'Settings',
    description: 'Configure this block.',
    children: <p className="text-sm">Dialog body.</p>,
  },
  argTypes: {
    container: { control: 'select', options: ['inline', 'body'] },
    width: { control: 'select', options: ['sm', 'md', 'lg', 'full'] },
    height: { control: 'select', options: ['sm', 'md', 'lg', 'full'] },
    modal: { control: 'select', options: [true, false, 'trap-focus'] },
    overlay: { control: 'boolean' },
    showCloseButton: { control: 'boolean' },
    scrollable: { control: 'boolean' },
    trigger: { control: false },
    footer: { control: false },
  },
} satisfies Meta<typeof DialogPortalContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

const open = async (canvasElement: HTMLElement) => {
  await userEvent.click(
    within(canvasElement).getByRole('button', { name: 'Open dialog' }),
  );
  return screen.findByRole('dialog');
};

export const Default: Story = {};

/** Inline is the default: the dialog renders inside its scope and takes that scope's theme. */
export const InheritsLocalTheme: Story = {
  render: (args) => (
    <div className="theme-dark dark:theme-light rounded-xl bg-background p-6 text-foreground">
      <DialogPortalContainer {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const dialog = await open(canvasElement);
    expect(canvasElement.contains(dialog)).toBe(true);
  },
};

export const RenderedInBody: Story = {
  args: { container: 'body' },
  play: async ({ canvasElement }) => {
    const dialog = await open(canvasElement);
    expect(canvasElement.contains(dialog)).toBe(false);
  },
};

export const Scrollable: Story = {
  args: { scrollable: true, children: longBody },
  play: async ({ canvasElement }) => {
    const dialog = await open(canvasElement);
    await waitFor(() => {
      const viewport = dialog.querySelector(
        '[data-slot="scroll-area-viewport"]',
      );
      expect(viewport).not.toBeNull();
      expect(viewport!.scrollHeight).toBeGreaterThan(viewport!.clientHeight);
      expect(dialog.getBoundingClientRect().height).toBeLessThanOrEqual(
        window.innerHeight,
      );
    });
  },
};

export const WithFooter: Story = {
  args: {
    footer: (
      <>
        <Button variant="outline">Cancel</Button>
        <Button>Save</Button>
      </>
    ),
  },
};

export const NonModalWithoutOverlay: Story = {
  args: { modal: false, overlay: false },
};

export const Large: Story = {
  args: { width: 'lg', height: 'lg', scrollable: true, children: longBody },
};

/** No `height` set: the dialog is as tall as its content, with no cap. */
export const DefaultHasNoHeightCap: Story = {
  args: { container: 'body' },
  play: async ({ canvasElement }) => {
    const dialog = await open(canvasElement);
    await expect(getComputedStyle(dialog).maxHeight).toBe('none');
  },
};

/**
 * A class that is not in the stylesheet does nothing and nothing says so: the
 * old `sm:max-h-sm` was exactly that. Every `sm:max-*` class on the dialog must
 * have a rule in a loaded stylesheet, whatever the window width.
 */
const hasRule = (selector: string, rules: CSSRuleList): boolean =>
  [...rules].some((rule) => {
    if (rule instanceof CSSStyleRule && rule.selectorText === selector)
      return true;
    // Media queries and layers nest rules.
    return (
      'cssRules' in rule && hasRule(selector, rule.cssRules as CSSRuleList)
    );
  });

export const PresetClassesExist: Story = {
  args: { container: 'body', width: 'md', height: 'md' },
  play: async ({ canvasElement }) => {
    const dialog = await open(canvasElement);
    const sized = [...dialog.classList].filter((name) =>
      /^sm:max-[wh]-/.test(name),
    );
    await expect(sized).toEqual(
      expect.arrayContaining(['sm:max-w-md', 'sm:max-h-112']),
    );
    for (const name of sized) {
      const found = [...document.styleSheets].some((sheet) => {
        try {
          return hasRule(`.${CSS.escape(name)}`, sheet.cssRules);
        } catch {
          return false; // a cross-origin sheet cannot be read
        }
      });
      await expect(found, `${name} has a rule`).toBe(true);
    }
  },
};

/** A number is a percentage of the containing block: here the viewport, so 40 is 40vw and 50 is 50vh. */
export const NumericSize: Story = {
  args: {
    container: 'body',
    width: 40,
    height: 50,
    scrollable: true,
    children: longBody,
  },
  play: async ({ canvasElement }) => {
    const dialog = await open(canvasElement);
    await waitFor(() => {
      const rect = dialog.getBoundingClientRect();
      expect(Math.abs(rect.width - window.innerWidth * 0.4)).toBeLessThan(2);
      expect(Math.abs(rect.height - window.innerHeight * 0.5)).toBeLessThan(2);
    });
  },
};

/**
 * `full` grows to the container it renders in instead of being capped. Here
 * the container is a `contain-layout` box, which becomes the dialog's
 * containing block, so the dialog covers exactly that box.
 */
export const FullFillsItsContainer: Story = {
  args: { width: 'full', height: 'full', children: <p>Fills the box.</p> },
  render: (args) => (
    <div
      data-testid="box"
      className="relative h-72 w-96 contain-layout rounded-xl border border-border"
    >
      <DialogPortalContainer {...args} container="inline" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const box = within(canvasElement).getByTestId('box');
    const dialog = await open(canvasElement);
    await waitFor(() => {
      // A containing block is the padding box, so the dialog covers the box
      // inside its 1px border: `clientWidth`, not the border box.
      const inner = dialog.getBoundingClientRect();
      expect(Math.abs(inner.width - box.clientWidth)).toBeLessThan(1);
      expect(Math.abs(inner.height - box.clientHeight)).toBeLessThan(1);
    });
    // The body is the flex child that takes what the header leaves.
    await expect(screen.getByText('Fills the box.').parentElement).toHaveClass(
      'flex-1',
    );
  },
};

/** Capped and not scrollable: the dialog scrolls itself rather than spilling. */
export const CappedScrollsItself: Story = {
  args: { container: 'body', height: 50, children: longBody },
  play: async ({ canvasElement }) => {
    const dialog = await open(canvasElement);
    await waitFor(() => {
      expect(dialog.scrollHeight).toBeGreaterThan(dialog.clientHeight);
      expect(dialog.getBoundingClientRect().height).toBeLessThanOrEqual(
        window.innerHeight * 0.5 + 2,
      );
    });
  },
};
