'use client';

import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { teamPath, type RouteLocale } from '@/lib/routes';

/**
 * Link to a team sub-page (calendar, squad, stats) without an `<a href>`.
 * Used for clubs outside the indexed leagues: their sub-pages are noindex and
 * scrapers harvest every href, so each linked club became four cold renders
 * per locale. Visitors still navigate with a tap; the URL is only built on
 * click, so it is not in the HTML nor in the RSC payload either.
 */
export function TeamSubLink({
  locale,
  team,
  sub,
  className,
  current,
  children,
}: {
  locale: RouteLocale;
  team: { id: number; name: string };
  sub: 'squad' | 'fixtures' | 'stats';
  className?: string;
  current?: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  return (
    <button
      type="button"
      aria-current={current ? 'page' : undefined}
      className={className}
      onClick={() => router.push(teamPath(locale, team, sub))}
    >
      {children}
    </button>
  );
}
