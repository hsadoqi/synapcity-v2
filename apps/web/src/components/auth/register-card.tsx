import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@synapcity/frontend-ui/core/card';
import { RegisterForm } from './register-form';
import { AuthLinkButton } from './auth-link-button';
import { OAuthButtons } from './oauth-buttons';

export function RegisterCard({
  className,
  next,
  ...props
}: React.ComponentPropsWithoutRef<'div'> & {
  next: string;
}) {
  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="font-medium text-lg tracking-normal">
            Sign up
          </CardTitle>
          <CardDescription>Create a new account</CardDescription>
        </CardHeader>
        <CardContent>
          <OAuthButtons next={next} />
          <p className="text-center text-xs text-muted-foreground">or</p>
          <RegisterForm next={next} />
        </CardContent>
        <CardFooter className="flex flex-col items-center justify-center gap-2">
          <AuthLinkButton
            type="login"
            label="Already have an account? Sign in"
            className="mt-4"
          />
          <p className="text-center text-xs text-muted-foreground">
            By signing up, you agree to our{' '}
            <a href="/terms" className="text-link hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-link hover:underline">
              Privacy Policy
            </a>
            .
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
