'use client';

import {
  startTransition,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import type { FieldErrors, FieldValues } from 'react-hook-form';
import type { z } from 'zod';
import { Button } from '@synapcity/frontend-ui/core/button';

import type { FieldConfig, FieldGroup, FormDefinition } from '../../types';
import type { FormFeedback } from '../../hooks/use-action-form';
import { useFocusFirstError } from '../../hooks/use-focus-first-error';
import { useFormBuilder } from '../../hooks/use-form-builder';
import {
  createDefaultRegistry,
  UnknownFieldTypeError,
  useOptionalFieldRendererRegistry,
  type FieldRendererRegistry,
} from '../../providers/field-renderer-provider';
import {
  firstRefusal,
  type ActionFormRefusal,
} from '../../utils/first-refusal';
import { FormMessage } from '../form-message';
import { EngineField, type AsyncFlush } from './engine-field';
import { FormGroup } from './form-group';

const DEFAULT_SUBMIT_FAILED = 'Something went wrong. Try again.';
const DEFAULT_REQUIRED_HINT = 'Required';

type Values<TSchema extends z.ZodObject> = Partial<z.infer<TSchema>>;

interface FormRendererBaseProps<TSchema extends z.ZodObject> {
  readonly definition: FormDefinition<TSchema>;
  /** Seeds the form once; a later change is ignored. */
  readonly initialValues?: Readonly<Values<TSchema>>;
  readonly onCancel?: () => void;
  readonly submitLabel?: string;
  readonly cancelLabel?: string;
  readonly messages?: {
    readonly required?: string;
    /** Shown when `onSubmit` throws. Never the thrown error's own text. */
    readonly submitFailed?: string;
    /** Read out for a required control that cannot carry `aria-required`. Defaults to `Required`. */
    readonly requiredHint?: string;
  };
}

/** Submits in the browser to a handler. Needs JavaScript. */
interface SubmitModeProps<TSchema extends z.ZodObject> {
  readonly onSubmit: (values: Values<TSchema>) => void | Promise<void>;
  /** After a successful submit: keep the values (default) or go back to the start. */
  readonly afterSubmit?: 'keep' | 'clear';
  readonly action?: never;
  readonly state?: never;
  readonly pending?: never;
}

/**
 * Submits to a server action. The form keeps its `action`, so it works before
 * the page hydrates; once hydrated, it validates first and only valid data is
 * posted.
 */
interface ActionModeProps {
  readonly action: (formData: FormData) => void;
  /** The state the action last returned. */
  readonly state?: FormFeedback;
  /** From `useActionState`. */
  readonly pending?: boolean;
  readonly onSubmit?: never;
  readonly afterSubmit?: never;
}

export type FormRendererProps<TSchema extends z.ZodObject = z.ZodObject> =
  FormRendererBaseProps<TSchema> & (SubmitModeProps<TSchema> | ActionModeProps);

/**
 * Renders a form definition: its visible fields, a form-level message, and the
 * submit and cancel buttons. Uses the renderers of the nearest
 * `FieldRendererProvider`, or the built-in ones when there is none.
 */
export function FormRenderer<TSchema extends z.ZodObject>(
  props: FormRendererProps<TSchema>,
) {
  const provided = useOptionalFieldRendererRegistry();
  const [fallback] = useState(() =>
    provided ? null : createDefaultRegistry(),
  );
  const registry = provided ?? (fallback as FieldRendererRegistry);
  return <FormRendererWith {...props} registry={registry} />;
}

function FormRendererWith<TSchema extends z.ZodObject>({
  registry,
  ...props
}: FormRendererProps<TSchema> & { readonly registry: FieldRendererRegistry }) {
  const definition = props.definition as unknown as FormDefinition;
  const unknown = [
    ...new Set(
      definition.fields
        .map((field) => field.type)
        .filter((type) => !registry.has(type)),
    ),
  ];
  if (unknown.length > 0) throw new UnknownFieldTypeError(unknown.join('", "'));

  const formId = useId();
  const messageId = `${formId}-message`;
  const { form, states, defaults } = useFormBuilder({
    definition,
    initialValues: props.initialValues as
      Readonly<Record<string, unknown>> | undefined,
    messages: { required: props.messages?.required },
  });

  const focusTargets = useRef(new Map<string, HTMLElement | null>());
  const asyncFlushes = useRef(new Map<string, AsyncFlush>());
  const pendingFocus = useRef<string | undefined>(undefined);
  const submitting = useRef(false);
  /**
   * True from a valid submit until it finishes: async checks, then the handler.
   * Not set while the schema is checked, so an invalid submit never flickers
   * the form disabled.
   */
  const [checking, setChecking] = useState(false);
  const [refusal, setRefusal] = useState<ActionFormRefusal>();
  const isAction = props.action !== undefined;
  // Only a form with async fields locks, and only for a submit that passed the
  // schema (through its checks and the handler or server action), never while
  // typing. Any other form keeps its fields editable and disables just the
  // submit button, as before.
  const lockable = definition.fields.some(
    (field) => field.asyncValidation !== undefined,
  );
  const locked = lockable && (checking || (isAction && props.pending === true));
  /** Where focus was when a locking submit started, so it can come back. */
  const restoreFocus = useRef<HTMLElement | null>(null);

  const groupById = useMemo(
    () => new Map(definition.groups.map((group) => [group.id, group])),
    [definition],
  );
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      definition.groups.map((group) => [group.id, group.defaultOpen !== false]),
    ),
  );

  // The latest field states, for callbacks that must not change identity.
  const statesRef = useRef(states);
  useEffect(() => {
    statesRef.current = states;
  });
  /** The form's values without the hidden fields', which the schema ignores too. */
  const visibleValues = useCallback((): Record<string, unknown> => {
    const values: Record<string, unknown> = {};
    for (const [name, value] of Object.entries(form.getValues())) {
      if (statesRef.current[name]?.visible === true) values[name] = value;
    }
    return values;
  }, [form]);

  const onFocusTarget = useCallback(
    (name: string, element: HTMLElement | null) =>
      focusTargets.current.set(name, element),
    [],
  );
  const onAsyncFlush = useCallback((name: string, flush: AsyncFlush | null) => {
    if (flush) asyncFlushes.current.set(name, flush);
    else asyncFlushes.current.delete(name);
  }, []);

  /** The folded collapsible groups that hold any of these fields. */
  const foldedGroupsOf = (names: readonly string[]): string[] => {
    const ids = new Set<string>();
    for (const name of names) {
      const field = definition.fields.find((each) => each.name === name);
      const group = field?.group ? groupById.get(field.group) : undefined;
      if (group?.collapsible === true && openGroups[group.id] !== true)
        ids.add(group.id);
    }
    return [...ids];
  };

  const [, setFocusRequest] = useState(0);
  // Focus waits for the render that unfolds a group or re-enables a field
  // after its async check; a target that is still disabled is tried again on
  // the next render.
  useEffect(() => {
    const name = pendingFocus.current;
    if (name === undefined) return;
    const target = focusTargets.current.get(name);
    if (target === null || target === undefined) {
      pendingFocus.current = undefined;
      return;
    }
    // A locked form unlocks soon, so wait; a field that is disabled for any
    // other reason cannot take focus, and must not be handed it much later.
    if ((target as HTMLInputElement).disabled === true) {
      if (!locked) pendingFocus.current = undefined;
      return;
    }
    pendingFocus.current = undefined;
    target.focus();
  });

  // Disabling a focused control drops focus; give it back once the form unlocks,
  // unless a refused submit has already moved focus to a field.
  useEffect(() => {
    if (locked) return;
    const target = restoreFocus.current;
    restoreFocus.current = null;
    const active = document.activeElement;
    if (
      target?.isConnected &&
      pendingFocus.current === undefined &&
      (active === null || active === document.body)
    ) {
      target.focus();
    }
  }, [locked]);

  /** Unfolds every group holding one of these fields, then focuses the first. */
  const revealAndFocus = (names: readonly string[]) => {
    const first = names[0];
    if (first === undefined) return;
    const folded = foldedGroupsOf(names);
    const target = focusTargets.current.get(first);
    if (
      folded.length === 0 &&
      target !== null &&
      target !== undefined &&
      (target as HTMLInputElement).disabled !== true
    ) {
      target.focus();
      return;
    }
    pendingFocus.current = first;
    setFocusRequest((count) => count + 1);
    if (folded.length > 0) {
      setOpenGroups((current) => ({
        ...current,
        ...Object.fromEntries(folded.map((id) => [id, true])),
      }));
    }
  };

  const focusFirstInvalid = (errors: FieldErrors) => {
    revealAndFocus(
      definition.fields
        .filter(
          (field) =>
            states[field.name]?.visible === true &&
            errors[field.name] !== undefined,
        )
        .map((field) => field.name),
    );
  };

  /** Runs every visible field's async check now; resolves to the fields it refused, in form order. */
  const refusedByAsyncChecks = async (): Promise<string[]> => {
    const checked = definition.fields.filter(
      (field) =>
        states[field.name]?.visible === true &&
        asyncFlushes.current.has(field.name),
    );
    const results = await Promise.all(
      checked.map((field) => asyncFlushes.current.get(field.name)!()),
    );
    return checked
      .filter((_, index) => {
        const status = results[index]?.status;
        return status === 'invalid' || status === 'failed';
      })
      .map((field) => field.name);
  };

  // In action mode the form shows one refusal at a time, the way the server does.
  const serverState: FormFeedback = props.state ?? {};
  const shown: FormFeedback = isAction ? (refusal ?? serverState) : {};
  const formRef = useFocusFirstError(isAction ? shown : {});

  const rootError = form.formState.errors.root?.serverError?.message;
  const formError = isAction ? shown.error : rootError;
  const pending = isAction
    ? props.pending === true
    : form.formState.isSubmitting;

  // A server refusal names fields; their groups stay unfolded while it is shown.
  const forcedOpen = new Set(
    isAction && shown.error
      ? (shown.fields ?? []).flatMap((name) => {
          const field = definition.fields.find((each) => each.name === name);
          return field?.group ? [field.group] : [];
        })
      : [],
  );

  const renderField = (field: FieldConfig) =>
    states[field.name]?.visible === true ? (
      <EngineField
        key={field.name}
        field={field}
        id={`${formId}-${field.name}`}
        state={states[field.name]!}
        control={form.control}
        registry={registry}
        schema={definition.schema.shape[field.name] as z.ZodType}
        getValues={visibleValues}
        showOwnError={!isAction}
        markedBy={
          isAction && shown.error && shown.fields?.includes(field.name)
            ? messageId
            : undefined
        }
        requiredHint={props.messages?.requiredHint ?? DEFAULT_REQUIRED_HINT}
        locked={locked}
        onFocusTarget={onFocusTarget}
        onAsyncFlush={onAsyncFlush}
      />
    ) : null;

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    const element = event.currentTarget;
    const active = document.activeElement;
    restoreFocus.current =
      lockable && active instanceof HTMLElement && element.contains(active)
        ? active
        : null;
    if (isAction) {
      void form.handleSubmit(
        async () => {
          setRefusal(undefined);
          // Read before locking: a disabled control is left out of FormData.
          const data = new FormData(element);
          setChecking(true);
          const refused = await refusedByAsyncChecks();
          setChecking(false);
          if (refused.length > 0) {
            revealAndFocus(refused);
            return;
          }
          startTransition(() => props.action?.(data));
        },
        (errors) => setRefusal(firstRefusal(errors)),
      )(event);
      return;
    }
    if (submitting.current) {
      event.preventDefault();
      return;
    }
    void form.handleSubmit(async (values: FieldValues) => {
      submitting.current = true;
      setChecking(true);
      form.clearErrors('root');
      const refused = await refusedByAsyncChecks();
      if (refused.length > 0) {
        submitting.current = false;
        setChecking(false);
        revealAndFocus(refused);
        return;
      }
      try {
        await props.onSubmit?.(values as Values<TSchema>);
        if (props.afterSubmit === 'clear') form.reset(defaults);
        // Keeps what was typed, and makes it the new clean state.
        else form.reset(form.getValues());
      } catch {
        form.setError('root.serverError', {
          type: 'submit',
          message: props.messages?.submitFailed ?? DEFAULT_SUBMIT_FAILED,
        });
      } finally {
        submitting.current = false;
        setChecking(false);
      }
    }, focusFirstInvalid)(event);
  };

  return (
    <form
      ref={formRef}
      id={formId}
      action={isAction ? props.action : undefined}
      noValidate
      onSubmit={onSubmit}
      className="flex flex-col gap-4"
    >
      {segmentsOf(definition.fields, groupById).map((segment) => {
        if (segment.group === undefined) return renderField(segment.fields[0]!);
        const visible = segment.fields.filter(
          (field) => states[field.name]?.visible === true,
        );
        if (visible.length === 0) return null;
        const { group } = segment;
        return (
          <FormGroup
            key={`group-${group.id}`}
            group={group}
            id={`${formId}-group-${group.id}`}
            open={openGroups[group.id] === true || forcedOpen.has(group.id)}
            onOpenChange={(open) =>
              setOpenGroups((current) => ({ ...current, [group.id]: open }))
            }
            errorCount={
              visible.filter(
                (field) => form.formState.errors[field.name] !== undefined,
              ).length
            }
          >
            {visible.map(renderField)}
          </FormGroup>
        );
      })}
      <FormMessage id={messageId} state={{ error: formError }} />
      <div className="flex justify-end gap-2">
        {props.onCancel ? (
          <Button type="button" variant="outline" onClick={props.onCancel}>
            {props.cancelLabel ?? 'Cancel'}
          </Button>
        ) : null}
        <Button
          type="submit"
          disabled={pending || locked}
          aria-busy={pending || locked || undefined}
        >
          {props.submitLabel ?? 'Save'}
        </Button>
      </div>
    </form>
  );
}

interface Segment {
  readonly group?: FieldGroup;
  readonly fields: FieldConfig[];
}

/**
 * The fields in order, with each group's adjacent run of fields gathered into
 * one segment (`defineForm` guarantees a group is one run). An ungrouped field
 * is a segment of its own.
 */
function segmentsOf(
  fields: readonly FieldConfig[],
  groups: ReadonlyMap<string, FieldGroup>,
): Segment[] {
  const segments: Segment[] = [];
  for (const field of fields) {
    const last = segments[segments.length - 1];
    if (
      field.group !== undefined &&
      last?.group !== undefined &&
      last.group.id === field.group
    ) {
      last.fields.push(field);
      continue;
    }
    segments.push({
      group: field.group === undefined ? undefined : groups.get(field.group),
      fields: [field],
    });
  }
  return segments;
}
