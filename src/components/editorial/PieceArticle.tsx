import Link from 'next/link';
import { nationName } from '@/lib/nations';
import { Breadcrumbs } from '@/components/blocks/Breadcrumbs';
import { FaqSection } from '@/components/blocks/FaqSection';
import { JsonLd } from '@/components/JsonLd';
import { InstallCTA } from '@/components/InstallCTA';
import { AdSlot } from '@/components/ads/AdSlot';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { Prose } from '@/components/editorial/Prose';
import { apiFootballGet, getFixtureById, type Fixture } from '@/lib/api-football';
import { competitionById, competitionName } from '@/lib/competitions';
import {
  competitionPath,
  matchPath,
  poolPath,
  sectionPath,
  teamPath,
  whereToWatchPath,
  type RouteLocale,
} from '@/lib/routes';
import { getAuthor, authorPath, sectionLabel, type Piece } from '@/lib/editorial/content';
import { renderMarkdown } from '@/lib/editorial/markdown';
import { articleNode } from '@/lib/editorial/schema';
import { STR, fmtDate } from '@/lib/editorial/strings';

// Shared template for guides (evergreen) and news. Layout from the CEO's
// Articulo/Guia designs, with the site's own palette. Related links resolve
// names through the API with small bounded calls; any failure just drops the
// link block (the article itself never depends on it).

interface Rel {
  label: string;
  href: string;
}

async function relatedLinks(p: Piece, locale: RouteLocale): Promise<Rel[]> {
  const t = STR[locale];
  const out: Rel[] = [];
  if (p.fixture) {
    try {
      const f: Fixture | null = await getFixtureById(p.fixture);
      if (f) out.push({ label: `${t.match}: ${nationName(f.teams.home.name, locale)} - ${nationName(f.teams.away.name, locale)}`, href: matchPath(locale, f) });
    } catch {
      /* skip */
    }
  }
  for (const id of p.teams.slice(0, 4)) {
    try {
      const rows = await apiFootballGet<{ team: { id: number; name: string } }>('/teams', { id }, { revalidate: 86400 * 7 });
      const team = rows[0]?.team;
      if (team) out.push({ label: `${t.team}: ${nationName(team.name, locale)}`, href: teamPath(locale, team) });
    } catch {
      /* skip */
    }
  }
  for (const id of p.leagues.slice(0, 4)) {
    const c = competitionById(id);
    if (!c) continue;
    const name = competitionName(c, locale);
    const hub = competitionPath(locale, id);
    if (hub) out.push({ label: `${t.hubLabel} ${name}`, href: hub });
    const pool = poolPath(locale, id);
    if (pool) out.push({ label: `${t.pool} ${name}`, href: pool });
    const w = whereToWatchPath(locale, id);
    if (w) out.push({ label: `${t.watch} ${name}`, href: w });
  }
  return out;
}

