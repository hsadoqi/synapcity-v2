import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@synapcity/frontend-ui/core/accordion';

function Example(props: {
  defaultValue?: string[];
  multiple?: boolean;
  variant?: 'default' | 'flush';
}) {
  return (
    <Accordion {...props}>
      <AccordionItem value="one">
        <AccordionTrigger>First</AccordionTrigger>
        <AccordionContent>First panel</AccordionContent>
      </AccordionItem>
      <AccordionItem value="two">
        <AccordionTrigger variant="section">Second</AccordionTrigger>
        <AccordionContent>Second panel</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

const trigger = (name: string) => screen.getByRole('button', { name });

describe('Accordion', () => {
  it('starts closed, with each trigger inside a heading', () => {
    render(<Example />);

    expect(trigger('First').getAttribute('aria-expanded')).toBe('false');
    expect(trigger('First').closest('h3')).not.toBeNull();
    expect(screen.queryByText('First panel')).toBeNull();
  });

  it('opens and closes a panel from its trigger', () => {
    render(<Example />);

    fireEvent.click(trigger('First'));
    expect(trigger('First').getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('First panel')).toBeTruthy();

    fireEvent.click(trigger('First'));
    expect(trigger('First').getAttribute('aria-expanded')).toBe('false');
  });

  it('opens the items named in defaultValue', () => {
    render(<Example multiple defaultValue={['one', 'two']} />);

    expect(screen.getByText('First panel')).toBeTruthy();
    expect(screen.getByText('Second panel')).toBeTruthy();
  });

  it('keeps several open when multiple', () => {
    render(<Example multiple />);

    fireEvent.click(trigger('First'));
    fireEvent.click(trigger('Second'));

    expect(trigger('First').getAttribute('aria-expanded')).toBe('true');
    expect(trigger('Second').getAttribute('aria-expanded')).toBe('true');
  });

  it('marks the trigger variant, defaulting to default', () => {
    render(<Example />);

    expect(trigger('First').getAttribute('data-variant')).toBe('default');
    expect(trigger('Second').getAttribute('data-variant')).toBe('section');
  });

  it('draws its own box by default, and none when flush', () => {
    const { container, rerender } = render(<Example />);
    const root = () =>
      container.querySelector<HTMLElement>('[data-slot="accordion"]')!;

    expect(root().getAttribute('data-variant')).toBe('default');
    expect(root().className).toContain('border');

    rerender(<Example variant="flush" />);
    expect(root().getAttribute('data-variant')).toBe('flush');
    expect(root().className).not.toMatch(/\bborder\b|\brounded-md\b/);
  });
});
