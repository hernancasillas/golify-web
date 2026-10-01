import type { Metadata } from 'next';
import Link from 'next/link';
import { IndexShell, PieceList } from '@/components/editorial/IndexShell';
import { NEWS_SECTIONS, getNews, sectionLabel } from '@/lib/editorial/content';
import { asLocale } from '@/lib/editorial/locale';
import { STR } from '@/lib/editorial/strings';
import { sectionPath } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = asLocale((await params).locale);
  const t = STR[locale];
  return pageMetadata({
    locale,
    path: (l) => sectionPath('news', l),
    title: t.newsTitle,
    description: t.newsDesc,
    noindex: getNews(locale).length === 0,
  });
}

export default async function NewsIndex({ params }: Props) {
  const locale = asLocale((await params).locale);
  const t = STR[locale];
  const news = getNews(locale);
  const used = NEWS_SECTIONS.filter((s) => news.some((n) => n.section === s));
  return (
    <IndexShell
      locale={locale}
      path={sectionPath('news', locale)}
      crumbs={[{ name: t.home, path: `/${locale}` }, { name: t.news }]}
      title={t.newsH1}
      lead={t.newsDesc}
    >
      {used.length > 1 ? (
        <ul className="mb-6 flex flex-wrap gap-2">
          {used.map((s) => (
            <li key={s}>
              <Link href={sectionPath('news', locale, s)} className="inline-block rounded-full border border-border bg-surface px-4 py-2 text-sm font-bold hover:border-primary">
                {sectionLabel(s, locale)}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      {news.length ? <PieceList pieces={news} locale={locale} /> : <p className="font-semibold text-muted-foreground">{t.noPieces}</p>}
    </IndexShell>
  );
}
