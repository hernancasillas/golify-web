import type { Metadata } from 'next';
import { localeAlternates, type Locale } from '@/lib/site';
import RadioPolicyClient from './RadioPolicyClient';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { alternates: localeAlternates(locale as Locale, '/radio-policy') };
}

export default function Page() {
  return <RadioPolicyClient />;
}
