'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SmartDownload } from '@/components/SmartDownload';

// Shared top navigation for the public site. Derives the active locale from the
// pathname so it works on every revamped page without per-page wiring. Keeps
// the existing ES/EN switch + theme toggle.
export function SiteNav() {
  const pathname = usePathname();
  const seg = pathname.split('/');
  const locale = seg[1] === 'en' || seg[1] === 'pt' ? seg[1] : 'es';

  const LABELS = {
    es: {
      today: 'Hoy',
      live: 'En vivo',
      features: 'Funciones',
      about: 'Nosotros',
      download: 'Descargar app',
      menu: 'Menú',
    },
    en: {
      today: 'Today',
      live: 'Live',
      features: 'Features',
      about: 'About',
      download: 'Download app',
      menu: 'Menu',
    },
    pt: {
      today: 'Hoje',
      live: 'Ao vivo',
      features: 'Recursos',
      about: 'Sobre nós',
      download: 'Baixar app',
      menu: 'Menu',
    },
  } as const;

  const label = LABELS[locale as keyof typeof LABELS];
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="relative w-full">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-6 sm:px-8">
        <Link href={`/${locale}`} className="flex items-center gap-3">
          <Image
            src="/icon.svg"
            alt="Golify"
            width={40}
            height={40}
            className="rounded-xl"
          />
          <span className="font-display font-bold text-2xl tracking-wide text-foreground">
            GOLIFY
          </span>
        </Link>

        <div className="flex items-center gap-4 sm:gap-8">
          <div className="hidden items-center gap-7 text-sm font-bold md:flex">
            <Link
              href={`/${locale}/today`}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {label.today}
            </Link>
            <Link
              href={`/${locale}/live`}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {label.live}
            </Link>
            <Link
              href={`/${locale}/features`}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {label.features}
            </Link>
            <Link
              href={`/${locale}/nosotros`}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {label.about}
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>

          <SmartDownload
            variant="mint"
            className="hidden px-5 py-2.5 md:inline-flex"
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
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border text-foreground md:hidden"
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
        <div className="absolute inset-x-0 top-full z-20 border-t border-border bg-background px-5 py-5 shadow-[0_16px_40px_rgba(0,0,0,0.25)] sm:px-8 md:hidden">
          <div className="flex flex-col gap-4 text-base font-bold">
            <Link
              href={`/${locale}/today`}
              onClick={() => setMenuOpen(false)}
              className="text-foreground"
            >
              {label.today}
            </Link>
            <Link
              href={`/${locale}/live`}
              onClick={() => setMenuOpen(false)}
              className="text-foreground"
            >
              {label.live}
            </Link>
            <Link
              href={`/${locale}/features`}
              onClick={() => setMenuOpen(false)}
              className="text-foreground"
            >
              {label.features}
            </Link>
            <Link
              href={`/${locale}/nosotros`}
              onClick={() => setMenuOpen(false)}
              className="text-foreground"
            >
              {label.about}
            </Link>
          </div>
          <SmartDownload variant="mint" className="mt-5 w-full">
            {label.download}
          </SmartDownload>
        </div>
      ) : null}
    </header>
  );
}
