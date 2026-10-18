import { TooltipProvider } from '@synapcity/frontend-ui/core/tooltip';

export default function HomeProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TooltipProvider>{children}</TooltipProvider>;
}