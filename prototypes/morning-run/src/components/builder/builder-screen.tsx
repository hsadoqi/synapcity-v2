'use client';

import { Pin, Plus, Save, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useId, useMemo, useState } from 'react';

import { RunIcon } from '@/components/icons';
import { PageFrame } from '@/components/shared/site-nav';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button, ButtonLink } from '@/components/ui/button';
import { CUSTOM_GROUP } from '@/hooks/use-runs';
import { useHydrated } from '@/hooks/use-hydrated';
import { ICON_NAMES, type Run, type Step } from '@/lib/runs/schema';
import { STEP_TEMPLATES } from '@/lib/runs/templates';
import { validateRun } from '@/lib/runs/validate';
import {
  deleteCustomRun,
  newRunId,
  saveCustomRun,
} from '@/lib/storage/actions';
import { useStore } from '@/lib/storage/persisted-store';
import { customRunsStore, prefsStore } from '@/lib/storage/stores';
import { runMeta } from '@/lib/timing/format';
import { cn } from '@/lib/utils';
import { Field, StepEditor, fieldClass } from './step-editor';

const blankRun = (): Run => ({
  id: newRunId(),
  group: CUSTOM_GROUP,
  name: '',
  tagline: '',
  icon: 'star',
  steps: [],
  builtIn: false,
});

export function BuilderScreen({ editId }: { editId?: string }) {
  const hydrated = useHydrated();
  const [custom] = useStore(customRunsStore);
  if (!hydrated) {
    return (
      <PageFrame>
        <p role="status" className="text-muted-foreground">
          Loading...
        </p>
      </PageFrame>
    );
  }
  const existing = editId ? custom.find((r) => r.id === editId) : undefined;
  return (
    <BuilderForm
      key={existing?.id ?? 'new'}
      initial={existing ?? blankRun()}
      editing={Boolean(existing)}
    />
  );
}

