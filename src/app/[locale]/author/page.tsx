import type { Metadata } from 'next';
import Link from 'next/link';
import { IndexShell } from '@/components/editorial/IndexShell';
import { authorPath, getAuthors, piecesBy } from '@/lib/editorial/content';
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
    path: (l) => sectionPath('author', l),
    title: t.authorTitle,
    description: t.authorDesc,
  });
}

export default async function AuthorIndex({ params }: Props) {
  const locale = asLocale((await params).locale);
  const t = STR[locale];
  return (
    <IndexShell
      locale={locale}
      path={sectionPath('author', locale)}
      crumbs={[{ name: t.home, path: `/${locale}` }, { name: t.authors }]}
      title={t.authorH1}
      lead={t.authorDesc}
    >
      <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
        {getAuthors().map((a) => (
          <li key={a.slug}>
            <Link href={authorPath(locale, a.slug)} className="block p-5 hover:bg-surface-2">
              <h2 className="text-lg font-bold">{a.name}</h2>
              <p className="text-sm font-bold text-primary">{a.role}</p>
              <p className="mt-1 font-semibold text-muted-foreground">{a.bio}</p>
              <p className="mt-2 text-xs font-bold text-muted-foreground">
                {piecesBy(a.slug, locale).length} {t.pieces}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </IndexShell>
  );
}
