import { TooltipProvider } from '@synapcity/frontend-ui/components/tooltip';

/** Context every home route needs: tooltips for the collection controls. */
export function HomeProviders({ children }: { children: React.ReactNode }) {
  return <TooltipProvider>{children}</TooltipProvider>;
}
