'use client';

import { cn } from '@synapcity/frontend-ui/lib/utils';

interface Option {
  label: string;
  letter: string;
  state?: 'correct' | 'incorrect' | 'selected' | 'idle';
}

interface QuizQuestionProps {
  questionIndex?: number;
  totalQuestions?: number;
  question?: string;
  options?: Option[];
  bordered?: boolean;
  className?: string;
}

const stateClasses: Record<NonNullable<Option['state']>, string> = {
  correct: 'border-success bg-success/15 text-foreground',
  incorrect: 'border-destructive bg-destructive/10 text-foreground',
  selected: 'border-primary bg-primary/10 text-card-foreground',
  idle: 'border-border bg-card text-card-foreground hover:bg-muted',
};

const letterClasses: Record<NonNullable<Option['state']>, string> = {
  correct: 'bg-success/45 text-foreground',
  incorrect: 'bg-destructive/40 text-foreground',
  selected: 'bg-primary text-primary-foreground',
  idle: 'bg-muted text-card-foreground',
};

export function QuizQuestion({
  questionIndex = 1,
  totalQuestions = 1,
  question,
  options = [],
  bordered = false,
  className,
}: QuizQuestionProps) {
  return (
    <div
      className={cn(
        'relative flex size-full items-center justify-center p-4',
        className,
      )}
    >
      <div
        className={cn(
          'flex w-full max-w-80 flex-col gap-2.5 rounded-xl bg-card p-3 shadow-sm',
          bordered && 'border border-border',
        )}
      >
        <span className="text-xs font-medium tabular-nums text-muted-foreground">
          Question {questionIndex} of {totalQuestions}
        </span>
        {question && (
          <span className="text-sm font-semibold leading-snug text-card-foreground">
            {question}
          </span>
        )}
        <div className="flex flex-col gap-1.5">
          {options.map((opt, idx) => {
            const state = opt.state ?? 'idle';
            return (
              <button
                key={idx}
                type="button"
                className={cn(
                  'flex items-center gap-2 rounded-md border px-2.5 py-2 text-xs text-left transition-colors',
                  stateClasses[state],
                )}
              >
                <span
                  className={cn(
                    'flex size-5 shrink-0 items-center justify-center rounded text-xs font-bold',
                    letterClasses[state],
                  )}
                >
                  {opt.letter}
                </span>
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
