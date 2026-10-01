import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { JsonLd } from '@/components/JsonLd';
import { Breadcrumbs } from '@/components/blocks/Breadcrumbs';
import { FaqSection } from '@/components/blocks/FaqSection';
import { AppCard, HowItWorks } from '@/components/pool/blocks';
import { dayMonth, homeZone, loadPoolLeague, loadRoundFixtures, totalPicks } from '@/components/pool/data';
import { countOf, fmtInt, poolStr, tpl } from '@/components/pool/strings';
import { fixturePhase } from '@/lib/api-football';
import { getPickSplits } from '@/lib/community';
import { COMPETITIONS, competitionName, roundLabel, roundWord, seasonLabel } from '@/lib/competitions';
import { ROUTE_LOCALES, homePath, poolPath, sectionPath, type RouteLocale } from '@/lib/routes';
import { absolute, pageMetadata } from '@/lib/seo';
import { installLink, type Locale } from '@/lib/site';

// "Quinielas por jornada" — the nav target of the pool section. One card per
// covered competition with the round in progress, linked to its public
// quiniela, and the community pick count when Golify has one.
//
// Cost: three cached calls per competition (league → season, current round,
// that round's fixtures) and one Supabase RPC for every fixture at once. The
// league lookups are cached for a day and the rest for 10 minutes, and the
// page itself regenerates at most hourly, so a crawl of this URL costs
// nothing extra.

export const revalidate = 3600;

type Params = { locale: string };

function asLocale(v: string): RouteLocale | null {
  return (ROUTE_LOCALES as readonly string[]).includes(v) ? (v as RouteLocale) : null;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const locale = asLocale((await params).locale);
  if (!locale) notFound();
  const t = poolStr(locale);
  return pageMetadata({
    locale,
    path: (l) => sectionPath('pool', l),
    title: t.ixMetaTitle,
    description: t.ixMetaDesc,
    appRoute: 'quiniela',
  });
}

async function loadCards() {
  const leagues = await Promise.all(
    COMPETITIONS.map(async (comp) => {
      const data = await loadPoolLeague(comp).catch(() => null);
      if (!data) return null;
      // A failed fixtures call only costs this card its pick count; the link
      // itself comes from the league info, so the hub keeps rendering.
      const fixtures = data.currentRaw
        ? await loadRoundFixtures(comp.id, data.season, data.currentRaw).catch(() => [])
        : [];
      return { comp, data, fixtures };
    }),
  );
  const rows = leagues.filter((x): x is NonNullable<typeof x> => x !== null);
  // getPickSplits takes up to 300 ids per call.
  const ids = rows.flatMap((r) => r.fixtures.map((f) => f.fixture.id));
  const chunks: number[][] = [];
  for (let i = 0; i < ids.length; i += 300) chunks.push(ids.slice(i, i + 300));
  const maps = await Promise.all(chunks.map((c) => getPickSplits(c)));
  const splits = new Map(maps.flatMap((m) => [...m]));
  return rows.map((r) => ({ ...r, picks: totalPicks(splits, r.fixtures) }));
}

export default async function PoolIndexPage({ params }: { params: Promise<Params> }) {
  const locale = asLocale((await params).locale);
  if (!locale) notFound();
  const t = poolStr(locale);
  const path = sectionPath('pool', locale);
  const cards = await loadCards();
  const ctaHref = installLink('quiniela', 'pool-index');

  const faq: [string, string][] = [
    [t.ixFaqWhat, t.ixFaqWhatA],
    [t.faqScore, t.faqScoreA],
    [t.faqFree, t.faqFreeA],
  ];

  const linked = cards
    .map((c) => ({
      name: competitionName(c.comp, locale),
      href: c.data.current ? poolPath(locale, c.comp.id, c.data.current.n) : c.data.currentRaw ? poolPath(locale, c.comp.id) : null,
    }))
    .filter((c): c is { name: string; href: string } => !!c.href);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          '@id': `${absolute(path)}#pools`,
          name: t.ixH1,
          numberOfItems: linked.length,
          itemListElement: linked.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, url: absolute(c.href) })),
        }}
      />
      <SiteNav />

      <main className="mx-auto max-w-6xl px-4 pt-2 pb-16 sm:px-6">
        <Breadcrumbs currentPath={path} crumbs={[{ name: t.home, path: homePath(locale) }, { name: t.pools }]} />

        <section className="mt-5 rounded-3xl border border-border bg-gradient-to-br from-gold/15 via-surface to-surface p-5 sm:p-8">
          <h1 className="font-display text-4xl leading-[0.95] font-bold tracking-wide uppercase sm:text-6xl">{t.ixH1}</h1>
          <p className="mt-4 max-w-[68ch] leading-relaxed font-semibold text-muted-foreground">{t.ixLead}</p>
        </section>

        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map(({ comp, data, fixtures, picks }) => {
            const name = competitionName(comp, locale);
            const season = seasonLabel(comp, { apiSeason: data.season, phase: data.phase }, locale);
            const current = data.current;
            const label = current
              ? `${roundWord(comp, locale)} ${current.n}`
              : data.currentRaw
                ? roundLabel(data.currentRaw, locale, comp)
                : t.ixNoRound;
            const href = current
              ? poolPath(locale, comp.id, current.n)
              : data.currentRaw
                ? poolPath(locale, comp.id)
                : null;
            const upcoming = fixtures.find((f) => fixturePhase(f) === 'scheduled') ?? fixtures[0];
            const { zone } = homeZone(comp, locale);
            const body = (
              <>
                <span className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white">
                    <Image src={data.info.league.logo} alt="" width={28} height={28} unoptimized className="h-7 w-7 object-contain" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-bold">{name}</span>
                    <span className="block text-xs font-semibold text-muted-foreground">{season}</span>
                  </span>
                </span>
                <span className="mt-3 block font-display text-xl font-bold tracking-wide uppercase">{label}</span>
                {upcoming ? (
                  <span className="mt-1 block text-sm font-semibold text-muted-foreground">
                    {tpl(t.ixMatches, {
                      count: countOf(fixtures.length, t.match, locale),
                      date: dayMonth(upcoming.fixture.date, zone, locale),
                    })}
                  </span>
                ) : null}
                {picks > 0 ? (
                  <span className="mt-1 block text-sm font-bold text-primary">
                    {tpl(t.ixPredictions, { n: fmtInt(picks, locale) })}
                  </span>
                ) : null}
              </>
            );
            return (
              <li key={comp.id}>
                {href ? (
                  <Link
                    href={href}
                    className="block h-full rounded-2xl border border-border bg-surface p-4 transition hover:border-primary/60"
                  >
                    {body}
                  </Link>
                ) : (
                  <div className="h-full rounded-2xl border border-border bg-surface p-4 opacity-70">{body}</div>
                )}
              </li>
            );
          })}
        </ul>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <HowItWorks locale={locale} />
          <AppCard locale={locale} href={ctaHref} campaign="pool-index" placement="index" />
        </div>

        <FaqSection title={t.faqTitle} entries={faq} pagePath={path} />
      </main>

      <SiteFooter locale={locale as Locale} />
    </div>
  );
}
