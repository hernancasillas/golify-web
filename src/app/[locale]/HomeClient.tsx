'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useI18n } from '@/components/I18nProvider';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import {
  DisplayHeading,
  DownloadGlyph,
  Eyebrow,
  FeatureCard,
  LeagueChip,
  PillLink,
} from '@/components/revamp/ui';
import { APP_STORE_URL, PLAY_STORE_URL, type Locale } from '@/lib/site';

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
  stickers: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.6" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6" />
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
  { key: 'stickers', tone: 'mint' as const },
  { key: 'notifications', tone: 'gold' as const },
];

// API-Football league IDs — logos served from media.api-sports.io.
const LEAGUES = [
  { name: 'Liga MX', id: 262 },
  { name: 'Premier League', id: 39 },
  { name: 'La Liga', id: 140 },
  { name: 'Bundesliga', id: 78 },
  { name: 'Serie A', id: 135 },
  { name: 'Ligue 1', id: 61 },
  { name: 'MLS', id: 253 },
  { name: 'Saudi Pro League', id: 307 },
  { name: 'Liga Argentina', id: 128 },
  { name: 'Primeira Liga', id: 94 },
];

export default function HomeClient() {
  const { t, locale } = useI18n();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />

      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-64 -left-40 h-[640px] w-[640px] rounded-full bg-[radial-gradient(circle,rgba(92,242,154,0.25),transparent_70%)]" />
        <div className="pointer-events-none absolute -top-24 -right-52 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(255,193,69,0.16),transparent_70%)]" />

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
              <PillLink href={APP_STORE_URL} variant="mint">
                <DownloadGlyph /> {t('home.downloadIOS')}
              </PillLink>
              <PillLink href={PLAY_STORE_URL} variant="outline">
                <DownloadGlyph /> {t('home.downloadAndroid')}
              </PillLink>
            </div>
          </div>

          {/* Phone mockup — intrinsically dark "device" surface in both themes. */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="relative h-[520px] w-[260px] overflow-hidden rounded-[42px] border-[10px] border-[#0B1A11] bg-[#050D08] shadow-[0_30px_90px_rgba(0,0,0,0.55)] sm:h-[600px] sm:w-[290px]">
                <div className="absolute top-0 left-1/2 z-10 h-5 w-28 -translate-x-1/2 rounded-b-2xl bg-[#0B1A11]" />
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
              </div>
              <div className="absolute top-[50px] -right-[52px] rotate-3 rounded-2xl border border-primary/40 bg-[#0C2418] px-4 py-3 shadow-[0_14px_34px_rgba(0,0,0,0.45)]">
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

      {/* ── WORLD CUP BANNER ───────────────────────────────────────────── */}
      <section className="bg-band py-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="grid items-center gap-12 rounded-3xl border border-gold/30 bg-gradient-to-br from-surface-2 to-band p-8 sm:p-14 lg:grid-cols-[1.2fr_.8fr]">
            <div>
              <div className="mb-3.5 text-xs font-extrabold tracking-wide text-gold uppercase">
                {t('home.wcEyebrow')}
              </div>
              <DisplayHeading as="h2" className="text-4xl sm:text-5xl">
                {t('home.wcTitle')}
              </DisplayHeading>
              <p className="mt-4 max-w-md text-base leading-relaxed font-semibold text-muted-foreground">
                {t('home.wcBody')}
              </p>
              <div className="mt-7">
                <PillLink href={`/${locale}/world-cup/bracket`} variant="gold">
                  {t('home.wcCta')}
                </PillLink>
              </div>
            </div>
            <div className="flex justify-center">
              <Link
                href={`/${locale}/world-cup/bracket`}
                className="w-full max-w-xs rounded-2xl border border-gold/25 bg-surface p-6 transition-colors hover:border-gold/50"
              >
                <div className="mb-5 flex items-center justify-between">
                  <span className="text-[11px] font-extrabold tracking-wide text-muted-foreground uppercase">
                    {t('home.wcPreviewRound')}
                  </span>
                  <span className="text-[10.5px] font-extrabold text-gold uppercase">
                    {t('home.wcPreviewTag')}
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between rounded-lg bg-foreground/5 px-3.5 py-3 text-sm font-bold text-foreground">
                    <span>🇲🇽 México</span>
                    <span className="text-muted-foreground">vs</span>
                    <span>Inglaterra 🏴󠁧󠁢󠁥󠁮󠁧󠁿</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-foreground/5 px-3.5 py-3 text-sm font-bold text-foreground">
                    <span>🇺🇸 USA</span>
                    <span className="text-muted-foreground">vs</span>
                    <span>Bélgica 🇧🇪</span>
                  </div>
                </div>
                <div className="mt-4 text-[11.5px] font-bold text-muted-foreground">
                  {t('home.wcPreviewFooter')}
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
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
      </section>

      {/* ── LEAGUES ────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 pb-24 text-center sm:px-8">
        <DisplayHeading as="h2" className="mb-8 text-3xl sm:text-4xl">
          {t('home.leaguesTitle')}
        </DisplayHeading>
        <div className="flex flex-wrap justify-center gap-3">
          {LEAGUES.map((league) => (
            <LeagueChip
              key={league.name}
              logo={`https://media.api-sports.io/football/leagues/${league.id}.png`}
            >
              {league.name}
            </LeagueChip>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ──────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
        <div className="rounded-3xl bg-[linear-gradient(120deg,#5CF29A,#FFC145)] px-8 py-16 text-center sm:px-16 sm:py-20">
          <h2 className="font-display text-4xl leading-none tracking-wide text-[#06170D] uppercase sm:text-5xl md:text-[56px]">
            {t('home.finalCtaTitle')}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg font-bold text-[#06170D]/75">
            {t('home.finalCtaBody')}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3.5">
            <PillLink href={APP_STORE_URL} variant="dark">
              <DownloadGlyph /> {t('cta.appStore')}
            </PillLink>
            <PillLink href={PLAY_STORE_URL} variant="dark">
              <DownloadGlyph /> {t('cta.googlePlay')}
            </PillLink>
          </div>
        </div>
      </section>

      <SiteFooter locale={locale as Locale} />
    </div>
  );
}
