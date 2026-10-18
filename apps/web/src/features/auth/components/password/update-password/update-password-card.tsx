import { AuthShell } from '../../../shared/auth-shell';
import { UpdatePasswordForm } from './update-password-form';

export function UpdatePasswordCard({ next }: { next: string }) {
  return (
    <AuthShell title="Choose a new password">
      <UpdatePasswordForm next={next} />
    </AuthShell>
  );
}
