'use client';

import Image from 'next/image';
import type { ReactNode } from 'react';
import { useI18n } from '@/components/I18nProvider';
import { LiveMatchesWidget } from '@/components/LiveMatchesWidget';
import { Reveal } from '@/components/Reveal';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { StoreLink } from '@/components/StoreLink';
import {
  DisplayHeading,
  DownloadGlyph,
  Eyebrow,
  FeatureCard,
  LeagueChip,
  PhoneFrame,
} from '@/components/revamp/ui';
import { TRACKED_LEAGUES } from '@/lib/leagues';
import { type Locale } from '@/lib/site';

// Feature icons (stroke = currentColor so they invert on the mint/gold tiles).
const ICONS: Record<string, ReactNode> = {
  liveScores: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
      <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.6" opacity=".6" />
      <circle cx="12" cy="12" r="10.5" stroke="currentColor" strokeWidth="1.6" opacity=".3" />
    </svg>
  ),
  retas: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 3h10v4a5 5 0 0 1-10 0V3z" />
      <path d="M7 4H4a3 3 0 0 0 3 4" />
      <path d="M17 4h3a3 3 0 0 1-3 4" />
      <path d="M12 12v4" />
      <path d="M9 20h6" />
      <path d="M10 16h4l1 4H9l1-4z" />
    </svg>
  ),
  quinielas: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1a2 2 0 0 0 0 4v1a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1a2 2 0 0 0 0-4V8z" />
      <path d="M9 10.5l1.8 1.8L15 8.5" />
    </svg>
  ),
  eaFc: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="7.5" width="19" height="10" rx="5" />
      <path d="M7 10.5v4M5 12.5h4" />
      <circle cx="16" cy="10.8" r="1" />
      <circle cx="18.2" cy="13" r="1" />
    </svg>
  ),
  notifications: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 10a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14 6 10z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  ),
};

const FEATURES = [
  { key: 'liveScores', tone: 'mint' as const },
  { key: 'retas', tone: 'gold' as const },
  { key: 'quinielas', tone: 'mint' as const },
  { key: 'eaFc', tone: 'gold' as const },
  { key: 'notifications', tone: 'gold' as const },
];

export default function HomeClient() {
  const { t, locale } = useI18n();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />

      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-64 -left-40 h-[640px] w-[640px] rounded-full bg-[radial-gradient(circle,rgba(0,200,83,0.25),transparent_70%)]" />
        <div className="pointer-events-none absolute -top-24 -right-52 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(255,214,10,0.16),transparent_70%)]" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 pt-6 pb-20 sm:px-8 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <Eyebrow tone="gold">{t('home.badge')}</Eyebrow>
            <DisplayHeading as="h1" className="mt-6 text-5xl sm:text-6xl md:text-7xl lg:text-[82px]">
              {t('home.heroPre')}
              <span className="rounded-lg bg-primary px-3 text-primary-foreground">
                {t('home.heroHighlight')}
              </span>{' '}
              {t('home.heroPost')}
            </DisplayHeading>
            <p className="mt-6 max-w-lg text-lg leading-relaxed font-semibold text-muted-foreground">
              {t('home.heroSub')}
            </p>
            <div className="mt-9 flex flex-wrap gap-3.5">
              <StoreLink store="ios" variant="mint">
                <DownloadGlyph /> {t('home.downloadIOS')}
              </StoreLink>
              <StoreLink store="android" variant="outline">
                <DownloadGlyph /> {t('home.downloadAndroid')}
              </StoreLink>
            </div>
          </div>

          {/* Phone mockup — intrinsically dark "device" surface in both themes. */}
          <div className="flex justify-center">
            <div className="relative">
              <PhoneFrame>
                {/* Real app capture — dark UI shown on the light site, light UI on
                    the dark site (best contrast against each page background). */}
                <Image
                  src="/app-screenshot-dark.png"
                  alt="Golify app"
                  fill
                  sizes="270px"
                  className="object-cover dark:hidden"
                />
                <Image
                  src="/app-screenshot-light.png"
                  alt="Golify app"
                  fill
                  sizes="270px"
                  className="hidden object-cover dark:block"
                />
              </PhoneFrame>
              <div className="absolute top-[50px] -right-[52px] rotate-3 rounded-2xl border border-primary/40 bg-[#1B4A31] px-4 py-3 shadow-[0_14px_34px_rgba(0,0,0,0.45)]">
                <div className="text-xs font-extrabold text-primary">{t('home.mockupGoal')}</div>
                <div className="text-[10.5px] font-bold text-white/55">{t('home.mockupScore')}</div>
              </div>
              <div className="absolute bottom-[120px] -left-[58px] -rotate-3 rounded-2xl border border-gold/40 bg-[#241a0c] px-4 py-3 shadow-[0_14px_34px_rgba(0,0,0,0.45)]">
                <div className="text-xs font-extrabold text-gold">{t('home.mockupReta')}</div>
                <div className="text-[10.5px] font-bold text-white/50">{t('home.mockupRetaName')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LIVE MATCHES WIDGET ────────────────────────────────────────── */}
      <Reveal>
        <LiveMatchesWidget />
      </Reveal>

      {/* ── FEATURES ───────────────────────────────────────────────────── */}
      <Reveal as="section" className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
        <div className="mb-14 text-center">
          <DisplayHeading as="h2" className="text-4xl sm:text-5xl">
            {t('home.featuresTitle')}
          </DisplayHeading>
          <p className="mt-3 font-semibold text-muted-foreground">
            {t('home.featuresSub')}
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ key, tone }) => (
            <FeatureCard
              key={key}
              tone={tone}
              icon={ICONS[key]}
              title={t(`home.featureItems.${key}.title`)}
              description={t(`home.featureItems.${key}.description`)}
            />
          ))}
        </div>
      </Reveal>

      {/* ── LEAGUES ────────────────────────────────────────────────────── */}
      <Reveal as="section" className="mx-auto max-w-6xl px-5 pb-24 text-center sm:px-8">
        <DisplayHeading as="h2" className="mb-8 text-3xl sm:text-4xl">
          {t('home.leaguesTitle')}
        </DisplayHeading>
        <div className="flex flex-wrap justify-center gap-3">
          {TRACKED_LEAGUES.map((league) => (
            <LeagueChip
              key={league.name}
              href={`/${locale}/league/${league.id}`}
              logo={`https://media.api-sports.io/football/leagues/${league.id}.png`}
            >
              {league.name}
            </LeagueChip>
          ))}
        </div>
      </Reveal>

      {/* ── FINAL CTA ──────────────────────────────────────────────────── */}
      <Reveal as="section" className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
        <div className="rounded-3xl bg-[linear-gradient(120deg,#00C853,#FFD60A)] px-8 py-16 text-center sm:px-16 sm:py-20">
          <h2 className="font-display font-bold text-4xl leading-none tracking-wide text-[#070710] uppercase sm:text-5xl md:text-[56px]">
            {t('home.finalCtaTitle')}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg font-bold text-[#070710]/75">
            {t('home.finalCtaBody')}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3.5">
            <StoreLink store="ios" variant="dark">
              <DownloadGlyph /> {t('cta.appStore')}
            </StoreLink>
            <StoreLink store="android" variant="dark">
              <DownloadGlyph /> {t('cta.googlePlay')}
            </StoreLink>
          </div>
        </div>
      </Reveal>

      <SiteFooter locale={locale as Locale} />
    </div>
  );
}
