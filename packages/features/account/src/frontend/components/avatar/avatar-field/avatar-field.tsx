'use client';

import { useId, useState } from 'react';
import { Button } from '@synapcity/frontend-ui/core/button';

import { FormField, fieldErrorProps } from '@synapcity/frontend-forms';
import {
  AVATAR_ACCEPT,
  MAX_AVATAR_BYTES,
  avatarFileSchema,
} from '@synapcity/domain-identity';
import { ProfileAvatar } from '../../profile-avatar';
import { isUploadedAvatar } from '@synapcity/domain-identity';
import { useProfileForm } from '../../../next/profile-form-shell';

const MAX_MB = MAX_AVATAR_BYTES / 1024 / 1024;

/**
 * The photo input with a preview. Place it inside a `ProfileFormShell`. An
 * uploaded photo can be dropped for the default one: the picture the person's
 * Google or GitHub account supplied, or the person icon when there is none.
 *
 * A file is checked as soon as it is chosen and never sent if it fails. This
 * is more than a courtesy: Server Actions cap the request body, and a file
 * over the cap is refused by Next before the action runs, which would show the
 * app's unexpected-error screen instead of this message. The server checks
 * again, because the browser's idea of a file's type can be wrong.
 */
export function AvatarField({
  name,
  imageUrl,
  canRemove = true,
  autoFocus,
}: {
  name: string | null;
  imageUrl: string | null;
  canRemove?: boolean;
  autoFocus?: boolean;
}) {
  const { state, messageId, pending } = useProfileForm();
  const shown = state.avatarUrl === undefined ? imageUrl : state.avatarUrl;
  const [pickError, setPickError] = useState<string | null>(null);
  const pickErrorId = useId();

  return (
    <div className="flex flex-col gap-4">
      <ProfileAvatar
        name={name}
        imageUrl={shown}
        size="lg"
        className="size-16"
      />
      <FormField
        id="avatar"
        {...(pickError
          ? { invalid: true, messageId: pickErrorId }
          : fieldErrorProps(state, 'avatar', messageId))}
        label="Photo"
        hint={`PNG, JPEG or WebP, up to ${MAX_MB} MB.`}
        type="file"
        accept={AVATAR_ACCEPT}
        autoFocus={autoFocus}
        onChange={(event) => {
          const file = event.target.files?.[0];
          const check = file ? avatarFileSchema.safeParse(file) : null;
          if (!check || check.success) {
            setPickError(null);
            return;
          }
          setPickError(
            check.error.issues[0]?.message ?? 'Choose another image.',
          );
          // Drop the refused file so it cannot be submitted by accident.
          event.target.value = '';
        }}
      />
      {pickError ? (
        <p id={pickErrorId} role="alert" className="text-sm text-destructive">
          {pickError}
        </p>
      ) : null}
      {canRemove && isUploadedAvatar(shown) && (
        <div>
          <Button
            type="submit"
            name="intent"
            value="remove"
            variant="outline"
            disabled={pending}
          >
            Use default photo
          </Button>
        </div>
      )}
    </div>
  );
}
