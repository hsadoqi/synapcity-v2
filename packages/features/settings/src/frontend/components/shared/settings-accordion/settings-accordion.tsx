'use client';

import {
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Accordion,
} from '@synapcity/frontend-ui/core/accordion';
import { ReactNode, Children, isValidElement, useState } from 'react';

type SettingsAccordionItemProps = {
  /** Unique within its accordion; keeps the section's open state. */
  value: string;
  title: string;
  children: ReactNode;
};

/**
 * One collapsible section of a settings tab. Its trigger sits in an h3, the same
 * level a `SettingsSection` title takes, and the panel is a region named by it.
 * Rendered only inside `SettingsAccordion`.
 */
export function SettingsAccordionItem({
  value,
  title,
  children,
}: SettingsAccordionItemProps) {
  return (
    <AccordionItem value={value}>
      <AccordionTrigger variant="section">{title}</AccordionTrigger>
      <AccordionContent className="flex flex-col gap-6">
        {children}
      </AccordionContent>
    </AccordionItem>
  );
}

/**
 * The sections of a settings tab, each collapsible on its own. Every section
 * starts open: collapsing is for tidying a long tab, never for hiding a setting
 * someone has not seen yet. Open state lasts while the tab is mounted.
 */
export function SettingsAccordion({ children }: { children: ReactNode }) {
  // Conditional sections (`{flag && <SettingsAccordionItem … />}`) and anything
  // that is not a section drop out here.
  const values = Children.toArray(children).flatMap((child) =>
    isValidElement<Partial<SettingsAccordionItemProps>>(child) &&
    typeof child.props.value === 'string'
      ? [child.props.value]
      : [],
  );
  // Tracks what was closed rather than what is open, so a section that appears
  // later (one shown once the account loads) also starts open.
  const [closed, setClosed] = useState<ReadonlySet<string>>(new Set());
  return (
    // Flush: the tab's card is already the box, so the sections are divided by
    // hairlines rather than drawn as a second box inside it.
    <Accordion
      variant="flush"
      multiple
      value={values.filter((value) => !closed.has(value))}
      onValueChange={(open) =>
        setClosed(new Set(values.filter((value) => !open.includes(value))))
      }
    >
      {children}
    </Accordion>
  );
}
