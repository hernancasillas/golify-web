import type { Metadata } from 'next';
import { IndexShell, PieceList } from '@/components/editorial/IndexShell';
import { getGuides } from '@/lib/editorial/content';
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
    path: (l) => sectionPath('guides', l),
    title: t.guidesTitle,
    description: t.guidesDesc,
    noindex: getGuides(locale).length === 0,
  });
}

export default async function GuidesIndex({ params }: Props) {
  const locale = asLocale((await params).locale);
  const t = STR[locale];
  const guides = getGuides(locale);
  const path = sectionPath('guides', locale);
  return (
    <IndexShell
      locale={locale}
      path={path}
      crumbs={[{ name: t.home, path: `/${locale}` }, { name: t.guides }]}
      title={t.guidesH1}
      lead={t.guidesDesc}
    >
      {guides.length ? <PieceList pieces={guides} locale={locale} /> : <p className="font-semibold text-muted-foreground">{t.noPieces}</p>}
    </IndexShell>
  );
}
