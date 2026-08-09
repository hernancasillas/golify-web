import { I18nProvider } from '@/components/I18nProvider';
import { InAppBrowserBanner } from '@/components/InAppBrowserHint';
import { notFound } from 'next/navigation';

const locales = ['en', 'es'] as const;
type Locale = (typeof locales)[number];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  return (
    <I18nProvider locale={locale as Locale}>
      {/* Instagram/TikTok/Facebook webview → hint on how to escape it. */}
      <InAppBrowserBanner />
      {children}
    </I18nProvider>
  );
}
