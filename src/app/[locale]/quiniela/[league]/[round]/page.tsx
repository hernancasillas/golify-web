import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { cache } from 'react';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { LocalTimeScript } from '@/components/LocalTime';
import { JsonLd } from '@/components/JsonLd';
import { Breadcrumbs } from '@/components/blocks/Breadcrumbs';
import { FaqSection } from '@/components/blocks/FaqSection';
import { KickoffTable } from '@/components/blocks/KickoffTable';
import { AdSlot } from '@/components/ads/AdSlot';
import { PoolPicker } from '@/components/pool/PoolPicker';
import {
  AppCard,
  HowItWorks,
  InsightCard,
  StatTile,
  communityInsight,
  roundEventsNode,
  toPickerMatches,
} from '@/components/pool/blocks';
import {
  INDEX_THRESHOLD,
  dayMonth,
  homeZone,
  loadPoolLeague,
  loadRoundFixtures,
  playedSpan,
  splitsFor,
  tallyRound,
  totalPicks,
} from '@/components/pool/data';
import { countOf, datesSpan, fmtInt, poolStr, tpl } from '@/components/pool/strings';
import { fixturePhase } from '@/lib/api-football';
import {
  competitionById,
  competitionBySlug,
  competitionName,
  roundWord,
  seasonLabel,
  seasonSlug,
} from '@/lib/competitions';
import {
  ROUTE_LOCALES,
  competitionPath,
  homePath,
  poolPath,
  sectionPath,
  subsection,
  subsectionFromSegment,
  type RouteLocale,
} from '@/lib/routes';
import { idFromSlug } from '@/lib/slug';
import { absolute, pageMetadata } from '@/lib/seo';
import { installLink } from '@/lib/site';
import { withUtm } from '@/lib/analytics';
import { longDateIn, shortDateIn, timeIn } from '@/lib/timezones';
import type { Locale } from '@/lib/site';

// Public quiniela of one round: /es/quiniela/liga-mx/jornada-12,
// /pt/bolao/brasileirao/rodada-21, /en/pool/premier-league/matchday-6.
//
// The round lives in the league's CURRENT season (see components/pool/data).
// What makes the page worth indexing is Golify's own data — the community
// split of every match — so it is indexed only once the round gathers
// ≥ 50 picks (plan A4); below that it renders the same page as
// noindex,follow, with no ads.

export const revalidate = 300;

export async function generateStaticParams() {
  return [];
}

type Params = { locale: string; league: string; round: string };

function asLocale(v: string): RouteLocale | null {
  return (ROUTE_LOCALES as readonly string[]).includes(v) ? (v as RouteLocale) : null;
}

/** `jornada-12` in any locale's spelling → 12. */
function parseRoundSegment(seg: string): number | null {
  const m = /^([a-z]+)-(\d{1,3})$/.exec(seg);
  if (!m || !subsectionFromSegment(m[1], ['round'])) return null;
  const n = Number(m[2]);
  return n > 0 ? n : null;
}

// generateMetadata and the page share one resolution (fetches are memoized
// by Next; the Supabase RPC is not, hence the cache()).
const resolve = cache(async (localeParam: string, league: string, round: string) => {
  const locale = asLocale(localeParam);
  if (!locale) notFound();
  const n = parseRoundSegment(round);
  if (n == null) notFound();

  const comp = competitionBySlug(league);
  if (!comp) {
    // Legacy / guessed spelling with the league id (`262`, `liga-mx-262`).
    const id = idFromSlug(league);
    const byId = id ? competitionById(id) : null;
    if (byId) permanentRedirect(poolPath(locale, byId.id, n)!);
    notFound();
  }
  // Wrong-locale round word or a padded number → the canonical spelling.
  if (round !== `${subsection('round', locale)}-${n}`) permanentRedirect(poolPath(locale, comp.id, n)!);

  const data = await loadPoolLeague(comp, { withRounds: true });
  if (!data) notFound();
  const idx = data.rounds.findIndex((r) => r.n === n);
  if (idx < 0) notFound();
  const ref = data.rounds[idx];

  const past = data.current ? n < data.current.n : false;
  const fixtures = await loadRoundFixtures(comp.id, data.season, ref.raw, { past });
  if (fixtures.length === 0) notFound();

  const splits = await splitsFor(fixtures);
  const picks = totalPicks(splits, fixtures);
  return {
    locale,
    n,
    comp,
    data,
    fixtures,
    splits,
    picks,
    indexable: picks >= INDEX_THRESHOLD,
    prev: data.rounds[idx - 1] ?? null,
    next: data.rounds[idx + 1] ?? null,
  };
});

