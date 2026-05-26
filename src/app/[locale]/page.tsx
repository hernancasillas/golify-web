'use client';

import { useI18n } from '@/components/I18nProvider';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from 'next/link';

export default function Home() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-gray-900 dark:to-black">
      {/* Header with language switcher and theme toggle */}
      <header className="container mx-auto px-4 py-4 flex justify-end gap-4">
        <ThemeToggle />
        <LanguageSwitcher />
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-green-600 dark:text-green-400 mb-6">
            {t('hero.title')}
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-4">
            {t('hero.subtitle')}
          </p>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            {t('hero.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white">
              {t('hero.downloadIOS')}
            </Button>
            <Button size="lg" variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
              {t('hero.downloadAndroid')}
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-12">
          {t('features.title')}
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <Card className="border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="text-green-600 dark:text-green-400">{t('features.matchTracking.title')}</CardTitle>
              <CardDescription>
                {t('features.matchTracking.description')}
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="text-green-600 dark:text-green-400">{t('features.retas.title')}</CardTitle>
              <CardDescription>
                {t('features.retas.description')}
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="text-green-600 dark:text-green-400">{t('features.eaFcCatalog.title')}</CardTitle>
              <CardDescription>
                {t('features.eaFcCatalog.description')}
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="text-green-600 dark:text-green-400">{t('features.notifications.title')}</CardTitle>
              <CardDescription>
                {t('features.notifications.description')}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Leagues Section */}
      <section className="container mx-auto px-4 py-16 bg-green-50 dark:bg-gray-800">
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
            <div key={league} className="bg-white dark:bg-gray-900 rounded-lg p-4 text-center font-semibold text-gray-700 dark:text-gray-300 shadow-sm">
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
            <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white">
              {t('cta.appStore')}
            </Button>
            <Button size="lg" variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
              {t('cta.googlePlay')}
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-gray-200 dark:border-gray-800">
        <div className="text-center text-gray-600 dark:text-gray-400 space-y-2">
          <p>{t('footer.copyright')}</p>
          <Link href="/privacy" className="text-green-600 dark:text-green-400 hover:underline text-sm">
            Privacy & Terms
          </Link>
        </div>
      </footer>
    </div>
  );
}
