'use client';

import {
  startTransition,
  useId,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import type { FieldErrors, FieldValues } from 'react-hook-form';
import type { z } from 'zod';
import { Button } from '@synapcity/frontend-ui/core/button';

import type { FormDefinition } from '../../types';
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
import { EngineField } from './engine-field';

const DEFAULT_SUBMIT_FAILED = 'Something went wrong. Try again.';

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
  const submitting = useRef(false);
  const [refusal, setRefusal] = useState<ActionFormRefusal>();
  const isAction = props.action !== undefined;

  const focusFirstInvalid = (errors: FieldErrors) => {
    const first = definition.fields.find(
      (field) =>
        states[field.name]?.visible === true &&
        errors[field.name] !== undefined,
    );
    if (first) focusTargets.current.get(first.name)?.focus();
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

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    const element = event.currentTarget;
    if (isAction) {
      void form.handleSubmit(
        () => {
          setRefusal(undefined);
          startTransition(() => props.action?.(new FormData(element)));
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
      form.clearErrors('root');
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
      {definition.fields.map((field) =>
        states[field.name]?.visible === true ? (
          <EngineField
            key={field.name}
            field={field}
            id={`${formId}-${field.name}`}
            state={states[field.name]!}
            control={form.control}
            registry={registry}
            showOwnError={!isAction}
            markedBy={
              isAction && shown.error && shown.fields?.includes(field.name)
                ? messageId
                : undefined
            }
            onFocusTarget={(name, element) =>
              focusTargets.current.set(name, element)
            }
          />
        ) : null,
      )}
      <FormMessage id={messageId} state={{ error: formError }} />
      <div className="flex justify-end gap-2">
        {props.onCancel ? (
          <Button type="button" variant="outline" onClick={props.onCancel}>
            {props.cancelLabel ?? 'Cancel'}
          </Button>
        ) : null}
        <Button
          type="submit"
          disabled={pending}
          aria-busy={pending || undefined}
        >
          {props.submitLabel ?? 'Save'}
        </Button>
      </div>
    </form>
  );
}
