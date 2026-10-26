'use client';

import { JSX, useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@synapcity/frontend-ui/lib/utils';
import {
  surfaceClasses,
  type Surface,
} from '@synapcity/frontend-ui/lib/surface';

// interface SettingRow {
//   label: string;
//   value: string;
// }

type SectionRow = { label: string; value: string };

type Section = {
  label: string;
  rows: SectionRow[];
};

interface StyleProps {
  surface?: Surface;
  bordered?: boolean;
  inverted?: boolean;
  className?: string;
}

interface MotionPanelProps extends StyleProps {
  sectionLabel?: string;
  sectionId?: string;
  sections?: Section[];
  stepMs?: number;
}

/* The card sets the colour and everything inside it is drawn in `current`, so
   inverting is two classes rather than a condition on every element.
   `glass` is a deliberate exception to the solid-surface rule: these pieces sit
   over section background images, and a frosted panel is the point of it. */

/* Labels are there from the first frame; only the values travel, so the rows
   never change height while the panel fills in. */
const STYLES = `
@keyframes editor52-in { from { opacity: 0; transform: translateX(0.5rem); } to { opacity: 1; transform: none; } }
.editor52-in { animation: editor52-in 320ms ease-out both; }
@media (prefers-reduced-motion: reduce) { .editor52-in { animation: none; } }
`;

export function MotionPanel({
  sectionLabel,
  sectionId,
  sections = [],
  stepMs = 340,
  surface = 'card',
  bordered = false,
  inverted = false,
  className,
}: MotionPanelProps): JSX.Element {
  const total = sections.reduce((sum, sec) => sum + sec.rows.length, 0);
  const [filled, setFilled] = useState(0);

  useEffect(() => {
    if (filled >= total) return;
    const id = setTimeout(() => setFilled((value) => value + 1), stepMs);
    return () => clearTimeout(id);
  }, [filled, total, stepMs]);

  const surfaceTone = surfaceClasses[surface][inverted ? 'inverted' : 'plain'];

  return (
    <div
      className={cn(
        'relative flex size-full items-center justify-center p-4',
        className,
      )}
    >
      <style>{STYLES}</style>

      <div
        className={cn(
          'flex w-full max-w-72 flex-col gap-3 rounded-xl p-4 shadow-sm',
          surfaceTone,
          bordered && 'border border-current/15',
        )}
      >
        <div className="flex items-center gap-2">
          {sectionLabel && (
            <span className="truncate text-sm font-semibold">
              {sectionLabel}
            </span>
          )}
          {sectionId && (
            <span className="truncate text-xs text-current/60">
              {sectionId}
            </span>
          )}
        </div>
        {/* {sectionLabel && <span className="block text-sm font-semibold">{sectionLabel}</span>} */}
        <MotionSections sections={sections} filled={filled} />
      </div>
    </div>
  );
}

interface MotionRowProps {
  label: string;
  value: string;
  shown: boolean;
}

const MotionRow = ({ label, value, shown = false }: MotionRowProps) => (
  <div className="flex items-center justify-between gap-3 py-1">
    <span className="truncate text-xs">{label}</span>
    <span
      className={cn(
        'flex shrink-0 items-center',
        'gap-1 text-xs text-current/60',
        {
          'editor52-in': shown,
          invisible: !shown,
        },
      )}
    >
      {value}
      <ChevronDown className="size-3" aria-hidden="true" />
    </span>
  </div>
);

const MotionSections = ({
  sections,
  filled = 0,
}: {
  sections: Section[];
  filled?: number;
}) => {
  const groupOffsets: number[] = sections.map((_, index) =>
    sections.slice(0, index).reduce((sum, sec) => sum + sec.rows.length, 0),
  );

  return (
    <>
      {sections.map((sec, secIdx) => (
        <div key={sec.label} className="flex flex-col gap-1">
          <p className="text-xs font-medium text-current/60">{sec.label}</p>
          {sec.rows.map((row, rowIdx) => {
            if (!groupOffsets) return null;
            const offset = groupOffsets[secIdx];
            const shown = offset! + rowIdx < filled;

            return <MotionRow key={row.label} {...row} shown={shown} />;
          })}
        </div>
      ))}
    </>
  );
};
