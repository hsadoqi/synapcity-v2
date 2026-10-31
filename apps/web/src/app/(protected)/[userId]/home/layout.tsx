import { HomeShell } from '@/features/home/components/home-shell';
import { HomeProviders } from '@/features/home/providers/home-providers';

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <HomeProviders>
      <HomeShell>{children}</HomeShell>
    </HomeProviders>
  );
}
