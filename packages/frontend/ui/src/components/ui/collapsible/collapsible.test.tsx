import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleIcon,
  CollapsibleTrigger,
} from '@synapcity/frontend-ui/core/collapsible';

function Example(props: {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  keepMounted?: boolean;
  disabled?: boolean;
}) {
  const { keepMounted, ...root } = props;
  return (
    <Collapsible {...root}>
      <CollapsibleTrigger>
        Details
        <CollapsibleIcon />
      </CollapsibleTrigger>
      <CollapsibleContent keepMounted={keepMounted}>
        <input aria-label="Inside" />
      </CollapsibleContent>
    </Collapsible>
  );
}

const trigger = () => screen.getByRole('button', { name: 'Details' });

describe('Collapsible', () => {
  it('starts closed and opens when the trigger is pressed', () => {
    render(<Example />);

    expect(trigger().getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('textbox', { name: 'Inside' })).toBeNull();

    fireEvent.click(trigger());

    expect(trigger().getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('textbox', { name: 'Inside' })).toBeTruthy();
  });

  it('points the trigger at the content it controls', () => {
    render(<Example defaultOpen />);

    const controls = trigger().getAttribute('aria-controls');
    expect(controls).toBeTruthy();
    expect(document.getElementById(controls!)?.dataset.slot).toBe(
      'collapsible-content',
    );
  });

  it('keeps hidden content in the document with keepMounted', () => {
    render(<Example keepMounted />);

    const input = screen.getByLabelText('Inside', { selector: 'input' });
    expect(input.closest('[hidden]')).not.toBeNull();
  });

  it('reports toggles to a controlled owner and follows its open prop', () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <Example open={false} onOpenChange={onOpenChange} />,
    );

    fireEvent.click(trigger());

    expect(onOpenChange).toHaveBeenCalledWith(true, expect.anything());
    expect(trigger().getAttribute('aria-expanded')).toBe('false');

    rerender(<Example open onOpenChange={onOpenChange} />);
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
  });

  it('hides its chevron from assistive tech so the trigger reads as its text', () => {
    render(<Example />);

    const icon = document.querySelector('[data-slot="collapsible-icon"]');
    expect(icon?.getAttribute('aria-hidden')).toBe('true');
    expect(trigger().textContent?.trim()).toBe('Details');
  });

  it('does not toggle while disabled', () => {
    render(<Example disabled />);

    fireEvent.click(trigger());

    expect(trigger().getAttribute('aria-expanded')).toBe('false');
  });
});
