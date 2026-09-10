'use client';

import Link from 'next/link';
import { useI18n } from '@/components/I18nProvider';
import { Reveal } from '@/components/Reveal';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { DisplayHeading } from '@/components/revamp/ui';
import type { Locale } from '@/lib/site';

export default function TermsClient() {
  const { t, locale } = useI18n();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />
      <main className="mx-auto max-w-2xl px-5 pt-2 pb-16 sm:px-8">
        <Link href={`/${locale}`} className="text-sm font-bold text-primary hover:underline">
          {t('privacy.backToHome')}
        </Link>

        <DisplayHeading as="h1" className="mt-5 text-4xl sm:text-5xl">
          {t('privacy.terms.title')}
        </DisplayHeading>
        <p className="mt-2 text-sm font-bold text-muted-foreground">
          {t('privacy.terms.lastUpdated')}
        </p>

        <Reveal className="mt-6 space-y-4 leading-relaxed font-semibold text-muted-foreground">
          <p>{t('privacy.terms.intro')}</p>

          <h2 className="text-lg font-bold text-foreground">{t('privacy.terms.use.title')}</h2>
          <p>{t('privacy.terms.use.text')}</p>

          <h2 className="text-lg font-bold text-foreground">{t('privacy.terms.accounts.title')}</h2>
          <p>{t('privacy.terms.accounts.text')}</p>

          <h2 className="text-lg font-bold text-foreground">{t('privacy.terms.content.title')}</h2>
          <p>{t('privacy.terms.content.text')}</p>

          <h2 className="text-lg font-bold text-foreground">{t('privacy.terms.termination.title')}</h2>
          <p>{t('privacy.terms.termination.text')}</p>

          <h2 className="text-lg font-bold text-foreground">{t('privacy.terms.disclaimer.title')}</h2>
          <p>{t('privacy.terms.disclaimer.text')}</p>

          <h2 className="text-lg font-bold text-foreground">{t('privacy.terms.changes.title')}</h2>
          <p>{t('privacy.terms.changes.text')}</p>
        </Reveal>
      </main>

      <SiteFooter locale={locale as Locale} />
    </div>
  );
}
