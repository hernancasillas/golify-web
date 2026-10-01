import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PieceArticle } from '@/components/editorial/PieceArticle';
import { getNews, getNewsPiece, localesOf, piecePath } from '@/lib/editorial/content';
import { asLocale } from '@/lib/editorial/locale';
import { ROUTE_LOCALES } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';

export const dynamicParams = false;
export const revalidate = 86400;

type Props = { params: Promise<{ locale: string; section: string; slug: string }> };

export async function generateStaticParams() {
  return ROUTE_LOCALES.flatMap((locale) =>
    getNews(locale).map((n) => ({ locale, section: n.section ?? 'noticia', slug: n.slug })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: lp, section, slug } = await params;
  const locale = asLocale(lp);
  const n = getNewsPiece(locale, section, slug);
  if (!n) return {};
  return pageMetadata({
    locale,
    path: (l) => piecePath(n, l),
    locales: localesOf(n),
    title: n.seoTitle ?? n.title,
    description: n.description,
    type: 'article',
    publishedTime: n.published,
    modifiedTime: n.updated,
    images: n.image ? [{ url: n.image.url, alt: n.image.alt }] : undefined,
  });
}

export default async function NewsPage({ params }: Props) {
  const { locale: lp, section, slug } = await params;
  const locale = asLocale(lp);
  const n = getNewsPiece(locale, section, slug);
  if (!n) notFound();
  return <PieceArticle piece={n} locale={locale} path={piecePath(n)} />;
}
