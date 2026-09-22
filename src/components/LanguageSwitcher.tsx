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

  const switchLocale = (newLocale: string) => {
    // Swap the locale segment, keeping the rest of the path: a Brazilian
    // reading the Brasileirão table stays on that table in Portuguese.
    const segments = pathname.split('/');
    segments[1] = newLocale;
    router.push(segments.join('/'));
  };

  return (
    <div className="flex gap-2">
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
