import { notFound } from 'next/navigation';
import { ROUTE_LOCALES, type RouteLocale } from '@/lib/routes';

export function asLocale(v: string): RouteLocale {
  if (!(ROUTE_LOCALES as readonly string[]).includes(v)) notFound();
  return v as RouteLocale;
}
