import { notFound, permanentRedirect } from 'next/navigation';
import { sectionPath, ROUTE_LOCALES, type RouteLocale } from '@/lib/routes';

// /es/partidos without a date has no page of its own: the archive is a set
// of days, and the day people mean when they leave the date out is today.
export default async function MatchesIndex({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!(ROUTE_LOCALES as readonly string[]).includes(locale)) notFound();
  permanentRedirect(sectionPath('today', locale as RouteLocale));
}
