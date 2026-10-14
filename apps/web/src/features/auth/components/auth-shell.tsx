import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@synapcity/frontend-ui/core/card';

/** The page heading's id, so a state change can move focus to it. */
export const AUTH_HEADING_ID = 'auth-heading';

interface AuthShellProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * The one card every auth page renders. `auth/layout.tsx` owns centring and
 * width; this owns the heading structure, so each page has exactly one h1.
 */
export function AuthShell({
  title,
  description,
  children,
  footer,
}: AuthShellProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle
          as="h1"
          size="lg"
          id={AUTH_HEADING_ID}
          tabIndex={-1}
          className="outline-none"
        >
          {title}
        </CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      {children ? (
        <CardContent className="flex flex-col gap-4">{children}</CardContent>
      ) : null}
      {footer ? (
        <CardFooter className="justify-center gap-2">{footer}</CardFooter>
      ) : null}
    </Card>
  );
}
