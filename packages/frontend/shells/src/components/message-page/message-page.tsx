import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@synapcity/frontend-ui/core/card';

/** The heading's id, so a page that appears after a failure can move focus to it. */
export const MESSAGE_HEADING_ID = 'message-heading';

/**
 * A page that is just a message and a way out: an unexpected error, a page that
 * does not exist. It is laid out like the auth pages (one centred card) so the
 * app's failure states look like the rest of it.
 */
export function MessagePage({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  /** The ways forward, such as a retry button or a link home. */
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 items-start justify-center sm:items-center">
      <div className="flex w-full max-w-md flex-col gap-6">
        <Card size="lg">
          <CardHeader className="gap-2">
            <CardTitle
              as="h1"
              size="lg"
              id={MESSAGE_HEADING_ID}
              tabIndex={-1}
              className="outline-none"
            >
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardFooter className="gap-2 border-t">{children}</CardFooter>
        </Card>
      </div>
    </div>
  );
}
