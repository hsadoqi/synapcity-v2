'use client';

import { cn } from '@synapcity/frontend-ui/lib/utils';
import { surfaceClasses } from './countdown-card-variants';
import type { CountdownUnit } from './countdown-card.types';

export const countdownCardDemo: CountdownCardProps = {
  surface: 'card',
  bordered: false,
  inverted: false,
  title: 'Opens to everyone in',
  units: [
    { value: '12', label: 'days' },
    { value: '06', label: 'hrs' },
    { value: '48', label: 'min' },
  ],
};

type Surface = 'card' | 'glass';

interface CountdownCardProps {
  title?: string;
  units?: CountdownUnit[];
  caption?: string;
  surface?: Surface;
  bordered?: boolean;
  inverted?: boolean;
  className?: string;
}

export function CountdownCard({
  title,
  units = [],
  caption,
  surface = 'card',
  bordered = false,
  inverted = false,
  className,
}: CountdownCardProps) {
  const surfaceTone =
    surfaceClasses[surface]?.[inverted ? 'inverted' : 'plain'];

  return (
    <div
      className={cn(
        'relative flex size-full items-center justify-center p-4',
        className,
      )}
    >
      <div
        className={cn(
          'w-full max-w-80 rounded-md p-5 text-center shadow-xl',
          surfaceTone,
          bordered && 'border border-current/15',
        )}
      >
        {title && <p className="text-sm text-current/60">{title}</p>}

        <div className="mt-3 flex items-stretch justify-center divide-x divide-border">
          {units.map((unit, index) => (
            <div key={index} className="flex-1 px-2">
              <p className="text-3xl font-light tracking-tight tabular-nums">
                {unit.value}
              </p>
              <p className="mt-0.5 text-sm text-current/60">{unit.label}</p>
            </div>
          ))}
        </div>

        {caption && (
          <p className="mt-4 border-t border-current/15 pt-3 text-sm leading-relaxed text-current/60">
            {caption}
          </p>
        )}
      </div>
    </div>
  );
}
