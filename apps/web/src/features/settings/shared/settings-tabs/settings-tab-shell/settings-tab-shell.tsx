import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@synapcity/frontend-ui/components/ui/card';
import { ReactNode } from 'react';

export const SettingsTabShell = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) => {
  return (
    <Card className="flex-1 flex flex-col overflow-hidden">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        <div className="flex flex-col gap-6">{children}</div>
      </CardContent>
    </Card>
  );
};
