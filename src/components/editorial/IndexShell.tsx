import Link from 'next/link';
import type { ReactNode } from 'react';
import { Breadcrumbs } from '@/components/blocks/Breadcrumbs';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import type { Crumb } from '@/lib/seo';
import type { RouteLocale } from '@/lib/routes';
import { piecePath, sectionLabel, getAuthor, type Piece } from '@/lib/editorial/content';
import { STR, fmtDate } from '@/lib/editorial/strings';

/** Page chrome for index-style pages (lists of guides/news/authors/reports). */
export function IndexShell({
  locale,
  crumbs,
  path,
  title,
  lead,
  children,
}: {
  locale: RouteLocale;
  crumbs: Crumb[];
  path: string;
  title: string;
  lead?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />
      <main className="mx-auto max-w-3xl px-5 pt-3 pb-16 sm:px-8">
        <Breadcrumbs crumbs={crumbs} currentPath={path} />
        <h1 className="mt-5 font-display text-3xl leading-tight font-bold tracking-wide uppercase sm:text-5xl">{title}</h1>
        {lead ? <p className="mt-3 font-semibold text-muted-foreground">{lead}</p> : null}
        <div className="mt-8">{children}</div>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}

export function PieceList({ pieces, locale }: { pieces: Piece[]; locale: RouteLocale }) {
  const t = STR[locale];
  return (
    <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
      {pieces.map((p) => (
        <li key={p.kind + p.slug}>
          <Link href={piecePath(p)} className="block p-5 hover:bg-surface-2">
            <p className="text-xs font-extrabold tracking-wide text-primary uppercase">
              {p.kind === 'guide' ? t.guides.replace(/s$/, '') : sectionLabel(p.section ?? 'noticia', locale)}
              {' · '}
              <span className="text-muted-foreground">{fmtDate(p.updated, locale)}</span>
            </p>
            <h2 className="mt-1 text-lg font-bold">{p.title}</h2>
            <p className="mt-1 font-semibold text-muted-foreground">{p.description}</p>
            <p className="mt-2 text-xs font-bold text-muted-foreground">{getAuthor(p.author)?.name}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
