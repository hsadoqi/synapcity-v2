import { fireEvent, render, screen } from '@testing-library/react';
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

  it('opts into a toggle without nesting buttons', () => {
    const onPressedChange = vi.fn();
    render(
      <Button toggle label="Pin" onPressedChange={onPressedChange}>
        Pin
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Pin' });

    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(button.textContent).toBe('Pin');
    expect(button.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(button);
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(onPressedChange).toHaveBeenCalledWith(true, expect.any(Object));
    fireEvent.click(button);
    expect(button.getAttribute('aria-pressed')).toBe('false');
  });

  it('keeps ordinary buttons free of toggle state', () => {
    render(<Button label="Save" />);
    expect(screen.getByRole('button').hasAttribute('aria-pressed')).toBe(false);
  });

  it('does not toggle when disabled', () => {
    const onPressedChange = vi.fn();
    render(
      <Button toggle disabled label="Pin" onPressedChange={onPressedChange} />,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onPressedChange).not.toHaveBeenCalled();
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

  it('supports a controlled pressed state', () => {
    const { rerender } = render(<Button toggle pressed={false} label="Pin" />);
    expect(screen.getByRole('button').getAttribute('aria-pressed')).toBe(
      'false',
    );

    rerender(<Button toggle pressed label="Pin" />);
    expect(screen.getByRole('button').getAttribute('aria-pressed')).toBe(
      'true',
    );
  });
});
