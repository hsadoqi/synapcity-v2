import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DatePill, DatePillProps } from "./date-pill";

const date = new Date();
const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
const time = date.toLocaleTimeString()
const defaultDatePill: DatePillProps = {
    weekday,
    date: date.toLocaleDateString('en-US', {
        // weekday: "short",
        month: "short",
        day: "numeric"
    }),
    time,
    surface: 'card',
    bordered: false,
    inverted: false
}
const meta: Meta<typeof DatePill> = {
    title: "DateTime/DatePill",
    component: DatePill,
    parameters: {
        layout: 'centered'
    },
    args: {
        ...defaultDatePill
    }
}

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {}
}

export const PillVariants: Story = {
    render: (args) => (
            <div className="flex items-center justify-between whitespace-no-wrap">
                <DatePill {...args}/>
                <DatePill {...args} surface="glass" />
            </div>
        )
}

export const InvertedPillVariants: Story = {
    render: (args) => (
            <div className="flex items-center justify-between whitespace-no-wrap">
                <DatePill {...args}/>
                <DatePill {...args} inverted />
            </div>
    )
}

export const BorderedPillVariants: Story = {
    render: (args) => (
            <div className="flex items-center justify-between whitespace-no-wrap">
                <DatePill {...args}/>
                <DatePill {...args} bordered />
            </div>
    )
}