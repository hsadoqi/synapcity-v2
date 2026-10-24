import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, screen, userEvent, waitFor, within } from 'storybook/test';

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxVirtualList,
  useComboboxVirtualizer,
} from '@synapcity/frontend-ui/components/ui/combobox';

const meta: Meta<typeof Combobox> = {
  title: 'Components/Combobox',
  component: Combobox,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof Combobox>;

const zones = [
  'UTC',
  'America/New_York',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
];

const Example = ({ defaultValue }: { defaultValue?: string }) => (
  <Combobox items={zones} defaultValue={defaultValue}>
    <ComboboxInput
      aria-label="Timezone"
      placeholder="Search timezones…"
      className="w-48"
    />
    <ComboboxContent>
      <ComboboxEmpty>No timezone matches.</ComboboxEmpty>
      <ComboboxList>
        {(zone: string) => (
          <ComboboxItem key={zone} value={zone}>
            {zone}
          </ComboboxItem>
        )}
      </ComboboxList>
    </ComboboxContent>
  </Combobox>
);

export const Default: Story = {
  render: () => <Example />,
};

export const WithValue: Story = {
  render: () => <Example defaultValue="Europe/Paris" />,
};

export const Filtering: Story = {
  render: () => <Example />,
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole('combobox', {
      name: 'Timezone',
    });
    await userEvent.type(input, 'eur');
    const options = await screen.findAllByRole('option');
    await expect(options.map((option) => option.textContent)).toEqual([
      'Europe/London',
      'Europe/Paris',
    ]);
    // Base UI marks everything outside the open popup aria-hidden, including
    // the focusable trigger; close it so the a11y check sees the resting state.
    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.queryAllByRole('option')).toHaveLength(0),
    );
  },
};

const countries = Array.from(
  { length: 5000 },
  (_, index) => `Place ${index + 1}`,
);

/** Opt-in windowing: 5,000 options, only the rows in view are rendered. */
function VirtualizedDemo() {
  const virtualizer = useComboboxVirtualizer();
  return (
    <Combobox
      items={countries}
      virtualized
      onItemHighlighted={virtualizer.onItemHighlighted}
    >
      <ComboboxInput aria-label="Place" placeholder="Search 5,000 places" />
      <ComboboxContent>
        <ComboboxEmpty>No matches.</ComboboxEmpty>
        <ComboboxVirtualList virtualizer={virtualizer} aria-label="Places">
          {(item: string, index: number) => (
            <ComboboxItem key={item} value={item} index={index}>
              {item}
            </ComboboxItem>
          )}
        </ComboboxVirtualList>
      </ComboboxContent>
    </Combobox>
  );
}

export const Virtualized: Story = {
  render: () => <VirtualizedDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('combobox', { name: 'Place' }));
    await userEvent.keyboard('{ArrowDown}');
    const options = await screen.findAllByRole('option');
    await expect(options.length).toBeLessThan(60);
    await userEvent.keyboard('{ArrowDown>30/}');
    // Keyboard navigation scrolls the window so the highlighted row is rendered.
    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Place 30' })).toBeVisible(),
    );
    await userEvent.keyboard('{Escape}');
    // The list is checked at rest, once it has finished closing.
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
  },
};
