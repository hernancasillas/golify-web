import type { Metadata } from 'next';
import { localeAlternates, type Locale } from '@/lib/site';
import StickersClient from './StickersClient';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { alternates: localeAlternates(locale as Locale, '/stickers') };
}

export default function Page() {
  return <StickersClient />;
}
