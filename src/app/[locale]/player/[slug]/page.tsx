import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { LocalTimeScript } from '@/components/LocalTime';
import { JsonLd } from '@/components/JsonLd';
import { Breadcrumbs } from '@/components/blocks/Breadcrumbs';
import { FaqSection } from '@/components/blocks/FaqSection';
import { CommunitySplit } from '@/components/blocks/CommunitySplit';
import { AdSlot } from '@/components/ads/AdSlot';
import {
  AppCta,
  CareerList,
  CompetitionTable,
  FcCardBlock,
  LastMatches,
  NextMatchCard,
  PlayerHero,
  SectionTabs,
  SeasonSummary,
  SimilarPlayers,
  TitlesList,
  TransfersList,
} from '@/components/player/blocks';
import { loadPlayer, type PlayerPageData } from '@/components/player/lib/data';
import { countryName } from '@/components/player/lib/countries';
import { calendarDate, heightMeters, heightText, num, seasonText, weightKg, year } from '@/components/player/lib/format';
import { plural, positionLabel, sub, t, type Strings } from '@/components/player/lib/strings';
import { getPickSplit } from '@/lib/community';
import { competitionName } from '@/lib/competitions';
import { ROUTE_LOCALES, competitionPath, homePath, playerPath, playerSlugId, teamPath, type RouteLocale } from '@/lib/routes';
import { absolute, pageMetadata, type Crumb, type JsonLdNode } from '@/lib/seo';
import { fill } from '@/lib/site';
import { idFromSlug } from '@/lib/slug';

// Player page (plan A4 "Jugador", strategy §6): bio, club, season stats by
// competition, recent matches with his line, career, transfers, trophies and
// the EA FC card when it can be matched with confidence. Replaces the old
// client-side deeplink funnel, which rendered the same splash for every
// player and was kept out of the index for that reason.
//
// ISR: rendered on first request, then cached. Profiles and history move
// slowly; six hours keeps the season line fresh through a matchday.
export const revalidate = 21600;

export async function generateStaticParams() {
  return [];
}

type Params = { locale: string; slug: string };

function asLocale(v: string): RouteLocale | null {
  return (ROUTE_LOCALES as readonly string[]).includes(v) ? (v as RouteLocale) : null;
}

/** Resolves the param to a player, 404s unknown ids, and sends any
 *  non-canonical spelling (bare legacy id, renamed player) to the canonical
 *  URL in one permanent hop. The slug comes from the provider's short `name`
 *  — the same field every other page links with. */
async function resolve(params: Promise<Params>): Promise<{ locale: RouteLocale; d: PlayerPageData }> {
  const { locale: rawLocale, slug } = await params;
  const locale = asLocale(rawLocale);
  const id = idFromSlug(slug);
  if (!locale || !id) notFound();
  const d = await loadPlayer(id);
  if (!d) notFound();
  if (slug !== playerSlugId(d.profile)) permanentRedirect(playerPath(locale, d.profile));
  return { locale, d };
}

function seasonLabelFor(d: PlayerPageData) {
  return (s: number) =>
    seasonText(
      s,
      d.club?.league ?? null,
      d.lines.filter((l) => l.season === s && l.competition).map((l) => l.competition),
    );
}

// ---- Rule-based copy over the real numbers (plan A4 "texto condicional") ----

function insights(d: PlayerPageData, L: Strings, locale: RouteLocale): string[] {
  const out: string[] = [];
  const season = seasonLabelFor(d)(d.currentSeason);
  const c = d.current;
  // A rate needs a sample: "one every 1,480 minutes" off a single goal says
  // nothing, so it waits for the second one.
  if (c && c.goals >= 2 && c.minutes >= 90) {
    out.push(fill(L.insightEvery, { m: num(Math.round(c.minutes / c.goals), locale), season }));
  } else if (c && c.goals + c.assists > 1) {
    out.push(fill(L.insightInvolved, { n: num(c.goals + c.assists, locale), season }));
  }
  const withData = d.matches.filter((m) => m.status !== 'nodata');
  const played = withData.filter((m) => m.status === 'played');
  if (d.club && withData.length >= 3 && played.length > 0) {
    const g = played.reduce((s, m) => s + m.goals, 0);
    const a = played.reduce((s, m) => s + m.assists, 0);
    const what = [g ? plural(L.nGoals, g, locale) : null, a ? plural(L.nAssists, a, locale) : null].filter(Boolean).join(' + ');
    out.push(
      fill(played.length === withData.length ? L.insightLastAll : L.insightLast, {
        k: String(played.length),
        total: String(withData.length),
        team: d.club.team.name,
        contrib: what ? sub(L.insightLastContrib, { what }) : '',
      }),
    );
  }
  if (d.titlesTotal > 1) {
    out.push(fill(L.insightTitles, { n: String(d.titlesTotal), league: d.titles[0].league, season: d.titles[0].season }));
  } else if (d.titlesTotal === 1) {
    out.push(fill(L.insightTitle1, { league: d.titles[0].league, season: d.titles[0].season }));
  }
  return out;
}

