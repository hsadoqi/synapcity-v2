import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@synapcity/frontend-ui/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@synapcity/frontend-ui/core/tooltip';

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding text-xs/relaxed font-medium whitespace-nowrap cursor-pointer transition-[color,background-color,border-color,box-shadow,translate] duration-150 ease-out outline-none select-none focus-visible:border-ring focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          'bg-primary-foreground text-primary-background hover:bg-fill-hover active:bg-fill-pressed aria-expanded:bg-fill-hover aria-pressed:bg-fill-hover',
        outline:
          'border border-border bg-primary-background hover:border-foreground/40 hover:bg-hover hover:text-foreground active:bg-pressed aria-expanded:bg-hover aria-expanded:text-foreground aria-pressed:bg-hover aria-pressed:text-foreground dark:bg-input/30',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary-hover active:bg-secondary-pressed aria-expanded:bg-secondary-hover aria-expanded:text-secondary-foreground aria-pressed:bg-secondary-hover aria-pressed:text-secondary-foreground',
        // The current location in a set of links. An underline, not a fill: on
        // the page background `bg-selected` resolves to the page colour itself,
        // and a fill would read as the hover state besides.
        selected:
          'text-foreground underline decoration-2 underline-offset-4 hover:bg-hover active:bg-pressed',
        ghost:
          'bg-transparent text-foreground hover:bg-hover active:bg-pressed aria-expanded:bg-hover aria-expanded:text-foreground aria-pressed:bg-hover aria-pressed:text-foreground',
        destructive:
          'bg-destructive/10 text-destructive hover:bg-destructive/25 active:bg-destructive/35 focus-visible:border-destructive/40 focus-visible:outline-destructive dark:bg-destructive/20 dark:hover:bg-destructive/30',
        link: 'text-link underline-offset-4 hover:underline hover:decoration-2 active:opacity-70',
        // A quiet secondary action beside content, such as resetting one
        // setting: muted until pointed at, never competing with the control.
        subtle:
          'text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground hover:decoration-current active:opacity-70',
      },
      size: {
        default:
          "h-7 pointer-coarse:h-11 gap-1.5 px-2.5 text-xs/relaxed has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        xs: "h-5 pointer-coarse:h-11 gap-1 rounded-sm px-2 text-2xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-2.5",
        sm: "h-6 pointer-coarse:h-11 gap-1 px-2 text-xs/relaxed has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        lg: "h-8 pointer-coarse:h-12 gap-1.5 px-3 text-xs/relaxed has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-4",
        xl: "h-9 pointer-coarse:h-12 gap-1.5 px-3 text-xs/relaxed has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-4",
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
  VariantProps<typeof buttonVariants> & {
    className?: string;
    iconOnly?: boolean;
    label?: string;
    /** Icon buttons show `label` in a tooltip. Pass false when the button already sits inside another Tooltip. */
    tooltip?: boolean;
  };
type ButtonSize = ButtonProps['size'];
type ButtonVariant = ButtonProps['variant'];

function Button({
  className,
  label,
  variant = 'default',
  size = 'default',
  iconOnly = false,
  tooltip = true,
  ...props
}: ButtonProps) {
  const isIcon = !!iconOnly || size?.includes('icon');
  const iconSizes: Partial<
    Record<NonNullable<ButtonSize>, NonNullable<ButtonSize>>
  > = {
    xs: 'icon-xs',
    sm: 'icon-sm',
    default: 'icon',
    lg: 'icon-lg',
    xl: 'icon-xl',
  };
  const buttonSize: ButtonSize = isIcon
    ? (iconSizes[size ?? 'default'] ?? size ?? 'icon')
    : size;
  const button = (
    <ButtonPrimitive
      data-slot="button"
      aria-label={label}
      className={cn(buttonVariants({ variant, size: buttonSize, className }))}
      {...props}
    />
  );

  if (!isIcon || !label || !tooltip) return button;

  return (
    <Tooltip>
      <TooltipTrigger render={button} />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export { Button, buttonVariants };
export type { ButtonProps, ButtonVariant, ButtonSize };
