'use client';

import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';

import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { Input } from './ui/input';

type PasswordInputProps = Omit<React.ComponentProps<'input'>, 'type'>;

/**
 * A password field with a show/hide toggle. The toggle is a real pressed
 * button, so screen readers hear its state; the field stays `type="password"`
 * until the user asks to see it.
 */
function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = React.useState(false);

  return (
    <div className="relative">
      <Input
        type={visible ? 'text' : 'password'}
        className={cn('pr-8', className)}
        {...props}
      />
      <Button
        toggle
        type="button"
        variant="ghost"
        size="icon-sm"
        label="Show password"
        pressed={visible}
        onPressedChange={setVisible}
        disabled={props.disabled}
        className="absolute top-1/2 right-1 -translate-y-1/2"
      >
        {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
      </Button>
    </div>
  );
}

export { PasswordInput };
export type { PasswordInputProps };