function labels(r: Awaited<ReturnType<typeof resolve>>) {
  const { locale, comp, n, data } = r;
  const league = competitionName(comp, locale);
  const roundLbl = `${roundWord(comp, locale)} ${n}`;
  const season = seasonLabel(comp, { apiSeason: data.season, phase: data.phase }, locale);
  return { league, roundLbl, season };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const p = await params;
  const r = await resolve(p.locale, p.league, p.round);
  const t = poolStr(r.locale);
  const { league, roundLbl, season } = labels(r);
  const { zone } = homeZone(r.comp, r.locale);
  const tally = tallyRound(r.fixtures);
  const done = r.fixtures.every((f) => fixturePhase(f) === 'finished' || fixturePhase(f) === 'off') && tally.played > 0;
  const [firstF, lastF] = playedSpan(r.fixtures);
  const first = dayMonth(firstF.fixture.date, zone, r.locale);
  const last = dayMonth(lastF.fixture.date, zone, r.locale);
  const vars = {
    league,
    round: roundLbl,
    season,
    count: countOf(r.fixtures.length, t.match, r.locale),
    dates: datesSpan(first, last, r.locale),
  };
  return pageMetadata({
    locale: r.locale,
    path: (l) => poolPath(l, r.comp.id, r.n)!,
    title: tpl(t.metaTitle, vars),
    description: tpl(done ? t.metaDescDone : t.metaDesc, vars),
    noindex: !r.indexable,
    appRoute: 'quiniela',
  });
}

