import { I18nProvider } from '@/components/I18nProvider';
import { locales } from '@/i18n';
import { notFound } from 'next/navigation';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) {
    notFound();
  }

  return (
    <I18nProvider locale={locale as 'en' | 'es'}>
      {children}
    </I18nProvider>
  );
}
