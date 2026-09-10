'use client';

import Link from 'next/link';
import { useI18n } from '@/components/I18nProvider';
import { Reveal } from '@/components/Reveal';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { DisplayHeading } from '@/components/revamp/ui';
import type { Locale } from '@/lib/site';

export default function PrivacyClient() {
  const { t, locale } = useI18n();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />
      <main className="mx-auto max-w-2xl px-5 pt-2 pb-16 sm:px-8">
        <Link href={`/${locale}`} className="text-sm font-bold text-primary hover:underline">
          {t('privacy.backToHome')}
        </Link>

        <DisplayHeading as="h1" className="mt-5 text-4xl sm:text-5xl">
          {t('privacy.title')}
        </DisplayHeading>

        {/* Privacy Policy */}
        <Reveal as="section" className="mt-12">
          <DisplayHeading as="h2" className="text-2xl">
            {t('privacy.privacyPolicy.title')}
          </DisplayHeading>
          <p className="mt-2 text-sm font-bold text-muted-foreground">
            {t('privacy.privacyPolicy.lastUpdated')}
          </p>

          <div className="mt-4 space-y-4 leading-relaxed font-semibold text-muted-foreground">
            <p>{t('privacy.privacyPolicy.intro')}</p>

            <h3 className="text-lg font-bold text-foreground">
              {t('privacy.privacyPolicy.infoWeCollect.title')}
            </h3>
            <ul className="list-disc space-y-1 pl-5">
              <li><strong className="text-foreground">{t('privacy.privacyPolicy.infoWeCollect.accountData')}</strong></li>
              <li><strong className="text-foreground">{t('privacy.privacyPolicy.infoWeCollect.usageData')}</strong></li>
              <li><strong className="text-foreground">{t('privacy.privacyPolicy.infoWeCollect.deviceData')}</strong></li>
              <li><strong className="text-foreground">{t('privacy.privacyPolicy.infoWeCollect.locationData')}</strong></li>
              <li><strong className="text-foreground">{t('privacy.privacyPolicy.infoWeCollect.healthData')}</strong></li>
            </ul>

            <h3 className="text-lg font-bold text-foreground">
              {t('privacy.privacyPolicy.howWeUse.title')}
            </h3>
            <ul className="list-disc space-y-1 pl-5">
              <li>{t('privacy.privacyPolicy.howWeUse.provide')}</li>
              <li>{t('privacy.privacyPolicy.howWeUse.notifications')}</li>
              <li>{t('privacy.privacyPolicy.howWeUse.personalize')}</li>
              <li>{t('privacy.privacyPolicy.howWeUse.security')}</li>
            </ul>

            <h3 className="text-lg font-bold text-foreground">
              {t('privacy.privacyPolicy.healthData.title')}
            </h3>
            <p>{t('privacy.privacyPolicy.healthData.intro')}</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>{t('privacy.privacyPolicy.healthData.heartRate')}</li>
              <li>{t('privacy.privacyPolicy.healthData.hrv')}</li>
              <li>{t('privacy.privacyPolicy.healthData.restingHeartRate')}</li>
              <li>{t('privacy.privacyPolicy.healthData.sleep')}</li>
            </ul>
            <p>{t('privacy.privacyPolicy.healthData.processing')}</p>
            <p>{t('privacy.privacyPolicy.healthData.retention')}</p>
            <p>{t('privacy.privacyPolicy.healthData.security')}</p>
            <p>{t('privacy.privacyPolicy.healthData.revoke')}</p>

            <h3 className="text-lg font-bold text-foreground">
              {t('privacy.privacyPolicy.sharing.title')}
            </h3>
            <p>{t('privacy.privacyPolicy.sharing.text')}</p>

            <h3 className="text-lg font-bold text-foreground">
              {t('privacy.privacyPolicy.yourRights.title')}
            </h3>
            <p>
              {t('privacy.privacyPolicy.yourRights.text')}{' '}
              <a href={`mailto:${t('privacy.contactEmail')}`} className="text-primary underline">
                {t('privacy.contactEmail')}
              </a>
              .
            </p>

            <h3 className="text-lg font-bold text-foreground">
              {t('privacy.privacyPolicy.security.title')}
            </h3>
            <p>{t('privacy.privacyPolicy.security.text')}</p>

            <h3 className="text-lg font-bold text-foreground">
              {t('privacy.privacyPolicy.children.title')}
            </h3>
            <p>{t('privacy.privacyPolicy.children.text')}</p>

            <h3 className="text-lg font-bold text-foreground">
              {t('privacy.privacyPolicy.thirdPartyServices.title')}
            </h3>
            <p>{t('privacy.privacyPolicy.thirdPartyServices.text')}</p>
            <p>
              <a
                href="https://api.radio-browser.info/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary underline"
              >
                {t('privacy.privacyPolicy.thirdPartyServices.apiLink')} ↗
              </a>
            </p>
            <p>
              <Link
                href={`/${locale}/radio-policy`}
                className="text-sm text-primary underline"
              >
                {t('privacy.privacyPolicy.thirdPartyServices.radioPolicyLink')}
              </Link>
            </p>
          </div>
        </Reveal>

        {/* Terms of Service */}
        <Reveal as="section" className="mt-12">
          <DisplayHeading as="h2" className="text-2xl">
            {t('privacy.terms.title')}
          </DisplayHeading>
          <p className="mt-2 text-sm font-bold text-muted-foreground">
            {t('privacy.terms.lastUpdated')}
          </p>

          <div className="mt-4 space-y-4 leading-relaxed font-semibold text-muted-foreground">
            <p>{t('privacy.terms.intro')}</p>

            <h3 className="text-lg font-bold text-foreground">{t('privacy.terms.use.title')}</h3>
            <p>{t('privacy.terms.use.text')}</p>

            <h3 className="text-lg font-bold text-foreground">{t('privacy.terms.accounts.title')}</h3>
            <p>{t('privacy.terms.accounts.text')}</p>

            <h3 className="text-lg font-bold text-foreground">{t('privacy.terms.content.title')}</h3>
            <p>{t('privacy.terms.content.text')}</p>

            <h3 className="text-lg font-bold text-foreground">{t('privacy.terms.termination.title')}</h3>
            <p>{t('privacy.terms.termination.text')}</p>

            <h3 className="text-lg font-bold text-foreground">{t('privacy.terms.disclaimer.title')}</h3>
            <p>{t('privacy.terms.disclaimer.text')}</p>

            <h3 className="text-lg font-bold text-foreground">{t('privacy.terms.changes.title')}</h3>
            <p>{t('privacy.terms.changes.text')}</p>
          </div>
        </Reveal>

        {/* Account Deletion */}
        <Reveal as="section" className="mt-12">
          <DisplayHeading as="h2" className="text-2xl">
            {t('privacy.accountDeletion.title')}
          </DisplayHeading>

          <div className="mt-4 space-y-4 leading-relaxed font-semibold text-muted-foreground">
            <p>{t('privacy.accountDeletion.intro')}</p>

            <h3 className="text-lg font-bold text-foreground">
              {t('privacy.accountDeletion.howToDelete.title')}
            </h3>
            <ol className="list-decimal space-y-1 pl-5">
              <li>{t('privacy.accountDeletion.howToDelete.step1')}</li>
              <li>{t('privacy.accountDeletion.howToDelete.step2')}</li>
              <li>{t('privacy.accountDeletion.howToDelete.step3')}</li>
            </ol>
            <p>
              {t('privacy.accountDeletion.howToDelete.alternative')}{' '}
              <a href={`mailto:${t('privacy.supportEmail')}`} className="text-primary underline">
                {t('privacy.supportEmail')}
              </a>
              .
            </p>

            <h3 className="text-lg font-bold text-foreground">
              {t('privacy.accountDeletion.whatGetsDeleted.title')}
            </h3>
            <ul className="list-disc space-y-1 pl-5">
              <li>{t('privacy.accountDeletion.whatGetsDeleted.profile')}</li>
              <li>{t('privacy.accountDeletion.whatGetsDeleted.history')}</li>
              <li>{t('privacy.accountDeletion.whatGetsDeleted.catalog')}</li>
              <li>{t('privacy.accountDeletion.whatGetsDeleted.push')}</li>
            </ul>

            <h3 className="text-lg font-bold text-foreground">
              {t('privacy.accountDeletion.retention.title')}
            </h3>
            <p>{t('privacy.accountDeletion.retention.text')}</p>

            <p className="text-sm">
              {t('privacy.accountDeletion.contact')}{' '}
              <a href={`mailto:${t('privacy.supportEmail')}`} className="text-primary underline">
                {t('privacy.supportEmail')}
              </a>
              .
            </p>
          </div>
        </Reveal>
      </main>

      <SiteFooter locale={locale as Locale} />
    </div>
  );
}
