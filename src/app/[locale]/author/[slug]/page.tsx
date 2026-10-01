import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { IndexShell, PieceList } from '@/components/editorial/IndexShell';
import { JsonLd } from '@/components/JsonLd';
import { Prose } from '@/components/editorial/Prose';
import { authorPath, getAuthor, getAuthors, piecesBy } from '@/lib/editorial/content';
import { asLocale } from '@/lib/editorial/locale';
import { renderMarkdown } from '@/lib/editorial/markdown';
import { authorNode } from '@/lib/editorial/schema';
import { STR } from '@/lib/editorial/strings';
import { ROUTE_LOCALES, sectionPath } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';

export const dynamicParams = false;

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateStaticParams() {
  return ROUTE_LOCALES.flatMap((locale) => getAuthors().map((a) => ({ locale, slug: a.slug })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: lp, slug } = await params;
  const locale = asLocale(lp);
  const a = getAuthor(slug);
  if (!a) return {};
  return pageMetadata({
    locale,
    path: (l) => authorPath(l, slug),
    title: `${a.name} · ${a.role}`,
    description: a.bio.slice(0, 158),
    type: 'profile',
    // An author page with no pieces in this language is a thin page.
    noindex: piecesBy(slug, locale).length === 0,
  });
}

export default async function AuthorPage({ params }: Props) {
  const { locale: lp, slug } = await params;
  const locale = asLocale(lp);
  const a = getAuthor(slug);
  if (!a) notFound();
  const t = STR[locale];
  const path = authorPath(locale, slug);
  const pieces = piecesBy(slug, locale);
  return (
    <IndexShell
      locale={locale}
      path={path}
      crumbs={[
        { name: t.home, path: `/${locale}` },
        { name: t.authors, path: sectionPath('author', locale) },
        { name: a.name },
      ]}
      title={a.name}
      lead={a.role}
    >
      <JsonLd data={authorNode(a, path)} />
      <p className="font-semibold text-foreground/90">{a.bio}</p>
      <div className="mt-4">
        <Prose html={renderMarkdown(a.body).html} />
      </div>
      {a.sameAs.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-2">
          {a.sameAs.map((u) => (
            <li key={u}>
              <a href={u} rel="me noopener" target="_blank" className="inline-block rounded-full border border-border bg-surface px-4 py-2 text-sm font-bold hover:border-primary">
                {new URL(u).hostname.replace(/^www\./, '')}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-4 text-sm font-bold">
        <Link href={sectionPath('editorialPolicy', locale)} className="text-primary underline underline-offset-2">
          {t.editorialPolicy}
        </Link>
      </p>
      <h2 className="mt-10 mb-4 font-display text-xl font-bold tracking-wide uppercase">
        {t.authorPieces} {a.name}
      </h2>
      {pieces.length ? <PieceList pieces={pieces} locale={locale} /> : <p className="font-semibold text-muted-foreground">{t.noPieces}</p>}
    </IndexShell>
  );
}
