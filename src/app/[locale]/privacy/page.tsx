import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/JsonLd';
import { breadcrumbNode, pageMetadata } from '@/lib/seo';
import { sectionPath } from '@/lib/routes';
import PrivacyClient from './PrivacyClient';

// Public URL is localized (/es/privacy); the proxy rewrites it to this folder.
const STR = {
  es: { home: 'Inicio', title: 'Política de privacidad', description: 'Cómo Golify trata tus datos en la app y en golify.futbol: qué recogemos, cookies, analítica, publicidad, tus derechos y cómo borrar tu cuenta.' },
  pt: { home: 'Início', title: 'Política de privacidade', description: 'Como a Golify trata seus dados no app e em golify.futbol: o que coletamos, cookies, análise, publicidade, seus direitos e como excluir sua conta.' },
  en: { home: 'Home', title: 'Privacy policy', description: 'How Golify handles your data in the app and on golify.futbol: what we collect, cookies, analytics, advertising, your rights and how to delete your account.' },
} as const;

type P = { params: Promise<{ locale: string }> };
const path = (l: 'es' | 'pt' | 'en') => sectionPath('privacy', l);
const isLoc = (l: string): l is 'es' | 'pt' | 'en' => l === 'es' || l === 'pt' || l === 'en';

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale } = await params;
  if (!isLoc(locale)) return {};
  return pageMetadata({ locale, path, title: STR[locale].title, description: STR[locale].description });
}

export default async function Page({ params }: P) {
  const { locale } = await params;
  if (!isLoc(locale)) notFound();
  return (
    <>
      <JsonLd data={breadcrumbNode([{ name: STR[locale].home, path: `/${locale}` }, { name: STR[locale].title }], path(locale))} />
      <PrivacyClient />
    </>
  );
}
