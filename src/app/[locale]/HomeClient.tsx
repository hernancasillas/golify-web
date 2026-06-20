'use client';

import { useI18n } from '@/components/I18nProvider';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from 'next/image';
import Link from 'next/link';

export default function HomeClient() {
  const { t, locale } = useI18n();
  const en = locale === 'en';
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f0fdf4] to-white dark:from-[#06180E] dark:to-[#041008]">
      {/* Header with language switcher and theme toggle */}
      <header className="container mx-auto px-4 py-4 flex justify-end gap-4">
        <ThemeToggle />
        <LanguageSwitcher />
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <Image
            src="/icon.png"
            alt="Golify"
            width={96}
            height={96}
            className="mx-auto mb-6 rounded-2xl"
          />
          <h1 className="text-5xl md:text-7xl font-bold text-[#0d5e26] dark:text-[#71F59B] mb-6">
            {t('hero.title')}
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-4">
            {t('hero.subtitle')}
          </p>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            {t('hero.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-[#71F59B] hover:bg-[#4edd7a] text-[#06180E]" asChild>
              <a href="https://apps.apple.com/app/id6772339872" target="_blank" rel="noopener noreferrer">
                {t('hero.downloadIOS')}
              </a>
            </Button>
            <Button size="lg" variant="outline" className="border-[#0d5e26] text-[#0d5e26] dark:border-[#71F59B] dark:text-[#71F59B] hover:bg-[#71F59B]/10" asChild>
              <a href="https://play.google.com/store/apps/details?id=com.goligulias.fuchibol" target="_blank" rel="noopener noreferrer">
                {t('hero.downloadAndroid')}
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* World Cup 2026 spotlight — viral entry point to the live bracket.
          Links into the site so home visitors can explore; app download stays
          the primary CTA above and below. */}
      <section className="container mx-auto px-4 pb-4">
        <Link
          href={`/${locale}/world-cup/bracket`}
          className="group mx-auto block max-w-4xl rounded-2xl border-2 border-[#71F59B]/40 bg-[#e8fdf0] p-6 transition-colors hover:border-[#71F59B] sm:p-8 dark:bg-[#0d2414]"
        >
          <p className="text-sm font-bold uppercase tracking-wide text-[#0d5e26] dark:text-[#71F59B]">
            {en ? '🏆 World Cup 2026 · Live' : '🏆 Mundial 2026 · En vivo'}
          </p>
          <h2 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
            {en
              ? 'World Cup 2026 Bracket — live knockout projection'
              : 'Bracket del Mundial 2026 — proyección en vivo de la llave'}
          </h2>
          <p className="mt-2 text-base text-gray-600 dark:text-gray-400">
            {en
              ? 'See how the Round of 32 to the Final would look if the group stage ended right now. Updates with every result.'
              : 'Mira cómo quedarían los dieciseisavos hasta la final si la fase de grupos terminara ahora. Se actualiza con cada resultado.'}
          </p>
          <span className="mt-4 inline-flex items-center font-semibold text-[#0d5e26] group-hover:underline dark:text-[#71F59B]">
            {en ? 'See the bracket →' : 'Ver la llave →'}
          </span>
        </Link>
        <p className="mt-3 text-center text-sm">
          <Link
            href={`/${locale}/world-cup`}
            className="text-[#0d5e26] hover:underline dark:text-[#71F59B]"
          >
            {en
              ? 'Or browse the full World Cup 2026 schedule and results'
              : 'O explora el calendario y resultados completos del Mundial 2026'}
          </Link>
        </p>
      </section>

      {/* About Section — definitional prose for SEO/GEO brand-entity signals */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            {t('about.title')}
          </h2>
          <div className="space-y-4 text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
            <p>{t('about.p1')}</p>
            <p>{t('about.p2')}</p>
            <p>{t('about.p3')}</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-12">
          {t('features.title')}
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <Card className="border-[#71F59B]/25">
            <CardHeader>
              <CardTitle className="text-[#0d5e26] dark:text-[#71F59B]">{t('features.matchTracking.title')}</CardTitle>
              <CardDescription>
                {t('features.matchTracking.description')}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-[#71F59B]/25">
            <CardHeader>
              <CardTitle className="text-[#0d5e26] dark:text-[#71F59B]">{t('features.retas.title')}</CardTitle>
              <CardDescription>
                {t('features.retas.description')}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-[#71F59B]/25">
            <CardHeader>
              <CardTitle className="text-[#0d5e26] dark:text-[#71F59B]">{t('features.eaFcCatalog.title')}</CardTitle>
              <CardDescription>
                {t('features.eaFcCatalog.description')}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-[#71F59B]/25">
            <CardHeader>
              <CardTitle className="text-[#0d5e26] dark:text-[#71F59B]">{t('features.notifications.title')}</CardTitle>
              <CardDescription>
                {t('features.notifications.description')}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Leagues Section */}
      <section className="container mx-auto px-4 py-16 bg-[#e8fdf0] dark:bg-[#0d2414]">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-12">
          {t('leagues.title')}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-4xl mx-auto">
          {[
            "Premier League",
            "La Liga",
            "Bundesliga",
            "Serie A",
            "Ligue 1",
            "Liga MX",
            "MLS",
            "Saudi Pro League",
            "Argentina",
            "Primeira Liga"
          ].map((league) => (
            <div key={league} className="bg-white dark:bg-[#0d2414] rounded-lg p-4 text-center font-semibold text-gray-700 dark:text-gray-300 shadow-sm">
              {league}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            {t('cta.title')}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            {t('cta.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-[#71F59B] hover:bg-[#4edd7a] text-[#06180E]" asChild>
              <a href="https://apps.apple.com/app/id6772339872" target="_blank" rel="noopener noreferrer">
                {t('cta.appStore')}
              </a>
            </Button>
            <Button size="lg" variant="outline" className="border-[#0d5e26] text-[#0d5e26] dark:border-[#71F59B] dark:text-[#71F59B] hover:bg-[#71F59B]/10" asChild>
              <a href="https://play.google.com/store/apps/details?id=com.goligulias.fuchibol" target="_blank" rel="noopener noreferrer">
                {t('cta.googlePlay')}
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-gray-200 dark:border-[#71F59B]/10">
        <div className="text-center text-gray-600 dark:text-gray-400 space-y-4">
          <div className="flex justify-center gap-5">
            <a
              href="https://www.instagram.com/golify.futbol"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="text-gray-500 dark:text-gray-400 hover:text-[#0d5e26] dark:hover:text-[#71F59B] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                <circle cx="12" cy="12" r="4"/>
                <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
              </svg>
            </a>
            <a
              href="https://www.tiktok.com/@golify.futbol"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
              className="text-gray-500 dark:text-gray-400 hover:text-[#0d5e26] dark:hover:text-[#71F59B] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.74a4.85 4.85 0 0 1-1.01-.05z"/>
              </svg>
            </a>
          </div>
          <p>{t('footer.copyright')}</p>
          <div className="flex justify-center gap-5 text-sm">
            <Link href="/nosotros" className="text-[#0d5e26] dark:text-[#71F59B] hover:underline">
              {t('footer.about')}
            </Link>
            <Link href="/privacy" className="text-[#0d5e26] dark:text-[#71F59B] hover:underline">
              Privacy & Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
