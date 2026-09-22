import type { Metadata } from 'next';
import '../globals.css';

// /go/<path> is the install funnel: it detects the platform and bounces the
// visitor into the right store. It sits outside the locale tree (a shared
// install link has no language), so with the root layout now living under
// /[locale] this branch needs its own minimal root layout.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function GoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
