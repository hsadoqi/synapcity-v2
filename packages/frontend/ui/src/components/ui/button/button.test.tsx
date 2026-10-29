import { Popover as PopoverPrimitive } from '@base-ui/react/popover';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Button, buttonVariants } from '@synapcity/frontend-ui/core/button';

describe('Button', () => {
  it('is named by its visible text unless given a label', () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });

    expect(button.hasAttribute('aria-label')).toBe(false);
  });

  it('uses the label as its accessible name', () => {
    render(<Button label="Save note">Save</Button>);

    expect(screen.getByRole('button', { name: 'Save note' })).toBeTruthy();
  });

  it('applies the default variant and size', () => {
    render(<Button>Save</Button>);

    expect(screen.getByRole('button').getAttribute('data-slot')).toBe('button');
  });

  it('never reports a pressed state; that is what Toggle is for', () => {
    render(<Button label="Save" />);
    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByRole('button').hasAttribute('aria-pressed')).toBe(false);
  });
});

describe('Button icon tooltip', () => {
  const hover = async (element: HTMLElement) => {
    await act(async () => {
      fireEvent.pointerEnter(element, { pointerType: 'mouse' });
      fireEvent.mouseEnter(element);
      fireEvent.mouseMove(element);
    });
  };

  it('names an icon button by its label and shows it on hover', async () => {
    render(
      <Button size="icon" label="Add item">
        <svg aria-hidden />
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Add item' });

    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(screen.queryByText('Add item')).toBeNull();
    await hover(button);
    expect(await screen.findByText('Add item')).toBeTruthy();
  });

  it('maps a text size to its icon size with iconOnly', () => {
    render(<Button size="sm" iconOnly label="Add" />);
    const classes = screen.getByRole('button').className.split(' ');

    expect(classes).toContain('size-6');
    expect(classes).not.toContain('h-6');
  });

  it('adds no tooltip to a text button or when turned off', async () => {
    render(
      <>
        <Button label="Text label">Save</Button>
        <Button size="icon" label="Off" tooltip={false} />
      </>,
    );
    for (const button of screen.getAllByRole('button')) await hover(button);
    await new Promise((resolve) => setTimeout(resolve, 800));

    expect(screen.queryByText('Text label')).toBeNull();
    expect(screen.queryByText('Off')).toBeNull();
  });

  it('keeps clicks working through the tooltip', () => {
    const onClick = vi.fn();
    render(<Button size="icon" label="Go" onClick={onClick} />);
    const button = screen.getByRole('button', { name: 'Go' });
    fireEvent.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(button.getAttribute('data-slot')).toBe('button');
  });

  it('still works as the render element of another trigger', async () => {
    render(
      <PopoverPrimitive.Root>
        <PopoverPrimitive.Trigger
          render={<Button size="icon" label="More" />}
        />
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Positioner>
            <PopoverPrimitive.Popup>Menu body</PopoverPrimitive.Popup>
          </PopoverPrimitive.Positioner>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>,
    );
    const button = screen.getByRole('button', { name: 'More' });

    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(button.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(button);
    expect(await screen.findByText('Menu body')).toBeTruthy();
    expect(button.getAttribute('aria-expanded')).toBe('true');
  });
});

describe('Button variants', () => {
  it('gives every variant its own classes', () => {
    const variants = [
      'default',
      'outline',
      'secondary',
      'selected',
      'ghost',
      'destructive',
      'link',
      'subtle',
    ] as const;
    const classes = variants.map((variant) => buttonVariants({ variant }));

    expect(new Set(classes).size).toBe(variants.length);
  });

  it('gives every size its own classes', () => {
    const sizes = [
      'xs',
      'sm',
      'default',
      'lg',
      'xl',
      'icon-xs',
      'icon-sm',
      'icon',
      'icon-lg',
      'icon-xl',
    ] as const;
    const classes = sizes.map((size) => buttonVariants({ size }));

    expect(new Set(classes).size).toBe(sizes.length);
  });

  it('falls back to the default variant and size', () => {
    expect(buttonVariants()).toBe(
      buttonVariants({ variant: 'default', size: 'default' }),
    );
  });

  it('appends a caller className last', () => {
    render(<Button className="w-full">Wide</Button>);

    expect(screen.getByRole('button').className.endsWith('w-full')).toBe(true);
  });

  it('forwards native attributes', () => {
    render(
      <Button type="submit" form="signup" data-testid="submit">
        Go
      </Button>,
    );
    const button = screen.getByTestId('submit');

    expect(button.getAttribute('type')).toBe('submit');
    expect(button.getAttribute('form')).toBe('signup');
  });

  it('fires onClick and respects disabled', () => {
    const onClick = vi.fn();
    const { rerender } = render(<Button onClick={onClick}>Go</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);

    rerender(
      <Button disabled onClick={onClick}>
        Go
      </Button>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
