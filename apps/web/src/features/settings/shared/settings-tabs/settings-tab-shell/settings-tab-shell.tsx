import {
  Card,
  CardHeader,
  CardAction,
  CardTitle,
  CardDescription,
  CardContent,
} from '@synapcity/frontend-ui/core/card';
import { ReactNode } from 'react';

export const SettingsTabShell = ({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  /** A control for the whole tab, set at the header's end where it stays in view. */
  action?: ReactNode;
  children: ReactNode;
}) => {
  return (
    // size="lg": the tab holds long rows and two-line descriptions, which need
    // more room than the default card's tight padding gives them.
    <Card size="lg" className="flex-1">
      {/* The rule splits the tab's identity from its settings. */}
      <CardHeader className="border-b">
        {/* The page's h1 is "Settings"; each tab's title is the next level down,
            so it must outrank the sections (h3) inside it. */}
        <CardTitle as="h2" size="lg">
          {title}
        </CardTitle>
        <CardDescription className="text-sm">{description}</CardDescription>
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        {/* Rows sit close (gap-4, set by FieldGroup); sections sit apart. */}
        <div className="flex flex-col gap-8">{children}</div>
      </CardContent>
    </Card>
  );
};
