'use client';

import type { Breakpoint } from '@synapcity/domain-grids';
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@synapcity/frontend-ui/core/toggle-group';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@synapcity/frontend-ui/core/tooltip';
import {
  MonitorIcon,
  SmartphoneIcon,
  TabletIcon,
  type LucideIcon,
} from 'lucide-react';

import { useDashboardStore } from '../../store';

const OPTIONS: { value: Breakpoint; label: string; Icon: LucideIcon }[] = [
  { value: 'lg', label: 'Desktop layout', Icon: MonitorIcon },
  { value: 'md', label: 'Tablet layout', Icon: TabletIcon },
  { value: 'sm', label: 'Mobile layout', Icon: SmartphoneIcon },
];

/** Chooses which breakpoint's saved layout is shown and edited; each keeps its own. */
export function BreakpointToolbar() {
  const breakpoint = useDashboardStore((s) => s.breakpoint);
  const setBreakpoint = useDashboardStore((s) => s.setBreakpoint);
  return (
    <ToggleGroup
      aria-label="Layout breakpoint"
      variant="outline"
      spacing={0}
      value={[breakpoint]}
      onValueChange={(values: string[]) => {
        const next = values[0] as Breakpoint | undefined;
        if (next) setBreakpoint(next);
      }}
    >
      {OPTIONS.map(({ value, label, Icon }) => (
        <Tooltip key={value}>
          <TooltipTrigger
            render={<ToggleGroupItem value={value} aria-label={label} />}
          >
            <Icon />
          </TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
      ))}
    </ToggleGroup>
  );
}
