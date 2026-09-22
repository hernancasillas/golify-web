import type { Metadata } from 'next';

// A collector profile is personal, shared by link, and has nothing to rank for.
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function CollectorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
