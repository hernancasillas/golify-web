'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import { homePath, sectionPath, type RouteLocale } from '@/lib/routes';
import { SmartDownload } from '@/components/SmartDownload';

// Shared top navigation for the public site. Derives the active locale from the
// pathname so it works on every revamped page without per-page wiring. Keeps
// the existing ES/EN switch + theme toggle.
export function SiteNav() {
  const pathname = usePathname();
  const seg = pathname.split('/');
  const locale = seg[1] === 'en' || seg[1] === 'pt' ? seg[1] : 'es';

  const LABELS = {
    es: { today: 'Hoy', live: 'En vivo', leagues: 'Ligas', pools: 'Quinielas', transfers: 'Fichajes', news: 'Noticias', download: 'Descarga la app', menu: 'Menú', search: 'Buscar', go: 'Buscar' },
    en: { today: 'Today', live: 'Live', leagues: 'Leagues', pools: 'Pools', transfers: 'Transfers', news: 'News', download: 'Get the app', menu: 'Menu', search: 'Search', go: 'Search' },
    pt: { today: 'Hoje', live: 'Ao vivo', leagues: 'Ligas', pools: 'Bolões', transfers: 'Transferências', news: 'Notícias', download: 'Baixe o app', menu: 'Menu', search: 'Buscar', go: 'Buscar' },
  } as const;

  const label = LABELS[locale as keyof typeof LABELS];
  const l = locale as RouteLocale;
  const links = [
    { href: sectionPath('today', l), text: label.today, live: false },
    { href: sectionPath('live', l), text: label.live, live: true },
    { href: sectionPath('leagues', l), text: label.leagues, live: false },
    { href: sectionPath('pool', l), text: label.pools, live: false },
    { href: sectionPath('transfers', l), text: label.transfers, live: false },
    { href: sectionPath('news', l), text: label.news, live: false },
  ];
  const searchForm = (cls: string) => (
    <form action={sectionPath('search', l)} method="get" role="search" className={cls}>
      <input
        type="search"
        name="q"
        minLength={3}
        placeholder={label.search}
        aria-label={label.search}
        className="w-full rounded-[3px] border-2 border-field-foreground bg-transparent px-3 py-2 text-sm font-semibold text-field-foreground placeholder:text-field-muted"
      />
      {/* Enter submits the form; this hidden button is for assistive tech
          only, so it stays out of the tab order (it has no visible focus). */}
      <button type="submit" className="sr-only" tabIndex={-1}>
        {label.go}
      </button>
    </form>
  );
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    // The nav sits on the tribuna band (brand green by day, night-stand green
    // in dark mode) on every page; the home hero continues the same band.
    <header className="band-field relative w-full">
      <nav className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-2 border-b-2 border-field-foreground px-4 py-2.5 sm:gap-4 sm:px-8">
        <Link href={homePath(l)} className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Image
            src="/icon.svg"
            alt="Golify"
            width={40}
            height={40}
            className="h-8 w-8 rounded-full sm:h-9 sm:w-9"
          />
          <span className="font-display text-[26px] leading-none font-black tracking-wide sm:text-[30px]">
            GOLIFY
          </span>
        </Link>

        <div className="flex min-w-0 items-center gap-2 sm:gap-8">
          <div className="hidden items-center gap-4 text-sm font-bold lg:flex xl:gap-5">
            {links.map((x) => (
              <Link
                key={x.href}
                href={x.href}
                aria-current={pathname === x.href ? 'page' : undefined}
                className="flex items-center gap-1.5 border-b-[3px] border-transparent py-4 whitespace-nowrap font-bold hover:border-field-foreground aria-[current=page]:border-field-foreground"
              >
                {x.live ? <span aria-hidden className="h-2 w-2 rounded-full bg-live ring-2 ring-field-foreground" /> : null}
                {x.text}
              </Link>
            ))}
          </div>
          {searchForm('hidden w-32 shrink-0 md:block xl:w-48')}

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>

          <SmartDownload
            variant="dark"
            className="hidden px-5 py-2.5 lg:inline-flex"
          >
            {label.download}
          </SmartDownload>

          {/* Below `md` the links above and the CTA are both hidden — this is
              their only way to reach Features/Nosotros/download on mobile. */}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label={label.menu}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[3px] border-2 border-field-foreground lg:hidden"
          >
            {menuOpen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {menuOpen ? (
        <div className="band-field absolute inset-x-0 top-full z-20 border-b-2 border-field-foreground px-5 py-5 shadow-[0_16px_40px_rgba(0,0,0,0.25)] sm:px-8 lg:hidden">
          {searchForm('mb-4')}
          <div className="flex flex-col gap-4 text-base font-bold">
            {links.map((x) => (
              <Link
                key={x.href}
                href={x.href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2"
              >
                {x.live ? <span aria-hidden className="h-2 w-2 rounded-full bg-live" /> : null}
                {x.text}
              </Link>
            ))}
          </div>
          <SmartDownload variant="dark" className="mt-5 w-full">
            {label.download}
          </SmartDownload>
        </div>
      ) : null}
    </header>
  );
}
