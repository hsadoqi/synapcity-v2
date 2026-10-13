import type { ComponentProps, ReactNode } from 'react';
import { Input } from '@synapcity/frontend-ui/core/input';
import { Label } from '@synapcity/frontend-ui/core/label';
import { PasswordInput } from '@synapcity/frontend-ui/components/password-input';

type AuthFieldProps = ComponentProps<'input'> & {
  id: string;
  label: string;
  /** Rule shown under the field and read out with it, e.g. a length minimum. */
  hint?: string;
  /** Marks the field invalid and points it at the message that explains why. */
  invalid?: boolean;
  messageId?: string;
  /** A small action that belongs to this field, shown at the end of its label row. */
  labelAction?: ReactNode;
};

export function AuthField({
  id,
  label,
  hint,
  invalid,
  messageId,
  labelAction,
  type,
  ...props
}: AuthFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const describedBy =
    [hintId, invalid ? messageId : undefined].filter(Boolean).join(' ') ||
    undefined;
  const Control = type === 'password' ? PasswordInput : Input;

  return (
    <div className="flex flex-col gap-2">
      {labelAction ? (
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor={id}>{label}</Label>
          {labelAction}
        </div>
      ) : (
        <Label htmlFor={id}>{label}</Label>
      )}
      <Control
        id={id}
        name={id}
        {...(type === 'password' ? {} : { type })}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        {...props}
      />
      {hint ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
