import { Accordion as AccordionPrimitive } from '@base-ui/react/accordion';
import { cva, type VariantProps } from 'class-variance-authority';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';

import { cn } from '@synapcity/frontend-ui/lib/utils';

const accordionVariants = cva('group/accordion flex w-full flex-col', {
  variants: {
    variant: {
      default: 'overflow-hidden rounded-md border',
      // Inside a surface that already has an edge, such as a card: no box of
      // its own, only hairlines between sections, and items and panels line up
      // with the surface's own padding instead of adding theirs.
      flush: '',
    },
  },
  defaultVariants: { variant: 'default' },
});

function Accordion({
  className,
  variant = 'default',
  ...props
}: AccordionPrimitive.Root.Props & VariantProps<typeof accordionVariants>) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      data-variant={variant}
      className={cn(accordionVariants({ variant }), className)}
      {...props}
    />
  );
}

function AccordionItem({ className, ...props }: AccordionPrimitive.Item.Props) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn(
        'not-last:border-b data-open:bg-muted/50 group-data-[variant=flush]/accordion:data-open:bg-transparent',
        className,
      )}
      {...props}
    />
  );
}

const accordionTriggerVariants = cva(
  'group/accordion-trigger relative flex flex-1 items-start justify-between gap-6 border border-transparent text-left transition-all outline-none hover:underline aria-disabled:pointer-events-none aria-disabled:opacity-50 **:data-[slot=accordion-trigger-icon]:ml-auto **:data-[slot=accordion-trigger-icon]:size-4 **:data-[slot=accordion-trigger-icon]:text-muted-foreground',
  {
    variants: {
      variant: {
        default: 'p-2 text-xs/relaxed font-medium',
        // A titled group of a longer page, such as a settings section: reads as its heading.
        section: 'py-3 font-heading text-base font-semibold hover:no-underline',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

function AccordionTrigger({
  className,
  children,
  variant = 'default',
  ...props
}: AccordionPrimitive.Trigger.Props &
  VariantProps<typeof accordionTriggerVariants>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        data-variant={variant}
        className={cn(accordionTriggerVariants({ variant }), className)}
        {...props}
      >
        {children}
        <ChevronDownIcon
          data-slot="accordion-trigger-icon"
          className="pointer-events-none shrink-0 group-aria-expanded/accordion-trigger:hidden"
        />
        <ChevronUpIcon
          data-slot="accordion-trigger-icon"
          className="pointer-events-none hidden shrink-0 group-aria-expanded/accordion-trigger:inline"
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({
  className,
  children,
  ...props
}: AccordionPrimitive.Panel.Props) {
  return (
    <AccordionPrimitive.Panel
      data-slot="accordion-content"
      className="overflow-hidden px-2 text-xs/relaxed group-data-[variant=flush]/accordion:px-0 data-open:animate-accordion-down data-closed:animate-accordion-up"
      {...props}
    >
      <div
        className={cn(
          'h-(--accordion-panel-height) pt-0 pb-4 data-ending-style:h-0 data-starting-style:h-0 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4',
          className,
        )}
      >
        {children}
      </div>
    </AccordionPrimitive.Panel>
  );
}

export {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  accordionVariants,
  accordionTriggerVariants,
};
