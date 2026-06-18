import type { Metadata } from 'next';
import { localeAlternates, type Locale } from '@/lib/site';
import HomeClient from './HomeClient';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { alternates: localeAlternates(locale as Locale) };
}

export default function Home() {
  return <HomeClient />;
}
