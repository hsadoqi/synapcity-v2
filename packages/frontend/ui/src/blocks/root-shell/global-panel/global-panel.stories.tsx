import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, screen, userEvent, waitFor, within } from 'storybook/test';
import {
  GlobalPanelShell,
  GlobalPanelToggle,
} from '@synapcity/frontend-ui/blocks/root-shell/global-panel';
import { Input } from '@synapcity/frontend-ui/core/input';
import { Button } from '@synapcity/frontend-ui/core/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@synapcity/frontend-ui/core/select';

const meta: Meta<typeof GlobalPanelShell> = {
  title: 'Blocks/GlobalPanel',
  component: GlobalPanelShell,
  parameters: { layout: 'fullscreen' },
  args: {
    header: (
      <header className="flex h-16 shrink-0 items-center border-b px-4">
        <GlobalPanelToggle />
      </header>
    ),
    children: (
      <main className="p-4">
        <h1 className="text-lg">Work area example</h1>
        <Button>Page action</Button>
      </main>
    ),
  },
  render: (args) => (
    <div className="flex h-svh flex-col">
      <GlobalPanelShell {...args} />
    </div>
  ),
};
export default meta;
type Story = StoryObj<typeof GlobalPanelShell>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button', { name: 'Toggle global panel' });
    await waitFor(() =>
      expect(toggle).toHaveAttribute('aria-expanded', 'false'),
    );
    await userEvent.click(toggle);
    await expect(
      await canvas.findByRole('region', { name: 'Global panel' }),
    ).toBeVisible();
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Lock global panel open' }),
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Page action' }));
    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(toggle).toHaveAttribute('aria-expanded', 'true'),
    );
    const close = canvas.getByRole('button', { name: 'Close global panel' });
    await userEvent.click(close);
    await waitFor(() => expect(toggle).toHaveFocus());
    await waitFor(() =>
      expect(toggle).toHaveAttribute('aria-expanded', 'false'),
    );
    await userEvent.click(toggle);
    await expect(
      await canvas.findByRole('button', { name: 'Lock global panel open' }),
    ).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(canvas.getByRole('button', { name: 'Page action' }));
    await waitFor(() =>
      expect(toggle).toHaveAttribute('aria-expanded', 'false'),
    );
  },
};

/** Disposable UI examples; no capture object or persistence is adopted. */
export const PreservesDraftAndPortaledSelect: Story = {
  args: {
    panel: (
      <div className="flex max-w-sm flex-col gap-4">
        <label htmlFor="panel-example-draft">
          Example draft
          <Input id="panel-example-draft" />
        </label>
        <Select>
          <SelectTrigger aria-label="Example choice">
            <SelectValue placeholder="Choose an example" />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value="one">Example one</SelectItem>
            <SelectItem value="two">Example two</SelectItem>
          </SelectContent>
        </Select>
      </div>
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button', { name: 'Toggle global panel' });
    await userEvent.click(toggle);
    await userEvent.type(
      await canvas.findByRole('textbox', { name: 'Example draft' }),
      'Keep this unfinished work',
    );
    const choice = canvas.getByRole('combobox', { name: 'Example choice' });
    choice.focus();
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(screen.getByRole('listbox')).toBeVisible());
    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Example one' })).toHaveFocus(),
    );
    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(toggle).toHaveAttribute('aria-expanded', 'true'),
    );
    await userEvent.click(
      canvas.getByRole('combobox', { name: 'Example choice' }),
    );
    await userEvent.click(
      await screen.findByRole('option', { name: 'Example two' }),
    );
    await waitFor(() =>
      expect(choice).toHaveAttribute('aria-expanded', 'false'),
    );
    await waitFor(() => expect(choice).toHaveFocus());
    await waitFor(() =>
      expect(toggle).toHaveAttribute('aria-expanded', 'true'),
    );
    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(toggle).toHaveAttribute('aria-expanded', 'false'),
    );
    await waitFor(() => expect(toggle).toHaveFocus());
    await userEvent.click(toggle);
    await expect(
      await canvas.findByRole('textbox', { name: 'Example draft' }),
    ).toHaveValue('Keep this unfinished work');
  },
};

export const IndependentScrolling: Story = {
  args: {
    panel: (
      <div className="flex flex-col gap-4">
        {Array.from({ length: 40 }, (_, i) => (
          <p key={i}>Panel example row {i + 1}</p>
        ))}
      </div>
    ),
    children: (
      <main className="flex flex-col gap-4 p-4">
        <h1 className="text-lg">Scrollable work area</h1>
        {Array.from({ length: 60 }, (_, i) => (
          <p key={i}>Work area example row {i + 1}</p>
        ))}
      </main>
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: 'Toggle global panel' }),
    );
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Lock global panel open' }),
    );
    const panelScroll = canvasElement.querySelector<HTMLElement>(
      '[data-slot="global-panel-scroll"]',
    )!;
    const pageScroll = canvasElement.querySelector<HTMLElement>(
      '[data-slot="shell-page"]',
    )!;
    panelScroll.scrollTop = 100;
    await expect(panelScroll.scrollTop).toBe(100);
    await expect(pageScroll.scrollTop).toBe(0);
    pageScroll.scrollTop = 150;
    await expect(pageScroll.scrollTop).toBe(150);
    await expect(document.documentElement.scrollTop).toBe(0);
  },
};

export const LockedHeaderVisibility: Story = {
  args: {
    header: (
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <GlobalPanelToggle />
        <Button>App header action</Button>
      </header>
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button', { name: 'Toggle global panel' });
    const header = canvas.getByRole('banner');
    await userEvent.click(toggle);
    const panel = await canvas.findByRole('region', { name: 'Global panel' });
    const panelHeight = panel.getBoundingClientRect().height;
    const workArea = canvasElement.querySelector<HTMLElement>(
      '[data-slot="shell-page"]',
    )!;
    const workHeight = workArea.getBoundingClientRect().height;
    await userEvent.click(
      canvas.getByRole('button', { name: 'Lock global panel open' }),
    );
    await expect(header).not.toBeVisible();
    await expect(
      toggle.closest('[data-slot="shell-app-header"]'),
    ).toHaveAttribute('inert');
    await waitFor(() =>
      expect(
        Math.abs(panel.getBoundingClientRect().height - panelHeight),
      ).toBeLessThan(1),
    );
    await waitFor(() =>
      expect(workArea.getBoundingClientRect().height).toBeGreaterThan(
        workHeight + 60,
      ),
    );
    const reveal = canvas.getByRole('button', { name: 'Show app header' });
    reveal.focus();
    await userEvent.keyboard('{Enter}');
    await expect(header).toBeVisible();
    await waitFor(() =>
      expect(
        Math.abs(panel.getBoundingClientRect().height - panelHeight),
      ).toBeLessThan(1),
    );
    await userEvent.click(
      canvas.getByRole('button', { name: 'App header action' }),
    );
    await expect(header).toBeVisible();
    await userEvent.click(
      canvas.getByRole('button', { name: 'Hide app header' }),
    );
    await expect(header).not.toBeVisible();
    await userEvent.click(
      canvas.getByRole('button', { name: 'Unlock global panel' }),
    );
    await expect(header).toBeVisible();
    await userEvent.click(
      canvas.getByRole('button', { name: 'Lock global panel open' }),
    );
    await expect(header).not.toBeVisible();
    await userEvent.click(
      canvas.getByRole('button', { name: 'Close global panel' }),
    );
    await waitFor(() => expect(header).toBeVisible());
    await waitFor(() => expect(toggle).toHaveFocus());
  },
};
