import type { Metadata } from 'next';

// Everything under /[locale]/app/* is an app-open funnel: the page bounces the
// visitor into the Golify deeplink and shows a splash while it tries. They
// carry no content of their own and they shadow the real content routes
// (/[locale]/match/<id>, /team/<id>, /league/<id>), which is how Search Console
// ended up with a pile of "duplicate without user-selected canonical" URLs.
//
// Keep them reachable for shared links, keep them out of the index.
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function AppFunnelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
