import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, screen, userEvent, within } from 'storybook/test';

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@synapcity/frontend-ui/core/combobox';

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
  },
};
