import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/JsonLd';
import { breadcrumbNode, pageMetadata } from '@/lib/seo';
import { sectionPath } from '@/lib/routes';
import TermsClient from './TermsClient';

// Public URL is localized (/es/terms); the proxy rewrites it to this folder.
const STR = {
  es: { home: 'Inicio', title: 'Términos de uso', description: 'Condiciones de uso de Golify: cuentas, contenido, suspensión, exención de responsabilidad y cambios a los términos.' },
  pt: { home: 'Início', title: 'Termos de uso', description: 'Condições de uso da Golify: contas, conteúdo, suspensão, isenção de responsabilidade e mudanças nos termos.' },
  en: { home: 'Home', title: 'Terms of use', description: 'Golify terms of use: accounts, content, termination, disclaimer and changes to the terms.' },
} as const;

type P = { params: Promise<{ locale: string }> };
const path = (l: 'es' | 'pt' | 'en') => sectionPath('terms', l);
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
      <TermsClient />
    </>
  );
}
