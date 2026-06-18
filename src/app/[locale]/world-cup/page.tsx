import type { Metadata } from 'next';
import { localeAlternates, type Locale } from '@/lib/site';
import WorldCupClient from './WorldCupClient';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { alternates: localeAlternates(locale as Locale, '/world-cup') };
}

export default function Page() {
  return <WorldCupClient />;
}