export default async function PoolRoundPage({ params }: { params: Promise<Params> }) {
  const p = await params;
  const r = await resolve(p.locale, p.league, p.round);
  const { locale, comp, n, data, fixtures, splits, picks, indexable, prev, next } = r;
  const t = poolStr(locale);
  const { league, roundLbl, season } = labels(r);
  const { zone, label: zoneLabel } = homeZone(comp, locale);
  const zoneText = tpl(t.zoneTime, { zone: zoneLabel });
  const path = poolPath(locale, comp.id, n)!;
  const campaign = `pool-${comp.slug}-${n}`;
  const ctaHref = installLink('quiniela', campaign);
  const tally = tallyRound(fixtures);
  const [first, last] = playedSpan(fixtures);
  const done = fixtures.every((f) => fixturePhase(f) === 'finished' || fixturePhase(f) === 'off') && tally.played > 0;

  // ---- Conditional copy over real data ----
  const results = {
    h: countOf(tally.homeWins, t.homeWin, locale),
    d: countOf(tally.draws, t.draw, locale),
    a: countOf(tally.awayWins, t.awayWin, locale),
    goals: countOf(tally.goals, t.goal, locale),
  };
  const lead =
    tally.played === 0
      ? tpl(t.leadUpcoming, {
          count: countOf(fixtures.length, t.match, locale),
          dates: datesSpan(dayMonth(first.fixture.date, zone, locale), dayMonth(last.fixture.date, zone, locale), locale),
          zone: zoneText,
          home: first.teams.home.name,
          away: first.teams.away.name,
        })
      : done
        ? tpl(t.leadDone, { ...results, round: roundLbl, count: countOf(tally.played, t.match, locale) })
        : tpl(t.leadProgress, { ...results, played: tally.played, total: fixtures.length });
  const leadPicks = picks > 0 ? tpl(t.leadPicks, { n: fmtInt(picks, locale) }) : t.leadNoPicks;

  const nextOpen = tally.nextOpen;
  const faq: [string, string][] = [
    [
      tpl(t.faqHow, { round: roundLbl, league }),
      `${tpl(t.faqHowA, { count: countOf(fixtures.length, t.match, locale) })} ${
        nextOpen
          ? tpl(t.faqHowNext, {
              home: nextOpen.teams.home.name,
              away: nextOpen.teams.away.name,
              date: longDateIn(nextOpen.fixture.date, zone, locale),
              time: timeIn(nextOpen.fixture.date, zone, locale),
              zone: zoneText,
            })
          : t.faqHowClosed
      }`,
    ],
    [t.faqScore, t.faqScoreA],
    [t.faqFree, t.faqFreeA],
    [t.faqSaved, t.faqSavedA],
  ];

  const sSlug = seasonSlug(comp, { apiSeason: data.season, phase: data.phase });
  const roundPage = competitionPath(locale, comp.id, sSlug, { round: n });
  const printable = sectionPath('downloads', locale, `quiniela-${comp.slug}-${subsection('round', locale)}-${n}`);
  const h1 = tpl(t.h1, { league, round: roundLbl });
  const insight = communityInsight(fixtures, splits, locale);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <LocalTimeScript locale={locale} />
      <JsonLd data={roundEventsNode(h1, fixtures, locale, path)} />
      <SiteNav />

      <main className="mx-auto max-w-6xl px-4 pt-2 pb-28 sm:px-6 lg:pb-16">
        <Breadcrumbs
          currentPath={path}
          crumbs={[
            { name: t.home, path: homePath(locale) },
            { name: t.pools, path: sectionPath('pool', locale) },
            { name: league, path: poolPath(locale, comp.id)! },
            { name: roundLbl },
          ]}
        />

        <section className="mt-5 overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-gold/15 via-surface to-surface p-5 sm:p-8">
          <div className="flex flex-wrap items-end gap-6 lg:gap-10">
            <div className="min-w-0 flex-[1_1_28rem]">
              <p className="text-xs font-extrabold tracking-[0.14em] text-gold uppercase">
                {tpl(t.eyebrow, { league })} · {season}
              </p>
              <h1 className="mt-3 font-display text-3xl leading-[0.95] font-bold tracking-wide uppercase sm:text-5xl">
                {h1}
              </h1>
              <p className="mt-4 max-w-[62ch] leading-relaxed font-semibold text-muted-foreground">
                {lead} {leadPicks}
              </p>
            </div>
            <div className="grid w-full flex-[1_1_20rem] grid-cols-[repeat(auto-fit,minmax(7rem,1fr))] gap-2.5 sm:gap-3">
              <StatTile value={fixtures.length} label={t.statMatches} />
              {picks > 0 ? (
                <StatTile value={fmtInt(picks, locale)} label={t.statPredictions} tone="primary" />
              ) : null}
              {tally.played > 0 ? (
                <StatTile value={`${tally.played}/${fixtures.length}`} label={t.statPlayed} tone="gold" />
              ) : nextOpen ? (
                <StatTile
                  value={shortDateIn(nextOpen.fixture.date, zone, locale)}
                  label={`${t.statFirst} · ${timeIn(nextOpen.fixture.date, zone, locale)} ${zoneLabel}`}
                  tone="gold"
                />
              ) : null}
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="flex min-w-0 flex-col gap-8">
            <PoolPicker
              locale={locale}
              matches={toPickerMatches(fixtures, splits, locale)}
              storageKey={`golify:pool:${comp.id}:${data.season}:${data.phase ?? 'season'}:${n}`}
              title={tpl(t.shareName, { league, round: roundLbl })}
              pageUrl={withUtm(absolute(path), 'quiniela', campaign)}
              ctaHref={ctaHref}
              campaign={campaign}
            />

            {nextOpen ? (
              <div className="-mt-8">
                <KickoffTable
                  iso={nextOpen.fixture.date}
                  locale={locale}
                  title={tpl(t.kickoffTitle, { home: nextOpen.teams.home.name, away: nextOpen.teams.away.name })}
                />
              </div>
            ) : null}

            <AdSlot id="pool-after-fixtures" format="leaderboard" indexable={indexable} />

            <AppCard locale={locale} href={ctaHref} campaign={campaign} placement="app-block" />

            <HowItWorks locale={locale} />

            <FaqSection title={t.faqTitle} entries={faq} pagePath={path} className="mt-0" />
            <p className="-mt-4 text-sm font-semibold text-muted-foreground">{t.noStream}</p>
          </div>

          <aside className="flex min-w-0 flex-col gap-5">
            <InsightCard locale={locale} text={insight} />

            <nav aria-label={t.linksTitle} className="rounded-2xl border border-border bg-surface p-5">
              <h2 className="font-display text-lg font-bold tracking-wide uppercase">{t.linksTitle}</h2>
              <ul className="mt-3 space-y-2.5 text-sm font-bold">
                {roundPage ? (
                  <li>
                    <Link href={roundPage} className="text-primary hover:underline">
                      {tpl(t.linkRound, { round: roundLbl, league })}
                    </Link>
                  </li>
                ) : null}
                <li>
                  <Link href={printable} className="text-primary hover:underline">
                    {t.linkPrintable}
                  </Link>
                </li>
                <li>
                  <Link href={poolPath(locale, comp.id)!} className="text-primary hover:underline">
                    {tpl(t.linkOverview, { league })}
                  </Link>
                </li>
              </ul>
              {prev || next ? (
                <div className="mt-4 flex justify-between gap-3 border-t border-border pt-4 text-sm font-bold">
                  {prev ? (
                    <Link href={poolPath(locale, comp.id, prev.n)!} className="hover:text-primary">
                      {tpl(t.prev, { round: `${roundWord(comp, locale)} ${prev.n}` })}
                    </Link>
                  ) : (
                    <span />
                  )}
                  {next ? (
                    <Link href={poolPath(locale, comp.id, next.n)!} className="text-right hover:text-primary">
                      {tpl(t.next, { round: `${roundWord(comp, locale)} ${next.n}` })}
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </nav>
          </aside>
        </div>
      </main>

      <SiteFooter locale={locale as Locale} />
    </div>
  );
}
