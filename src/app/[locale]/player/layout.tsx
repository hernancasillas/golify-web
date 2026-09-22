import type { Metadata } from 'next';

// Player pages are still an app-open funnel with no server-rendered facts, so
// they would index as near-identical splash screens. Out of the index until
// they render a real squad/stats page.
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function PlayerFunnelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
