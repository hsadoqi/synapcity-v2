import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from 'cn';

const badgeVariants = cva(
  'group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 py-0.5 text-[0.625rem] font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-2.5!',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground [a]:hover:bg-primary/80',
        secondary:
          'bg-secondary-foreground text-secondary-background [a]:hover:bg-secondary-foreground/80 [a]:hover:text-secondary-foreground',
        destructive:
          'bg-destructive-foreground text-destructive-background [a]:hover:bg-destructive-foreground/20',
        outline:
          'border-border bg-input-foreground/20 text-foreground dark:bg-input-foreground/30 [a]:hover:bg-muted-foreground [a]:hover:text-muted-background dark:[a]:hover:bg-muted-foreground/30 dark:[a]:hover:text-muted-background/30',
        ghost:
          'hover:bg-muted-foreground hover:text-muted-background dark:hover:bg-muted-foreground/50',
        link: 'bg-transparent text-base-foreground hover:text-primary-foreground underline-offset-4 hover:underline',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function Badge({
  className,
  variant = 'default',
  render,
  ...props
}: useRender.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: 'span',
    props: mergeProps<'span'>(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props,
    ),
    render,
    state: {
      slot: 'badge',
      variant,
    },
  });
}

export { Badge, badgeVariants };
