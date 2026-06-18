import type { Metadata } from 'next';
import { localeAlternates, type Locale } from '@/lib/site';
import TermsClient from './TermsClient';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { alternates: localeAlternates(locale as Locale, '/terms') };
}

export default function Page() {
  return <TermsClient />;
}
