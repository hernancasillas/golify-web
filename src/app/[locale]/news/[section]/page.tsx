import type { Metadata } from 'next';
import { IndexShell, PieceList } from '@/components/editorial/IndexShell';
import { NEWS_SECTIONS, getNews, sectionLabel } from '@/lib/editorial/content';
import { asLocale } from '@/lib/editorial/locale';
import { STR } from '@/lib/editorial/strings';
import { ROUTE_LOCALES, sectionPath } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import { notFound } from 'next/navigation';

export const dynamicParams = false;

type Props = { params: Promise<{ locale: string; section: string }> };

export async function generateStaticParams() {
  return ROUTE_LOCALES.flatMap((locale) =>
    NEWS_SECTIONS.map((section) => ({ locale, section })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: lp, section } = await params;
  const locale = asLocale(lp);
  const t = STR[locale];
  const label = sectionLabel(section, locale);
  return pageMetadata({
    locale,
    path: (l) => sectionPath('news', l, section),
    title: `${label} · ${t.newsTitle}`,
    description: `${label}: ${t.newsDesc}`,
    // Section pages are indexes: only worth indexing once they hold pieces.
    noindex: getNews(locale).filter((n) => n.section === section).length === 0,
  });
}

export default async function NewsSection({ params }: Props) {
  const { locale: lp, section } = await params;
  const locale = asLocale(lp);
  if (!(NEWS_SECTIONS as readonly string[]).includes(section)) notFound();
  const t = STR[locale];
  const items = getNews(locale).filter((n) => n.section === section);
  const path = sectionPath('news', locale, section);
  return (
    <IndexShell
      locale={locale}
      path={path}
      crumbs={[
        { name: t.home, path: `/${locale}` },
        { name: t.news, path: sectionPath('news', locale) },
        { name: sectionLabel(section, locale) },
      ]}
      title={sectionLabel(section, locale)}
    >
      {items.length ? <PieceList pieces={items} locale={locale} /> : <p className="font-semibold text-muted-foreground">{t.noPieces}</p>}
    </IndexShell>
  );
}
