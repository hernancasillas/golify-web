'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SmartDownload } from '@/components/SmartDownload';
import { cn } from '@/lib/utils';

// Shared top navigation for the public site. Derives the active locale + section
// from the pathname so it works on every revamped page (Home, Calendar, Bracket)
// without per-page wiring. Keeps the existing ES/EN switch + theme toggle.
export function SiteNav() {
  const pathname = usePathname();
  const seg = pathname.split('/');
  const locale = seg[1] === 'en' ? 'en' : 'es';
  const en = locale === 'en';
  const inWorldCup = pathname.includes('/world-cup');

  const label = {
    wc: en ? 'World Cup 2026' : 'Mundial 2026',
    about: en ? 'About' : 'Nosotros',
    download: en ? 'Download app' : 'Descargar app',
  };

  return (
    <header className="w-full">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-6 sm:px-8">
        <Link href={`/${locale}`} className="flex items-center gap-3">
          <Image
            src="/icon.svg"
            alt="Golify"
            width={40}
            height={40}
            className="rounded-xl"
          />
          <span className="font-display text-2xl tracking-wide text-foreground">
            GOLIFY
          </span>
        </Link>

        <div className="flex items-center gap-4 sm:gap-8">
          <div className="hidden items-center gap-7 text-sm font-bold md:flex">
            <Link
              href={`/${locale}/world-cup`}
              className={cn(
                'transition-colors hover:text-foreground',
                inWorldCup ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              {label.wc}
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
            className="hidden px-5 py-2.5 sm:inline-flex"
          >
            {label.download}
          </SmartDownload>
        </div>
      </nav>
    </header>
  );
}
