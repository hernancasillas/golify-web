'use client';

import { useI18n } from '@/components/I18nProvider';
import { Button } from '@/components/ui/button';
import { usePathname, useRouter } from 'next/navigation';

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const { locale } = useI18n();

  const switchLocale = (newLocale: string) => {
    // Remove the current locale from the pathname and add the new one
    const segments = pathname.split('/');
    segments[1] = newLocale;
    const newPathname = segments.join('/');
    router.push(newPathname);
  };

  return (
    <div className="flex gap-2">
      <Button
        variant={locale === 'es' ? 'default' : 'outline'}
        size="sm"
        onClick={() => switchLocale('es')}
        className={locale === 'es' ? 'bg-green-600 hover:bg-green-700' : ''}
      >
        ES
      </Button>
      <Button
        variant={locale === 'en' ? 'default' : 'outline'}
        size="sm"
        onClick={() => switchLocale('en')}
        className={locale === 'en' ? 'bg-green-600 hover:bg-green-700' : ''}
      >
        EN
      </Button>
    </div>
  );
}
