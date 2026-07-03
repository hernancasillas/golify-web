import Image from 'next/image';
import Link from 'next/link';
import { INSTAGRAM_URL, TIKTOK_URL, type Locale } from '@/lib/site';

// Shared footer for the public site. Presentational + locale-aware links, so it
// works in both Server Components (world-cup pages) and the Client home page.
export function SiteFooter({ locale }: { locale: Locale }) {
  const en = locale === 'en';
  return (
    <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 border-t border-border px-5 py-9 sm:px-8">
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
    </footer>
  );
}
