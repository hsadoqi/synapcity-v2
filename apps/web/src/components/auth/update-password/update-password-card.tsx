import { AuthShell } from '../shell/auth-shell';
import { UpdatePasswordForm } from './update-password-form';

export function UpdatePasswordCard() {
  return (
    <AuthShell title="Choose a new password">
      <UpdatePasswordForm />
    </AuthShell>
  );
}
