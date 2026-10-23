import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, within } from 'storybook/test';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@synapcity/frontend-ui/core/accordion';

const meta: Meta<typeof Accordion> = {
  title: 'Components/Accordion',
  component: Accordion,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Accordion>;

const items = [
  ['shipping', 'Shipping', 'Orders ship within two working days.'],
  ['returns', 'Returns', 'Return anything unused within 30 days.'],
  ['support', 'Support', 'Write to us any time; we answer within a day.'],
] as const;

export const Default: Story = {
  render: (args) => (
    <Accordion {...args} className="max-w-md">
      {items.map(([value, title, body]) => (
        <AccordionItem key={value} value={value}>
          <AccordionTrigger>{title}</AccordionTrigger>
          <AccordionContent>{body}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  ),
};

export const Multiple: Story = {
  ...Default,
  args: { multiple: true, defaultValue: ['shipping', 'returns'] },
};

/** The section trigger, for titled groups on a longer page such as settings. */
export const Sections: Story = {
  args: { multiple: true, defaultValue: ['shipping'] },
  render: (args) => (
    <Accordion {...args} className="max-w-md">
      {items.map(([value, title, body]) => (
        <AccordionItem key={value} value={value} className="px-4">
          <AccordionTrigger variant="section">{title}</AccordionTrigger>
          <AccordionContent>{body}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  ),
};

/**
 * Flush, inside a surface that already has an edge (here a card): no box of its
 * own and no fill when open, only hairlines between the sections.
 */
export const Flush: Story = {
  args: { variant: 'flush', multiple: true, defaultValue: ['shipping'] },
  render: (args) => (
    <div className="max-w-md rounded-lg border bg-card px-6">
      <Accordion {...args}>
        {items.map(([value, title, body]) => (
          <AccordionItem key={value} value={value}>
            <AccordionTrigger variant="section">{title}</AccordionTrigger>
            <AccordionContent>{body}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  ),
};

/** Clicking a trigger opens its panel; the play function proves it end to end. */
export const Opens: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Returns' });

    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(
      await canvas.findByText('Return anything unused within 30 days.'),
    ).toBeVisible();
  },
};
