import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PieceArticle } from '@/components/editorial/PieceArticle';
import { getGuide, getGuides, localesOf, piecePath } from '@/lib/editorial/content';
import { asLocale } from '@/lib/editorial/locale';
import { ROUTE_LOCALES } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';

// Static at build from src/content/guides; revalidated daily so the related
// links (names resolved through the API) heal if a build-time call failed.
export const dynamicParams = false;
export const revalidate = 86400;

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateStaticParams() {
  return ROUTE_LOCALES.flatMap((locale) => getGuides(locale).map((g) => ({ locale, slug: g.slug })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: lp, slug } = await params;
  const locale = asLocale(lp);
  const g = getGuide(locale, slug);
  if (!g) return {};
  return pageMetadata({
    locale,
    path: (l) => piecePath(g, l),
    locales: localesOf(g),
    title: g.seoTitle ?? g.title,
    description: g.description,
    type: 'article',
    publishedTime: g.published,
    modifiedTime: g.updated,
  });
}

export default async function GuidePage({ params }: Props) {
  const { locale: lp, slug } = await params;
  const locale = asLocale(lp);
  const g = getGuide(locale, slug);
  if (!g) notFound();
  return <PieceArticle piece={g} locale={locale} path={piecePath(g)} />;
}
