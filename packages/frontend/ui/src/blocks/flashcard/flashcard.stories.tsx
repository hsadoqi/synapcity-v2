import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Flashcard } from '@synapcity/frontend-ui/blocks/flashcard';

const meta = {
  title: 'Blocks/Flashcard',
  component: Flashcard,
  parameters: { layout: 'centered' },
  args: {
    deck: 'Spanish vocab',
    due: '12 due today',
    cards: [
      { front: 'resolver', status: 'review' },
      { front: 'compartir', status: 'learning' },
      { front: 'bienvenida', status: 'mastered' },
    ],
    bordered: false,
  },
} satisfies Meta<typeof Flashcard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Bordered: Story = { args: { bordered: true } };

export const AllStatuses: Story = {
  args: {
    cards: [
      { front: 'hola', status: 'new' },
      { front: 'compartir', status: 'learning' },
      { front: 'resolver', status: 'review' },
      { front: 'bienvenida', status: 'mastered' },
    ],
  },
};

export const Empty: Story = { args: { cards: [] } };
