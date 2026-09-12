import Link from 'next/link';
import type { ReactNode } from 'react';

/** Shared shell for the Seshio legal pages. Seshio is a separate product from the
 *  Golify football app, so these pages are self-contained and never reuse the
 *  football policy copy, which describes data Seshio does not touch. */
export default function LegalLayout({
  locale,
  title,
  updated,
  children,
}: {
  locale: string;
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white dark:bg-[#06180E] text-gray-900 dark:text-gray-100">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Link
          href={`/${locale}`}
          className="text-[#0d5e26] dark:text-[#71F59B] hover:underline mb-8 inline-block"
        >
          ← golify.futbol
        </Link>
        <h1 className="text-4xl font-bold mb-2">{title}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-10">{updated}</p>
        <div className="space-y-8 text-gray-700 dark:text-gray-300 leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
      {children}
    </section>
  );
}

export const CONTACT_EMAIL = 'contacto@golify.futbol';
