'use client';

import { useI18n } from '@/components/I18nProvider';
import Link from 'next/link';

export default function PrivacyClient() {
  const { t, locale } = useI18n();
  return (
    <div className="min-h-screen bg-white dark:bg-[#06180E] text-gray-900 dark:text-gray-100">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Link href="/" className="text-[#0d5e26] dark:text-[#71F59B] hover:underline mb-8 inline-block">
          {t('privacy.backToHome')}
        </Link>

        <h1 className="text-4xl font-bold mb-8">{t('privacy.title')}</h1>

        {/* Privacy Policy */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">{t('privacy.privacyPolicy.title')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('privacy.privacyPolicy.lastUpdated')}</p>

          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <p>{t('privacy.privacyPolicy.intro')}</p>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('privacy.privacyPolicy.infoWeCollect.title')}</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>{t('privacy.privacyPolicy.infoWeCollect.accountData')}</strong></li>
              <li><strong>{t('privacy.privacyPolicy.infoWeCollect.usageData')}</strong></li>
              <li><strong>{t('privacy.privacyPolicy.infoWeCollect.deviceData')}</strong></li>
              <li><strong>{t('privacy.privacyPolicy.infoWeCollect.locationData')}</strong></li>
              <li><strong>{t('privacy.privacyPolicy.infoWeCollect.healthData')}</strong></li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('privacy.privacyPolicy.howWeUse.title')}</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>{t('privacy.privacyPolicy.howWeUse.provide')}</li>
              <li>{t('privacy.privacyPolicy.howWeUse.notifications')}</li>
              <li>{t('privacy.privacyPolicy.howWeUse.personalize')}</li>
              <li>{t('privacy.privacyPolicy.howWeUse.security')}</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('privacy.privacyPolicy.healthData.title')}</h3>
            <p>{t('privacy.privacyPolicy.healthData.intro')}</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>{t('privacy.privacyPolicy.healthData.heartRate')}</li>
              <li>{t('privacy.privacyPolicy.healthData.hrv')}</li>
              <li>{t('privacy.privacyPolicy.healthData.restingHeartRate')}</li>
              <li>{t('privacy.privacyPolicy.healthData.sleep')}</li>
            </ul>
            <p>{t('privacy.privacyPolicy.healthData.processing')}</p>
            <p>{t('privacy.privacyPolicy.healthData.retention')}</p>
            <p>{t('privacy.privacyPolicy.healthData.security')}</p>
            <p>{t('privacy.privacyPolicy.healthData.revoke')}</p>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('privacy.privacyPolicy.sharing.title')}</h3>
            <p>{t('privacy.privacyPolicy.sharing.text')}</p>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('privacy.privacyPolicy.yourRights.title')}</h3>
            <p>
              {t('privacy.privacyPolicy.yourRights.text')} <a href={`mailto:${t('privacy.contactEmail')}`} className="text-[#0d5e26] dark:text-[#71F59B] underline">{t('privacy.contactEmail')}</a>.
            </p>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('privacy.privacyPolicy.security.title')}</h3>
            <p>{t('privacy.privacyPolicy.security.text')}</p>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('privacy.privacyPolicy.children.title')}</h3>
            <p>{t('privacy.privacyPolicy.children.text')}</p>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('privacy.privacyPolicy.thirdPartyServices.title')}</h3>
            <p>{t('privacy.privacyPolicy.thirdPartyServices.text')}</p>
            <p>
              <a
                href="https://api.radio-browser.info/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0d5e26] dark:text-[#71F59B] underline text-sm"
              >
                {t('privacy.privacyPolicy.thirdPartyServices.apiLink')} ↗
              </a>
            </p>
            <p>
              <Link
                href={`/${locale}/radio-policy`}
                className="text-[#0d5e26] dark:text-[#71F59B] underline text-sm"
              >
                {t('privacy.privacyPolicy.thirdPartyServices.radioPolicyLink')}
              </Link>
            </p>
          </div>
        </section>

        {/* Terms of Service */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">{t('privacy.terms.title')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('privacy.terms.lastUpdated')}</p>

          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <p>{t('privacy.terms.intro')}</p>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('privacy.terms.use.title')}</h3>
            <p>{t('privacy.terms.use.text')}</p>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('privacy.terms.accounts.title')}</h3>
            <p>{t('privacy.terms.accounts.text')}</p>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('privacy.terms.content.title')}</h3>
            <p>{t('privacy.terms.content.text')}</p>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('privacy.terms.termination.title')}</h3>
            <p>{t('privacy.terms.termination.text')}</p>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('privacy.terms.disclaimer.title')}</h3>
            <p>{t('privacy.terms.disclaimer.text')}</p>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('privacy.terms.changes.title')}</h3>
            <p>{t('privacy.terms.changes.text')}</p>
          </div>
        </section>

        {/* Account Deletion */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">{t('privacy.accountDeletion.title')}</h2>

          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <p>{t('privacy.accountDeletion.intro')}</p>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('privacy.accountDeletion.howToDelete.title')}</h3>
            <ol className="list-decimal pl-5 space-y-1">
              <li>{t('privacy.accountDeletion.howToDelete.step1')}</li>
              <li>{t('privacy.accountDeletion.howToDelete.step2')}</li>
              <li>{t('privacy.accountDeletion.howToDelete.step3')}</li>
            </ol>
            <p>
              {t('privacy.accountDeletion.howToDelete.alternative')} <a href={`mailto:${t('privacy.supportEmail')}`} className="text-[#0d5e26] dark:text-[#71F59B] underline">{t('privacy.supportEmail')}</a>.
            </p>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('privacy.accountDeletion.whatGetsDeleted.title')}</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>{t('privacy.accountDeletion.whatGetsDeleted.profile')}</li>
              <li>{t('privacy.accountDeletion.whatGetsDeleted.history')}</li>
              <li>{t('privacy.accountDeletion.whatGetsDeleted.catalog')}</li>
              <li>{t('privacy.accountDeletion.whatGetsDeleted.push')}</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('privacy.accountDeletion.retention.title')}</h3>
            <p>{t('privacy.accountDeletion.retention.text')}</p>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              {t('privacy.accountDeletion.contact')} <a href={`mailto:${t('privacy.supportEmail')}`} className="text-[#0d5e26] dark:text-[#71F59B] underline">{t('privacy.supportEmail')}</a>.
            </p>
          </div>
        </section>

        <footer className="border-t border-gray-200 dark:border-[#71F59B]/10 pt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>© 2026 Golify. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
