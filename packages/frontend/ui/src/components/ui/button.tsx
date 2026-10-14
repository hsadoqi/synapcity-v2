import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { Toggle as TogglePrimitive } from '@base-ui/react/toggle';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/utils';

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding text-xs/relaxed font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          'bg-primary-foreground text-primary-background hover:bg-fill-hover active:bg-fill-pressed aria-expanded:bg-fill-hover aria-pressed:bg-fill-hover',
        outline:
          'border-1 border-border bg-primary-background hover:border-foreground/40 hover:bg-hover hover:text-foreground active:bg-pressed aria-expanded:bg-hover aria-expanded:text-foreground aria-pressed:bg-hover aria-pressed:text-foreground dark:bg-input/30',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary-hover active:bg-secondary-pressed aria-expanded:bg-secondary-hover aria-expanded:text-secondary-foreground aria-pressed:bg-secondary-hover aria-pressed:text-secondary-foreground',
        // The current location in a set of links: the same solid mix of page
        // and primary that marks a selected row, so the primary marks what is active.
        selected: 'bg-selected text-foreground',
        ghost:
          'bg-transparent text-foreground hover:bg-hover active:bg-pressed aria-expanded:bg-hover aria-expanded:text-foreground aria-pressed:bg-hover aria-pressed:text-foreground',
        destructive:
          'bg-destructive/10 text-destructive hover:bg-destructive/25 active:bg-destructive/35 focus-visible:border-destructive/40 focus-visible:outline-destructive dark:bg-destructive/20 dark:hover:bg-destructive/30',
        link: 'text-link underline-offset-4 hover:underline hover:decoration-2 active:opacity-70',
      },
      size: {
        default:
          "h-7 pointer-coarse:h-11 gap-1 px-2 text-xs/relaxed has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        xs: "h-5 pointer-coarse:h-11 gap-1 rounded-sm px-2 text-[0.625rem] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-2.5",
        sm: "h-6 pointer-coarse:h-11 gap-1 px-2 text-xs/relaxed has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        lg: "h-8 pointer-coarse:h-12 gap-1 px-2.5 text-xs/relaxed has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-4",
        'icon-xs':
          "size-5 pointer-coarse:size-11 rounded-sm [&_svg:not([class*='size-'])]:size-2.5",
        'icon-sm':
          "size-6 pointer-coarse:size-11 [&_svg:not([class*='size-'])]:size-3",
        icon: "size-7 pointer-coarse:size-11 [&_svg:not([class*='size-'])]:size-3.5",
        'icon-lg':
          "size-8 pointer-coarse:size-12 [&_svg:not([class*='size-'])]:size-4",
        'icon-xl':
          "size-10 pointer-coarse:size-12 [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

type ButtonProps = ButtonPrimitive.Props &
  Pick<
    TogglePrimitive.Props,
    'pressed' | 'defaultPressed' | 'onPressedChange'
  > &
  VariantProps<typeof buttonVariants> & {
    /**
     * Accessible name that replaces the visible text. Set it only for
     * icon-only buttons: on a button with text it overrides that text, so
     * a changing label such as "Signing in…" would never be announced.
     */
    label?: string;
    toggle?: boolean;
  };
type ButtonVariant = VariantProps<typeof buttonVariants>['variant'];
type ButtonSize = VariantProps<typeof buttonVariants>['size'];

function Button({
  className,
  variant = 'default',
  size = 'default',
  label,
  toggle = false,
  pressed,
  defaultPressed,
  onPressedChange,
  ...props
}: ButtonProps) {
  const button = (
    <ButtonPrimitive
      data-slot="button"
      aria-label={label}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );

  return toggle ? (
    <TogglePrimitive
      pressed={pressed}
      defaultPressed={defaultPressed}
      onPressedChange={onPressedChange}
      disabled={props.disabled}
      nativeButton={props.nativeButton}
      render={button}
    />
  ) : (
    button
  );
}

export { Button, buttonVariants };
export type { ButtonProps, ButtonVariant, ButtonSize };
