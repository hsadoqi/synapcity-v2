import { ShieldCheck } from 'lucide-react';
import { LinkButton } from '@synapcity/frontend-ui/components/link-button';

export const DataPrivacyDisclaimer = () => {
  return (
    <div className="flex flex-col gap-2">
      <p className="flex items-start gap-2 text-sm text-muted-foreground">
        <ShieldCheck className="size-4 shrink-0" />
        No usage data or error reports are sent unless you turn them on above.
      </p>
      <LinkButton
        href="/privacy"
        variant="link"
        size="sm"
        className="self-start"
      >
        Read the privacy notice
      </LinkButton>
    </div>
  );
};