function BuilderForm({ initial, editing }: { initial: Run; editing: boolean }) {
  const router = useRouter();
  const uid = useId();
  const [custom] = useStore(customRunsStore);
  const [prefs, setPrefs] = useStore(prefsStore);
  const [draft, setDraft] = useState<Run>(initial);
  const [pin, setPin] = useState(prefs.pinned.includes(initial.id) || !editing);
  const [showProblems, setShowProblems] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const result = useMemo(() => validateRun(draft), [draft]);
  const problems = result.ok ? [] : result.problems;
  const live = status(draft, result.ok);

  const setStep = (index: number, step: Step) =>
    setDraft((d) => ({
      ...d,
      steps: d.steps.map((s, i) => (i === index ? step : s)),
    }));
  const move = (index: number, dir: -1 | 1) =>
    setDraft((d) => {
      const steps = [...d.steps];
      const target = index + dir;
      if (target < 0 || target >= steps.length) return d;
      [steps[index], steps[target]] = [steps[target]!, steps[index]!];
      return { ...d, steps };
    });

  const save = (thenStart: boolean) => {
    if (!result.ok) {
      setShowProblems(true);
      return;
    }
    saveCustomRun(result.run);
    setPrefs((p) => {
      const has = p.pinned.includes(result.run.id);
      if (pin === has) return p;
      return {
        ...p,
        pinned: pin
          ? [...p.pinned, result.run.id]
          : p.pinned.filter((id) => id !== result.run.id),
      };
    });
    router.push(thenStart ? `/run/${result.run.id}` : '/');
  };

  return (
    <PageFrame width="max-w-[820px]">
      <header className="flex flex-col gap-2">
        <p className="font-mono text-[0.8125rem] text-primary">BUILD</p>
        <h1 className="text-4xl leading-none font-light tracking-tight sm:text-5xl">
          {editing ? 'Edit your run' : 'Build your own run'}
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Pick steps from the list below, change the wording, and say where each
          answer should go. Then pin it next to the built-in runs.
        </p>
      </header>

      {!editing && custom.length > 0 ? (
        <section aria-label="Your runs" className="flex flex-col gap-1">
          <h2 className="text-xs font-semibold tracking-wider text-primary uppercase">
            Your runs
          </h2>
          <ul className="border-b">
            {custom.map((run) => (
              <li
                key={run.id}
                className="flex items-center gap-3 border-t py-2"
              >
                <RunIcon name={run.icon} className="size-5 text-primary" />
                <span className="min-w-0 flex-1 truncate">{run.name}</span>
                <span className="hidden font-mono text-xs text-muted-foreground sm:block">
                  {runMeta(run)}
                </span>
                <ButtonLink
                  variant="ghost"
                  size="touch"
                  href={`/builder?edit=${run.id}`}
                >
                  Edit
                </ButtonLink>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-label="Run details" className="flex flex-col gap-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Name" htmlFor={`${uid}-name`}>
            <input
              id={`${uid}-name`}
              className={fieldClass}
              value={draft.name}
              maxLength={40}
              placeholder="Sunday reset"
              onChange={(e) =>
                setDraft((d) => ({ ...d, name: e.target.value }))
              }
            />
          </Field>
          <Field label="One line about it" htmlFor={`${uid}-tagline`}>
            <input
              id={`${uid}-tagline`}
              className={fieldClass}
              value={draft.tagline}
              maxLength={100}
              placeholder="Plan the week and the weekend"
              onChange={(e) =>
                setDraft((d) => ({ ...d, tagline: e.target.value }))
              }
            />
          </Field>
        </div>
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm text-muted-foreground">Icon</legend>
          <div
            role="radiogroup"
            aria-label="Icon"
            className="flex flex-wrap gap-1"
          >
            {ICON_NAMES.map((name) => (
              <button
                key={name}
                type="button"
                role="radio"
                aria-checked={draft.icon === name}
                aria-label={name}
                onClick={() => setDraft((d) => ({ ...d, icon: name }))}
                className={cn(
                  'flex size-11 items-center justify-center rounded-md border transition-colors',
                  draft.icon === name
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-input text-muted-foreground hover:border-primary hover:text-foreground',
                )}
              >
                <RunIcon name={name} className="size-5" />
              </button>
            ))}
          </div>
        </fieldset>
      </section>

      <section aria-label="Steps" className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-xl font-medium">Steps</h2>
          <p className="font-mono text-xs text-muted-foreground">
            {runMeta(draft)}
          </p>
        </div>
        {draft.steps.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-muted-foreground">
            No steps yet. Add one from the list below.
          </p>
        ) : (
          <ol className="flex flex-col gap-3">
            {draft.steps.map((step, index) => (
              <StepEditor
                key={step.id}
                step={step}
                index={index}
                total={draft.steps.length}
                onChange={(s) => setStep(index, s)}
                onMove={(dir) => move(index, dir)}
                onRemove={() =>
                  setDraft((d) => ({
                    ...d,
                    steps: d.steps.filter((_, i) => i !== index),
                  }))
                }
              />
            ))}
          </ol>
        )}

        <div className="flex flex-col gap-2">
          <h3 className="text-sm text-muted-foreground">Add a step</h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {STEP_TEMPLATES.map((template) => (
              <li key={template.id}>
                <button
                  type="button"
                  disabled={draft.steps.length >= 12}
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      steps: [...d.steps, template.make()],
                    }))
                  }
                  className="sweep flex min-h-14 w-full items-center gap-3 rounded-md border px-3 text-left transition-colors hover:border-primary disabled:opacity-50"
                >
                  <RunIcon
                    name={template.icon}
                    className="size-5 shrink-0 text-primary"
                  />
                  <span className="flex min-w-0 flex-col">
                    <span className="text-sm font-medium">{template.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {template.hint}
                    </span>
                  </span>
                  <Plus
                    className="ml-auto size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {showProblems && problems.length > 0 ? (
        <div
          role="alert"
          className="flex flex-col gap-1 rounded-md border border-destructive/60 p-4 text-sm"
        >
          <p className="font-medium text-destructive">
            A few things to fix before saving:
          </p>
          <ul className="list-disc pl-5">
            {problems.map((p) => (
              <li key={p.path + p.message}>{p.message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 border-t pt-5">
        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input
            type="checkbox"
            className="size-5 accent-primary"
            checked={pin}
            onChange={(e) => setPin(e.target.checked)}
          />
          <Pin className="size-4 text-primary" aria-hidden="true" />
          Pin to the top of the home screen
        </label>
        <p role="status" className="sr-only">
          {live}
        </p>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {editing ? (
            <Button
              variant="ghost"
              size="touch"
              className="text-muted-foreground"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 data-icon="inline-start" />
              Delete
            </Button>
          ) : null}
          <Button variant="outline" size="xl" onClick={() => save(false)}>
            <Save data-icon="inline-start" />
            Save
          </Button>
          <Button size="xl" onClick={() => save(true)}>
            Save and start
          </Button>
        </div>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {draft.name || 'this run'}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              The run is removed from this device. Past results in your history
              stay.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel size="touch">Keep it</AlertDialogCancel>
            <Button
              variant="destructive"
              size="touch"
              onClick={() => {
                deleteCustomRun(draft.id);
                router.push('/');
              }}
            >
              Delete run
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageFrame>
  );
}

function status(draft: Run, ok: boolean): string {
  if (draft.steps.length === 0) return 'Add at least one step.';
  return ok
    ? `${runMeta(draft)}. Ready to save.`
    : 'Some details still need attention.';
}
