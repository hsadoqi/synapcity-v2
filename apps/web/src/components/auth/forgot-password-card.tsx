'use client';

import { useState } from 'react';

import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@synapcity/frontend-ui/core/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@synapcity/frontend-ui/core/card';
import { Input } from '@synapcity/frontend-ui/core/input';
import { Label } from '@synapcity/frontend-ui/core/label';
import Link from 'next/link';
import { ForgotPasswordForm } from './forgot-password-form';

export function ForgotPasswordCard({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const [success, setSuccess] = useState(false);

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      {success ? (
        <Card>
          <CardHeader>
            <CardTitle className="font-medium text-lg tracking-normal">
              Check Your Email
            </CardTitle>
            <CardDescription>Password reset instructions sent</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              If you registered using your email and password, you will receive
              a password reset email.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="font-medium text-lg tracking-normal">
              Reset Your Password
            </CardTitle>
            <CardDescription>
              Type in your email and we&apos;ll send you a link to reset your
              password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ForgotPasswordForm onSuccess={() => setSuccess(true)} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
