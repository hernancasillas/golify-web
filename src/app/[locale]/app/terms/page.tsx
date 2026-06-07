'use client';

import { useI18n } from '@/components/I18nProvider';
import Link from 'next/link';

export default function TermsPage() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-white dark:bg-[#06180E] text-gray-900 dark:text-gray-100">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Link href="/" className="text-[#0d5e26] dark:text-[#71F59B] hover:underline mb-8 inline-block">
          {t('privacy.backToHome')}
        </Link>

        <h1 className="text-4xl font-bold mb-8">{t('privacy.terms.title')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('privacy.terms.lastUpdated')}</p>

        <div className="space-y-4 text-gray-700 dark:text-gray-300">
          <p>{t('privacy.terms.intro')}</p>

          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('privacy.terms.use.title')}</h2>
          <p>{t('privacy.terms.use.text')}</p>

          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('privacy.terms.accounts.title')}</h2>
          <p>{t('privacy.terms.accounts.text')}</p>

          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('privacy.terms.content.title')}</h2>
          <p>{t('privacy.terms.content.text')}</p>

          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('privacy.terms.termination.title')}</h2>
          <p>{t('privacy.terms.termination.text')}</p>

          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('privacy.terms.disclaimer.title')}</h2>
          <p>{t('privacy.terms.disclaimer.text')}</p>

          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('privacy.terms.changes.title')}</h2>
          <p>{t('privacy.terms.changes.text')}</p>
        </div>

        <footer className="border-t border-gray-200 dark:border-[#71F59B]/10 pt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>© 2026 Golify. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