function faqEntries(d: PlayerPageData, L: Strings, locale: RouteLocale): [string, string][] {
  const out: [string, string][] = [];
  const name = d.name;
  if (d.club) {
    const joined = d.career.find((s) => s.current)?.from ?? null;
    out.push([
      fill(L.faqTeamQ, { name }),
      fill(L.faqTeamA, {
        name,
        team: d.club.team.name,
        league: d.club.league ? sub(L.faqTeamLeague, { league: competitionName(d.club.league, locale) }) : '',
        since: joined ? sub(L.faqTeamSince, { year: year(joined) ?? '' }) : '',
        number: d.number != null ? sub(L.faqTeamNumber, { n: String(d.number) }) : '',
      }).replace(/\s+\./, '.'),
    ]);
  }
  const c = d.current;
  if (c && c.apps > 0) {
    const season = seasonLabelFor(d)(d.currentSeason);
    let a = fill(L.faqGoalsA, {
      goals: plural(L.nGoals, c.goals, locale),
      assists: plural(L.nAssists, c.assists, locale),
      apps: plural(L.nApps, c.apps, locale),
      competitions: c.competitions.join(', '),
    });
    if (c.goals >= 2 && c.minutes >= 90) a += sub(L.faqGoalsEvery, { m: num(Math.round(c.minutes / c.goals), locale) });
    out.push([fill(L.faqGoalsQ, { name, season }), a]);
  }
  if (d.age != null && d.profile.birth?.date) {
    const place = [d.profile.birth.place, countryName(d.profile.birth.country, locale)].filter(Boolean).join(', ');
    out.push([
      fill(L.faqAgeQ, { name }),
      fill(L.faqAgeA, {
        age: String(d.age),
        date: calendarDate(d.profile.birth.date, locale),
        place: place ? sub(L.faqAgePlace, { place }) : '',
      }),
    ]);
  }
  const h = heightText(d.profile.height, locale);
  if (h) out.push([fill(L.faqHeightQ, { name }), fill(L.faqHeightA, { name, height: h })]);
  return out;
}

// ---- Metadata ---------------------------------------------------------------

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale, d } = await resolve(params);
  const L = t(locale);
  const c = d.current;
  const pos = positionLabel(d.position, locale);
  const season = seasonLabelFor(d)(d.currentSeason);
  const description =
    c && d.club && pos
      ? fill(L.metaDesc, {
          name: d.name,
          position: pos.toLowerCase(),
          team: d.club.team.name,
          apps: plural(L.nApps, c.apps, locale),
          goals: plural(L.nGoals, c.goals, locale),
          assists: plural(L.nAssists, c.assists, locale),
          season,
        })
      : fill(L.metaDescNoSeason, {
          name: d.name,
          who: [pos?.toLowerCase(), d.club?.team.name].filter(Boolean).length ? ` (${[pos?.toLowerCase(), d.club?.team.name].filter(Boolean).join(', ')})` : '',
        });
  return pageMetadata({
    locale,
    path: (l) => playerPath(l, d.profile),
    title: fill(L.metaTitle, { name: d.name }),
    description,
    noindex: !d.indexable,
    type: 'profile',
    images: d.profile.photo ? [{ url: d.profile.photo, width: 150, height: 150, alt: d.name }] : undefined,
    appRoute: `player/${d.profile.id}`,
  });
}

// ---- Page -----------------------------------------------------------------------

