'use client';

import { Toggle as TogglePrimitive } from '@base-ui/react/toggle';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from 'cn';

const toggleVariants = cva(
  "group/toggle inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-transparent text-xs font-medium whitespace-nowrap text-muted-foreground transition-[color,background-color,border-color] duration-150 ease-out outline-none select-none hover:bg-hover hover:text-foreground active:bg-pressed aria-pressed:bg-pressed aria-pressed:text-foreground focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        outline:
          'border-border bg-transparent hover:border-foreground/40 aria-pressed:border-foreground/40',
        ghost: 'bg-transparent',
        destructive:
          'bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive aria-pressed:bg-destructive/25 aria-pressed:text-destructive focus-visible:outline-destructive dark:bg-destructive/20 dark:hover:bg-destructive/30',
      },
      size: {
        default:
          'h-7 min-w-7 pointer-coarse:h-11 pointer-coarse:min-w-11 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
        sm: "h-6 min-w-6 pointer-coarse:h-11 pointer-coarse:min-w-11 rounded-sm px-2 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        lg: "h-8 min-w-8 pointer-coarse:h-12 pointer-coarse:min-w-12 px-3 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-4",
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Toggle({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: TogglePrimitive.Props & VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Toggle, toggleVariants };