export async function PieceArticle({ piece: p, locale, path }: { piece: Piece; locale: RouteLocale; path: string }) {
  const t = STR[locale];
  const author = getAuthor(p.author);
  const byPath = authorPath(locale, p.author);
  const { html, toc } = renderMarkdown(p.body);
  const related = await relatedLinks(p, locale);
  const isGuide = p.kind === 'guide';
  const rootPath = isGuide ? sectionPath('guides', locale) : sectionPath('news', locale);
  const crumbs = [
    { name: t.home, path: `/${locale}` },
    { name: isGuide ? t.guides : t.news, path: rootPath },
    ...(p.section ? [{ name: sectionLabel(p.section, locale) }] : []),
    { name: p.title },
  ];
  // The section crumb has no page of its own in the news tree root; link it to
  // the section index which exists (news/[section]).
  if (p.section) crumbs[2] = { name: sectionLabel(p.section, locale), path: sectionPath('news', locale, p.section) } as (typeof crumbs)[number];
  crumbs[crumbs.length - 1] = { name: p.title } as (typeof crumbs)[number];

  const updatedLabel = isGuide ? t.updatedOn : t.updatedOnNews;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />
      <JsonLd data={articleNode(p, author, path, byPath)} />
      <main className="mx-auto max-w-3xl px-5 pt-3 pb-16 sm:px-8">
        <Breadcrumbs crumbs={crumbs} currentPath={path} />
        <article className="mt-5">
          <header>
            <p className="text-xs font-extrabold tracking-wide text-primary uppercase">
              {p.liveBlog ? <span className="mr-2 rounded bg-live px-2 py-0.5 text-white">{t.liveBlog}</span> : null}
              {isGuide ? t.guides : sectionLabel(p.section ?? 'noticia', locale)}
            </p>
            <h1 className="mt-2 font-display text-3xl leading-tight font-bold tracking-wide uppercase sm:text-5xl">{p.title}</h1>
            <p className="mt-4 text-sm font-semibold text-muted-foreground">
              {t.by}{' '}
              <Link href={byPath} className="font-bold text-foreground underline underline-offset-2">
                {author?.name ?? 'Redacción Golify'}
              </Link>
              {' · '}
              {t.publishedOn} <time dateTime={p.published}>{fmtDate(p.published, locale, !isGuide)}</time>
              {p.updated !== p.published ? (
                <>
                  {' · '}
                  {updatedLabel} <time dateTime={p.updated}>{fmtDate(p.updated, locale, !isGuide)}</time>
                </>
              ) : null}
            </p>
          </header>

          {p.answer ? (
            <p className="mt-6 rounded-2xl border border-primary/40 bg-primary/10 p-5 text-lg leading-relaxed font-bold text-foreground">
              {p.answer}
            </p>
          ) : null}

          {p.image ? (
            <figure className="mt-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.image.url} alt={p.image.alt} className="h-auto w-full rounded-2xl" />
              {p.image.credit ? <figcaption className="mt-1.5 text-xs font-semibold text-muted-foreground">{p.image.credit}</figcaption> : null}
            </figure>
          ) : null}

          {isGuide && toc.length > 2 ? (
            <nav aria-label={t.toc} className="mt-6 rounded-2xl border border-border bg-surface p-5">
              <p className="text-xs font-extrabold tracking-wide text-muted-foreground uppercase">{t.toc}</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5 font-semibold">
                {toc.map((h) => (
                  <li key={h.id}>
                    <a href={`#${h.id}`} className="hover:text-primary">{h.text}</a>
                  </li>
                ))}
              </ol>
            </nav>
          ) : null}

          {p.liveBlog && p.updates.length > 0 ? (
            <section className="mt-8" aria-label={t.liveBlogLead}>
              <h2 className="font-display text-xl font-bold tracking-wide uppercase">{t.liveBlogLead}</h2>
              <ol className="mt-3 space-y-3 border-l-2 border-live pl-4">
                {[...p.updates].sort((a, b) => b.time.localeCompare(a.time)).map((u) => (
                  <li key={u.time + u.text.slice(0, 12)}>
                    <time dateTime={u.time} className="text-xs font-extrabold text-live">{fmtDate(u.time, locale, true)}</time>
                    <p className="mt-0.5 font-semibold">{u.text}</p>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          <div className="mt-6">
            <Prose html={html} />
          </div>
          {/* Below the first content block (answer + start of the body). */}
          <AdSlot id={isGuide ? 'guide-end' : 'news-end'} format="in-article" />
        </article>

        <FaqSection
          title={t.faq}
          entries={p.faq.map((f) => [f.q, f.a])}
          pagePath={path}
        />

        {related.length > 0 ? (
          <section className="mt-10">
            <h2 className="font-display text-xl font-bold tracking-wide uppercase">{t.related}</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {related.map((r) => (
                <li key={r.href + r.label}>
                  <Link href={r.href} className="inline-block rounded-full border border-border bg-surface px-4 py-2 text-sm font-bold hover:border-primary">
                    {r.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {p.sources.length > 0 ? (
          <section className="mt-10">
            <h2 className="font-display text-xl font-bold tracking-wide uppercase">{t.sources}</h2>
            <ul className="mt-3 list-disc space-y-1 pl-5 font-semibold text-muted-foreground">
              {p.sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} rel="noopener" target="_blank" className="underline underline-offset-2 hover:text-foreground">{s.title}</a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-12 rounded-3xl border border-border bg-band p-6">
          <h2 className="font-display text-xl font-bold tracking-wide uppercase">{t.ctaTitle}</h2>
          <p className="mt-2 mb-4 font-semibold text-muted-foreground">{t.ctaBody}</p>
          <InstallCTA labels={{ open: t.open, ios: t.ios, android: t.android }} />
        </section>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
