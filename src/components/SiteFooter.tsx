import Image from 'next/image';
import Link from 'next/link';
import { INSTAGRAM_URL, TIKTOK_URL, type Locale } from '@/lib/site';
import { TRACKED_LEAGUES } from '@/lib/leagues';

// The leagues linked from every page. This is the crawl path to the league
// pages: without it they would only be reachable from the results boards, and
// a crawler that never sees a live match would never find them at all.
const FOOTER_LEAGUES = TRACKED_LEAGUES.slice(0, 6);

// Shared footer for the public site. Presentational + locale-aware links, so it
// works in both Server Components (content pages) and the Client home page.
export function SiteFooter({ locale }: { locale: Locale }) {
  const en = locale === 'en';

  return (
    <footer className="mx-auto max-w-6xl border-t border-border px-5 py-9 sm:px-8">
      <nav className="mb-7 flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold text-muted-foreground">
        <Link href={`/${locale}/today`} className="transition-colors hover:text-foreground">
          {en ? "Today's matches" : 'Partidos de hoy'}
        </Link>
        <Link href={`/${locale}/live`} className="transition-colors hover:text-foreground">
          {en ? 'Live scores' : 'Resultados en vivo'}
        </Link>
        {FOOTER_LEAGUES.map((league) => (
          <Link
            key={league.id}
            href={`/${locale}/league/${league.id}`}
            className="transition-colors hover:text-foreground"
          >
            {league.name}
          </Link>
        ))}
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Image src="/icon.svg" alt="Golify" width={26} height={26} className="rounded-lg" />
          <span className="text-sm font-bold text-muted-foreground">
            {en
              ? '© 2026 Golify. All rights reserved.'
              : '© 2026 Golify. Todos los derechos reservados.'}
          </span>
        </div>

        <div className="flex items-center gap-6 text-sm font-bold text-muted-foreground">
          <Link href={`/${locale}/nosotros`} className="transition-colors hover:text-foreground">
            {en ? 'About' : 'Nosotros'}
          </Link>
          <Link href={`/${locale}/privacy`} className="transition-colors hover:text-foreground">
            Privacy &amp; Terms
          </Link>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            Instagram
          </a>
          <a
            href={TIKTOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            TikTok
          </a>
        </div>
      </div>
    </footer>
  );
}
