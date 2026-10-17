import { ShieldCheck } from 'lucide-react';

export const DataPrivacyDisclaimer = () => {
  return (
    <p className="flex items-start gap-2 text-sm text-muted-foreground">
      <ShieldCheck className="size-4 shrink-0" />
      These choices are stored only in this browser. This page does not send
      usage data to anyone.
    </p>
  );
};
