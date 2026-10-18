import { HomePageShell } from '@/features/home/components/home-page';
import HomeProviders from '@/features/home/providers/home-providers';

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <HomeProviders>
      <HomePageShell>{children}</HomePageShell>
    </HomeProviders>
  );
}