export default async function PlayerPage({ params }: { params: Promise<Params> }) {
  const { locale, d } = await resolve(params);
  const L = t(locale);
  const p = d.profile;
  const path = playerPath(locale, p);
  const labelFor = seasonLabelFor(d);
  const seasonLabel = labelFor(d.currentSeason);
  const indexable = d.indexable;

  const split = d.nextMatch ? await getPickSplit(d.nextMatch.fixture.id) : null;

  const crumbs: Crumb[] = [{ name: L.home, path: homePath(locale) }];
  if (d.club?.league) {
    const lp = competitionPath(locale, d.club.league.id);
    if (lp) crumbs.push({ name: competitionName(d.club.league, locale), path: lp });
  }
  if (d.club) crumbs.push({ name: d.club.team.name, path: teamPath(locale, d.club.team) });
  crumbs.push({ name: d.name });

  const faq = faqEntries(d, L, locale);
  const tips = insights(d, L, locale);

  const tabs: [string, string][] = [['summary', L.tabs.summary]];
  if (d.lines.length) tabs.push(['stats', L.tabs.stats]);
  if (d.matches.length) tabs.push(['matches', L.tabs.matches]);
  if (d.career.length >= 2) tabs.push(['career', L.tabs.career]);
  if (d.transfers.length) tabs.push(['transfers', L.tabs.transfers]);
  if (d.titles.length) tabs.push(['titles', L.tabs.titles]);
  if (d.fc) tabs.push(['fc', L.tabs.fc]);

  const meters = heightMeters(p.height);
  const kg = weightKg(p.weight);
  const person: JsonLdNode = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${absolute(path)}#person`,
    name: d.name,
    ...(d.fullName && d.fullName !== d.name ? { alternateName: d.fullName } : {}),
    ...(p.firstname ? { givenName: p.firstname } : {}),
    ...(p.lastname ? { familyName: p.lastname } : {}),
    ...(p.birth?.date ? { birthDate: p.birth.date } : {}),
    ...(p.birth?.place || p.birth?.country
      ? { birthPlace: { '@type': 'Place', name: [p.birth.place, countryName(p.birth.country, locale)].filter(Boolean).join(', ') } }
      : {}),
    ...(p.nationality ? { nationality: { '@type': 'Country', name: countryName(p.nationality, locale) } } : {}),
    ...(meters ? { height: { '@type': 'QuantitativeValue', value: meters, unitCode: 'MTR' } } : {}),
    ...(kg ? { weight: { '@type': 'QuantitativeValue', value: kg, unitCode: 'KGM' } } : {}),
    ...(p.photo ? { image: p.photo } : {}),
    ...(d.position ? { jobTitle: positionLabel(d.position, locale) } : {}),
    ...(d.club
      ? {
          affiliation: {
            '@type': 'SportsTeam',
            name: d.club.team.name,
            sport: 'Soccer',
            url: absolute(teamPath(locale, d.club.team)),
            ...(d.club.team.logo ? { logo: d.club.team.logo } : {}),
          },
        }
      : {}),
    url: absolute(path),
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd data={person} />
      <LocalTimeScript locale={locale} />
      <SiteNav />

      <main className="mx-auto max-w-6xl px-4 pt-3 pb-16 sm:px-8">
        <Breadcrumbs crumbs={crumbs} currentPath={path} />

        <div className="mt-4">
          <PlayerHero d={d} locale={locale} L={L} seasonLabel={seasonLabel} />
        </div>

        <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div className="flex min-w-0 flex-col gap-6">
            <SectionTabs items={tabs} label={L.sections} />

            <SeasonSummary
              totals={d.current}
              seasonLabel={seasonLabel}
              isGoalkeeper={d.position === 'Goalkeeper'}
              insights={tips}
              locale={locale}
              L={L}
            />

            <AdSlot id="player-in-content-1" format="in-article" indexable={indexable} className="my-0" />

            <CompetitionTable lines={d.lines} seasons={d.seasonsShown} seasonLabelFor={labelFor} locale={locale} L={L} />

            {d.club ? <LastMatches matches={d.matches} teamName={d.club.team.name} locale={locale} L={L} /> : null}

            <AdSlot id="player-in-content-2" format="in-article" indexable={indexable} className="my-0" />

            <CareerList stints={d.career} locale={locale} L={L} />
            <TransfersList transfers={d.transfers} locale={locale} L={L} />
            <TitlesList titles={d.titles} total={d.titlesTotal} L={L} />

            <FaqSection title={L.faqTitle} entries={faq} pagePath={path} className="mt-2" />
          </div>

          <aside className="flex min-w-0 flex-col gap-6">
            {d.nextMatch ? (
              <NextMatchCard f={d.nextMatch} locale={locale} L={L}>
                {/* Real quiniela picks only; nothing below 20 picks. */}
                {split ? (
                  <div className="mt-4">
                    <CommunitySplit
                      split={split}
                      home={d.nextMatch.teams.home.name}
                      away={d.nextMatch.teams.away.name}
                      locale={locale}
                      compact
                    />
                  </div>
                ) : null}
              </NextMatchCard>
            ) : null}
            {d.fc ? <FcCardBlock fc={d.fc} locale={locale} L={L} /> : null}
            <AdSlot id="player-sidebar" format="rectangle" indexable={indexable} className="my-0" />
            {d.club ? (
              <SimilarPlayers players={d.similar} teamName={d.club.team.name} position={d.position} locale={locale} L={L} />
            ) : null}
            <AppCta name={d.name} teamName={d.club?.team.name ?? null} playerId={p.id} L={L} />
          </aside>
        </div>
      </main>

      <SiteFooter locale={locale} />
    </div>
  );
}
