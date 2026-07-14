'use client';

import { useI18n } from '@/components/I18nProvider';
import Link from 'next/link';

export default function RadioPolicyClient() {
  const { t, locale } = useI18n();
  return (
    <div className="min-h-screen bg-white dark:bg-[#06180E] text-gray-900 dark:text-gray-100">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Link href="/" className="text-[#0d5e26] dark:text-[#71F59B] hover:underline mb-8 inline-block">
          {t('privacy.backToHome')}
        </Link>

        <h1 className="text-4xl font-bold mb-8">{t('radioPolicy.title')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('radioPolicy.lastUpdated')}</p>

        <div className="space-y-4 text-gray-700 dark:text-gray-300">
          <p>{t('radioPolicy.intro')}</p>

          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white pt-4">{t('radioPolicy.architecture.title')}</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>{t('radioPolicy.architecture.noRehost')}</li>
            <li>{t('radioPolicy.architecture.directPlayback')}</li>
            <li>{t('radioPolicy.architecture.publicUrls')}</li>
            <li>{t('radioPolicy.architecture.attribution')}</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white pt-4">{t('radioPolicy.catalog.title')}</h2>
          <p>{t('radioPolicy.catalog.source')}</p>
          <p>{t('radioPolicy.catalog.control')}</p>
          <p>
            <a
              href="https://api.radio-browser.info/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0d5e26] dark:text-[#71F59B] underline text-sm"
            >
              {t('radioPolicy.catalog.apiLink')} ↗
            </a>
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white pt-4">{t('radioPolicy.monetization.title')}</h2>
          <p>{t('radioPolicy.monetization.text')}</p>

          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white pt-4">{t('radioPolicy.takedown.title')}</h2>
          <p>{t('radioPolicy.takedown.intro')}</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>{t('radioPolicy.takedown.inApp')}</li>
            <li>
              {t('radioPolicy.takedown.email')}{' '}
              <a href={`mailto:${t('privacy.contactEmail')}`} className="text-[#0d5e26] dark:text-[#71F59B] underline">
                {t('privacy.contactEmail')}
              </a>
            </li>
          </ul>
          <p>{t('radioPolicy.takedown.commitment')}</p>

          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white pt-4">{t('radioPolicy.contact.title')}</h2>
          <p>
            {t('radioPolicy.contact.text')}{' '}
            <a href={`mailto:${t('privacy.contactEmail')}`} className="text-[#0d5e26] dark:text-[#71F59B] underline">
              {t('privacy.contactEmail')}
            </a>
            . {t('radioPolicy.contact.seeAlso')}{' '}
            <Link href={`/${locale}/privacy`} className="text-[#0d5e26] dark:text-[#71F59B] underline">
              {t('radioPolicy.contact.privacyLink')}
            </Link>
            .
          </p>
        </div>

        <footer className="border-t border-gray-200 dark:border-[#71F59B]/10 pt-8 mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>© 2026 Golify. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
