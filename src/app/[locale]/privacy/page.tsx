import type { Metadata } from 'next';
import { localeAlternates, type Locale } from '@/lib/site';
import PrivacyClient from './PrivacyClient';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { alternates: localeAlternates(locale as Locale, '/privacy') };
}

export default function Page() {
  return <PrivacyClient />;
}
