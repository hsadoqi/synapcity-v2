'use client';

import { Copy, Download, ImageDown, Share2, Timer } from 'lucide-react';
import { useState } from 'react';

import { Button, ButtonLink } from '@/components/ui/button';
import { useHydrated } from '@/hooks/use-hydrated';
import {
  intentionMarkdown,
  intentionText,
  type Intention,
} from '@/lib/intention';
import {
  canShare,
  copyText,
  downloadBlob,
  intentionFilename,
  renderIntentionPng,
  shareText,
} from '@/lib/share';

/** The shareable card: today's intention in a sentence, with the details underneath. */
export function IntentionCard({ intention }: { intention: Intention }) {
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const shareable = useHydrated() && canShare();

  const flash = (message: string) => {
    setStatus(message);
    setTimeout(() => setStatus(''), 2500);
  };

  return (
    <section
      aria-label="Today's intention"
      className="flex flex-col gap-5 rounded-xl border border-primary/50 bg-card p-5 sm:p-7"
    >
      <p className="font-mono text-xs tracking-wide text-primary uppercase">
        {intention.dateLabel} · {intention.runName}
      </p>
      <p className="text-3xl leading-tight font-light tracking-tight sm:text-4xl">
        {intention.headline}
      </p>
      {intention.lines.length > 0 ? (
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-[8rem_1fr]">
          {intention.lines.map((line) => (
            <div key={line.label} className="contents">
              <dt className="text-xs font-semibold tracking-wide text-primary uppercase sm:pt-1">
                {line.label}
              </dt>
              <dd className="text-lg">{line.text}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {intention.pace ? (
        <p className="text-sm text-muted-foreground">{intention.pace}</p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2 border-t pt-4">
        <Button
          variant="outline"
          size="touch"
          onClick={async () =>
            flash(
              (await copyText(intentionText(intention)))
                ? 'Copied to clipboard'
                : 'Could not copy',
            )
          }
        >
          <Copy data-icon="inline-start" />
          Copy
        </Button>
        <Button
          variant="outline"
          size="touch"
          onClick={() => {
            downloadBlob(
              intentionFilename(intention, 'md'),
              new Blob([intentionMarkdown(intention)], {
                type: 'text/markdown',
              }),
            );
            flash('Saved as Markdown');
          }}
        >
          <Download data-icon="inline-start" />
          Markdown
        </Button>
        <Button
          variant="outline"
          size="touch"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              downloadBlob(
                intentionFilename(intention, 'png'),
                await renderIntentionPng(intention),
              );
              flash('Saved as an image');
            } catch {
              flash('Could not make the image');
            } finally {
              setBusy(false);
            }
          }}
        >
          <ImageDown data-icon="inline-start" />
          Image
        </Button>
        {shareable ? (
          <Button
            variant="outline"
            size="touch"
            onClick={() =>
              shareText("Today's intention", intentionText(intention))
            }
          >
            <Share2 data-icon="inline-start" />
            Share
          </Button>
        ) : null}
        <span role="status" aria-live="polite" className="text-sm text-primary">
          {status}
        </span>
        <ButtonLink href="/focus" size="touch" className="ml-auto">
          <Timer data-icon="inline-start" />
          Start focus session
        </ButtonLink>
      </div>
    </section>
  );
}
