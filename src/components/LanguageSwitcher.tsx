'use client';

import { useI18n } from '@/components/I18nProvider';
import { Button } from '@/components/ui/button';
import { usePathname, useRouter } from 'next/navigation';

const LOCALES = [
  { code: 'es', label: 'ES' },
  { code: 'pt', label: 'PT' },
  { code: 'en', label: 'EN' },
] as const;

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const { locale } = useI18n();

  // Public URLs are localized per language (/es/partido/x vs /en/match/x), so
  // swapping the prefix would 404 or bounce. Every page emits reciprocal
  // hreflang links through pageMetadata: read the equivalent URL from the
  // document at click time (it is also right after client navigations, when
  // Next has already swapped the <head>). The prefix swap is the fallback.
  const switchLocale = (newLocale: string) => {
    let target: string | null = null;
    const link = document.querySelector<HTMLLinkElement>(
      `link[rel="alternate"][hreflang="${newLocale}"]`,
    );
    if (link?.href) {
      try {
        const u = new URL(link.href, window.location.origin);
        target = u.pathname + u.search;
      } catch {
        target = null;
      }
    }
    if (!target) {
      const segments = pathname.split('/');
      segments[1] = newLocale;
      target = segments.join('/');
    }
    router.push(target);
  };

  return (
    <div className="flex gap-1.5" role="group" aria-label="Language">
      {LOCALES.map(({ code, label }) => (
        <Button
          key={code}
          variant={locale === code ? 'default' : 'outline'}
          size="sm"
          onClick={() => switchLocale(code)}
          className="rounded-full"
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
