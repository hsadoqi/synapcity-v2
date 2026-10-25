import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CountdownCard, countdownCardDemo } from "./countdown-card";

// TODO: Refine, enhance with comprehensive stories
// TODO: Add comprehensive vitest tests

const meta: Meta<typeof CountdownCard> = {
    title: 'DateTime/CountdownCard',
    component: CountdownCard,
    parameters: {
        layout: 'centered'
    },
    args: {
        ...countdownCardDemo,
        surface: 'card',
        inverted: false,
        bordered: false
    }
}

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {}
}

export const WithDetails: Story = {
    args: {
        caption: 'Party time!'
    }
}

export const CardVariants: Story = {
    render: (args) => (
            <div className="flex items-center justify-between">
                <CountdownCard {...args}/>
                <CountdownCard {...args} surface="glass" />
            </div>
        )
}

export const InvertedCardVariants: Story = {
    render: (args) => (
            <div className="flex items-center justify-between">
                <CountdownCard {...args}/>
                <CountdownCard {...args} inverted />
            </div>
    )
}

export const BorderedCardVariants: Story = {
    render: (args) => (
            <div className="flex items-center justify-between">
                <CountdownCard {...args}/>
                <CountdownCard {...args} bordered />
            </div>
    )
}