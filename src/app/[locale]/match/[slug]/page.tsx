import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { JsonLd } from '@/components/JsonLd';
import { LocalTimeScript } from '@/components/LocalTime';
import { DisplayHeading } from '@/components/revamp/ui';
import { AdSlot } from '@/components/ads/AdSlot';
import { Breadcrumbs } from '@/components/blocks/Breadcrumbs';
import { FaqSection } from '@/components/blocks/FaqSection';
import { KickoffTable } from '@/components/blocks/KickoffTable';
import { CommunitySplit } from '@/components/blocks/CommunitySplit';
import { Scoreboard } from '@/components/match/Scoreboard';
import { EventsTimeline } from '@/components/match/EventsTimeline';
import { Lineups } from '@/components/match/Lineups';
import { StatsComparison } from '@/components/match/StatsComparison';
import { FormGuide } from '@/components/match/FormGuide';
import { MatchRowList } from '@/components/match/MatchRowList';
import { StandingsExcerpt } from '@/components/match/StandingsExcerpt';
import { GoalsList } from '@/components/match/GoalsList';
import { ManOfTheMatch, PlayerRatings, RATING_SOURCE } from '@/components/match/PlayerRatings';
import { InjuryList } from '@/components/match/InjuryList';
import { PredictCta } from '@/components/match/PredictCta';
import { Card, Section } from '@/components/match/ui';
import { goalsOf, ratedPlayers, sortedEvents } from '@/components/match/facts';
import { correctShare } from '@/lib/community';
import {
  ROUTE_LOCALES,
  datePath,
  h2hPath,
  matchPath,
  matchSlug,
  refereePath,
  stadiumPath,
  teamPath,
  whereToWatchPath,
  type RouteLocale,
} from '@/lib/routes';
import { idFromSlug, refereeName } from '@/lib/slug';
import { absolute, pageMetadata, type JsonLdNode } from '@/lib/seo';
import { fill, worldCupEventNode, WORLD_CUP_EVENT } from '@/lib/site';
import { HUB_COUNTRY_INFO, KICKOFF_ZONES, isoDateIn, longDateIn, shortDateIn, timeIn } from '@/lib/timezones';
import { WATCH_COUNTRY_SLUGS } from '@/data/broadcasters';
import { loadMatch, type MatchModel } from './_lib/load';
import { buildView, type MatchView } from './_lib/view';
import { FAQ_OTHER_ZONES, PRIMARY_ZONE } from './_lib/i18n';

// Match page v2 — one URL, three moments (plan A4, strategy §6). The same
// address serves the preview before kickoff, the live match and the final
// report; the content follows fixturePhase(), and the server HTML is always
// complete and indexable. A small client component keeps the score and the
// minute current while the match is live (plan A7).
//
// ISR: rendered on first visit, then kept for a minute. Every fetch below is
// cached, and the primary fixture load is strict, so a failed API call never
// replaces a good copy with an empty page.
export const revalidate = 60;

export async function generateStaticParams() {
  return [];
}

type Params = { locale: string; slug: string };

function asLocale(v: string): RouteLocale | null {
  return (ROUTE_LOCALES as readonly string[]).includes(v) ? (v as RouteLocale) : null;
}

async function resolve(params: Promise<Params>) {
  const { locale: raw, slug } = await params;
  const locale = asLocale(raw);
  const id = idFromSlug(slug);
  if (!locale || !id) notFound();
  const m = await loadMatch(id, PRIMARY_ZONE[locale]);
  if (!m) notFound();
  return { locale, slug, m };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale, m } = await resolve(params);
  const v = buildView(m, locale);
  return pageMetadata({
    locale,
    path: v.path,
    title: v.title,
    description: v.description,
    noindex: !m.indexable,
    appRoute: `match/${m.f.fixture.id}`,
  });
}

// ---- Structured data -------------------------------------------------------

// schema.org EventStatusType only has Scheduled / Postponed / Cancelled /
// Rescheduled / MovedOnline: a live or finished match stays EventScheduled.
function eventStatus(short: string): string {
  if (short === 'PST') return 'https://schema.org/EventPostponed';
  if (short === 'CANC' || short === 'ABD') return 'https://schema.org/EventCancelled';
  return 'https://schema.org/EventScheduled';
}

function sportsEventNode(m: MatchModel, v: MatchView, locale: RouteLocale, seasonUrl: string | null): JsonLdNode {
  const f = m.f;
  const kickoff = new Date(f.fixture.date);
  // The provider does not report the final-whistle time; a match runs about
  // two hours (two and a half with extra time), which is what Google gets.
  const extra = ['AET', 'PEN'].includes(f.fixture.status.short) ? 30 : 0;
  const end = new Date(kickoff.getTime() + (120 + extra) * 60_000);
  const country = f.league.country && f.league.country !== 'World' ? f.league.country : undefined;
  const team = (t: MatchModel['f']['teams']['home']) => ({
    '@type': 'SportsTeam',
    name: t.name,
    logo: t.logo,
    url: absolute(teamPath(locale, t)),
  });
  const home = team(f.teams.home);
  const away = team(f.teams.away);
  const venue = f.fixture.venue;

  const superEvent =
    m.isWorldCup && f.league.season === 2026
      ? worldCupEventNode(absolute(`/${locale}/world-cup`))
      : {
          '@type': 'SportsEvent',
          name: v.compWithSeason,
          sport: 'Soccer',
          ...(seasonUrl ? { url: absolute(seasonUrl) } : {}),
        };

  return {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: `${f.teams.home.name} vs ${f.teams.away.name}`,
    description: v.description,
    sport: 'Soccer',
    startDate: f.fixture.date,
    endDate: end.toISOString(),
    eventStatus: eventStatus(f.fixture.status.short),
    location: venue.name
      ? {
          '@type': 'StadiumOrArena',
          name: venue.name,
          address: { '@type': 'PostalAddress', ...(venue.city ? { addressLocality: venue.city } : {}), ...(country ? { addressCountry: country } : {}) },
        }
      : { '@type': 'Place', name: country ?? f.league.name },
    image: [f.teams.home.logo, f.teams.away.logo].filter(Boolean),
    homeTeam: home,
    awayTeam: away,
    competitor: [home, away],
    ...(m.isWorldCup
      ? { organizer: { '@type': 'Organization', name: WORLD_CUP_EVENT.organizer.name, url: WORLD_CUP_EVENT.organizer.url } }
      : {}),
    superEvent,
    url: absolute(v.path(locale)),
  };
}

// ---- FAQ -------------------------------------------------------------------

function kickoffAnswer(m: MatchModel, v: MatchView, locale: RouteLocale): string {
  const t = v.t;
  const iso = m.f.fixture.date;
  const zone = PRIMARY_ZONE[locale];
  const baseDate = isoDateIn(new Date(iso), zone);
  const others = FAQ_OTHER_ZONES[locale]
    .map((key) => KICKOFF_ZONES.find((z) => z.key === key))
    .filter((z): z is (typeof KICKOFF_ZONES)[number] => !!z)
    .map((z) => {
      const time = timeIn(iso, z.zone, locale);
      const sameDay = isoDateIn(new Date(iso), z.zone) === baseDate;
      return fill(t.faqWhenOther, { country: z.label[locale], time: sameDay ? time : `${time} (${shortDateIn(iso, z.zone, locale)})` });
    })
    // "En Colombia es a las 19:30; en Argentina…": only the first is
    // capitalized (pt starts with the country name, which stays as is).
    .map((s, i) => (i === 0 || locale === 'pt' ? s : s[0].toLowerCase() + s.slice(1)));
  return fill(t.faqWhenA, {
    home: v.home,
    away: v.away,
    date: longDateIn(iso, zone, locale),
    time: timeIn(iso, zone, locale),
    others: `${others.join('; ')}.`,
  });
}

function watchAnswer(m: MatchModel, v: MatchView, locale: RouteLocale): string {
  const t = v.t;
  if (m.broadcasts.length === 0) return fill(t.faqWhereNone, { competition: v.compLabel });
  const list = m.broadcasts.map((b) => `${HUB_COUNTRY_INFO[b.country].name[locale]}: ${b.channels.map((c) => c.name).join(', ')}`);
  return fill(t.faqWhereHas, { list: list.join('; ') });
}

function faqEntries(m: MatchModel, v: MatchView, locale: RouteLocale, motm: ReturnType<typeof ratedPlayers>[number] | undefined): [string, string][] {
  const t = v.t;
  const vars = { home: v.home, away: v.away };
  const out: [string, string][] = [];
  const venue = m.f.fixture.venue;
  const venueVars = venue.name ? { venue: venue.name, city: venue.city ? `, ${venue.city}` : '' } : null;

  if (m.phase === 'finished') {
    if (v.summary[0]) out.push([fill(t.faqResult, vars), v.summary[0]]);
    if (v.scorers.length) out.push([fill(t.faqScorers, vars), v.scorers.join(' ')]);
    if (motm) {
      out.push([
        fill(t.faqMotm, vars),
        fill(t.faqMotmA, { player: motm.name, team: motm.teamName, source: RATING_SOURCE, rating: motm.rating.toFixed(1) }),
      ]);
    }
    if (venueVars) out.push([fill(t.faqVenuePast, vars), fill(t.faqVenuePastA, venueVars)]);
    return out;
  }

  if (m.phase !== 'live') out.push([fill(t.faqWhen, vars), kickoffAnswer(m, v, locale)]);
  out.push([fill(t.faqWhere, vars), watchAnswer(m, v, locale)]);
  if (venueVars) out.push([fill(t.faqVenue, vars), fill(t.faqVenueA, venueVars)]);
  if (m.preview && m.split) {
    const p = m.split.pct;
    const top = p.home >= p.draw && p.home >= p.away ? 'home' : p.away >= p.draw ? 'away' : 'draw';
    const n = m.split.total.toLocaleString(locale === 'pt' ? 'pt-BR' : locale === 'en' ? 'en-US' : 'es-MX');
    const pctText = locale === 'es' ? `${p[top]} %` : `${p[top]}%`;
    out.push([
      t.faqFav,
      top === 'draw'
        ? fill(t.faqFavDraw, { pct: pctText, n })
        : fill(t.faqFavWin, { pct: pctText, n, team: top === 'home' ? v.home : v.away }),
    ]);
  }
  if (m.preview && m.standings && v.preview[0] && m.blocks.standings) {
    // The first "así llegan" sentence is the standings one whenever both
    // teams are in the table (previewSentences puts it first).
    const rows = m.standings.group.rows;
    if (rows.some((r) => r.team.id === m.f.teams.home.id) && rows.some((r) => r.team.id === m.f.teams.away.id)) {
      out.push([fill(t.faqTable, vars), v.preview[0]]);
    }
  }
  return out;
}

// ---- Page ------------------------------------------------------------------

export default async function MatchPage({ params }: { params: Promise<Params> }) {
  const { locale, slug, m } = await resolve(params);
  const f = m.f;

  // Canonical slug from the data. A bare legacy id (/es/match/1490500), an
  // old team name or a wrong order all land here: one permanent redirect to
  // the URL the builders produce, and every internal link already uses it.
  const canonical = matchSlug(f.teams.home.name, f.teams.away.name, f.fixture.id);
  if (slug !== canonical) permanentRedirect(matchPath(locale, f));

  const v = buildView(m, locale);
  const t = v.t;
  const path = v.path(locale);
  const indexable = m.indexable;
  const live = m.phase === 'live';
  const finished = m.phase === 'finished';
  const homeTeam = f.teams.home;
  const awayTeam = f.teams.away;

  const goals = goalsOf(f);
  const rated = ratedPlayers(f, v.names);
  const motm = finished ? rated[0] : undefined;
  const faq = faqEntries(m, v, locale, motm);
  const correct = finished && m.split ? correctShare(m.split, f.goals) : null;

  const venue = f.fixture.venue.name
    ? {
        label: f.fixture.venue.city ? `${f.fixture.venue.name}, ${f.fixture.venue.city}` : f.fixture.venue.name,
        href: f.fixture.venue.id ? stadiumPath(locale, { id: f.fixture.venue.id, name: f.fixture.venue.name }) : null,
      }
    : null;
  const referee = f.fixture.referee ? { label: refereeName(f.fixture.referee), href: refereePath(locale, f.fixture.referee) } : null;

  const tableCaption = m.standings?.group.name && m.standings.group.name !== f.league.name
    ? m.standings.group.name.replace(/^Group\b/, locale === 'en' ? 'Group' : 'Grupo')
    : null;

  const dayLabel = shortDateIn(f.fixture.date, PRIMARY_ZONE[locale], locale);

  // ---- Blocks ----
  const summaryBlock =
    finished && v.summary.length > 0 ? (
      <Section title={t.summaryTitle}>
        <Card className="p-5">
          <p className="leading-relaxed font-semibold">{v.summary.join(' ')}</p>
          <p className="mt-3 text-xs font-semibold text-muted-foreground">{t.summaryNote}</p>
        </Card>
      </Section>
    ) : null;

  const previewBlock =
    m.preview && v.preview.length > 0 ? (
      <Section title={t.previewTitle}>
        <Card className="p-5">
          <ul className="space-y-2 leading-relaxed font-semibold">
            {v.preview.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </Card>
      </Section>
    ) : null;

  const offNote =
    m.phase === 'off' ? (
      <Card className="mt-6 p-5">
        <p className="font-semibold">{fill(t.offNote, { status: v.status })}</p>
      </Card>
    ) : null;

  const watchBlock = m.preview ? (
    <Section title={fill(t.watchTitle, { home: v.home, away: v.away })}>
      <Card className="p-5">
        {m.broadcasts.length > 0 ? (
          <>
            <p className="text-sm font-semibold text-muted-foreground">
              {fill(t.watchHas, { competition: v.compLabel, season: m.broadcasts[0].season })}
            </p>
            <ul className="mt-3 divide-y divide-border">
              {m.broadcasts.map((b) => {
                const href = whereToWatchPath(locale, f.league.id, WATCH_COUNTRY_SLUGS[b.country]);
                return (
                  <li key={`${b.country}-${b.season}`} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                    <span className="font-extrabold">{HUB_COUNTRY_INFO[b.country].name[locale]}</span>
                    <span className="min-w-0 flex-1 text-right font-semibold">{b.channels.map((c) => c.name).join(', ')}</span>
                    {href ? (
                      <Link href={href} className="w-full text-right text-xs font-bold text-primary hover:underline sm:w-auto">
                        {t.watchMore}
                      </Link>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <p className="leading-relaxed font-semibold text-muted-foreground">{fill(t.watchNone, { competition: v.compLabel })}</p>
        )}
        <p className="mt-3 leading-relaxed font-semibold">{t.watchApp}</p>
      </Card>
    </Section>
  ) : null;

  const formBlock = m.blocks.form ? (
    <Section title={t.formTitle}>
      <FormGuide
        locale={locale}
        rows={[
          { team: homeTeam, fixtures: m.formHome },
          { team: awayTeam, fixtures: m.formAway },
        ]}
      />
    </Section>
  ) : null;

  const h2hBlock = m.blocks.h2h ? (
    <Section title={t.h2hTitle} action={{ href: h2hPath(locale, homeTeam, awayTeam), label: t.h2hAll }}>
      <MatchRowList fixtures={m.h2h} locale={locale} showDate />
    </Section>
  ) : null;

  const tableBlock = m.standings ? (
    <Section title={t.tableTitle} action={v.tableHref ? { href: v.tableHref, label: t.tableAll } : null}>
      <StandingsExcerpt
        group={m.standings.group}
        rows={m.standings.rows}
        highlight={[homeTeam.id, awayTeam.id]}
        caption={tableCaption}
        locale={locale}
      />
    </Section>
  ) : null;

  const lineupsBlock = m.blocks.lineups ? (
    <Section title={m.preview ? t.lineupsConfirmed : t.lineupsTitle}>
      <Lineups lineups={f.lineups} locale={locale} />
    </Section>
  ) : null;

  const injuriesBlock =
    m.preview && m.injuries.length > 0 ? (
      <Section title={t.injuriesTitle}>
        <InjuryList injuries={m.injuries} teams={[homeTeam, awayTeam]} locale={locale} />
      </Section>
    ) : null;

  const eventsBlock =
    !m.preview && f.events.length > 0 ? (
      <Section title={t.eventsTitle}>
        <EventsTimeline events={sortedEvents(f)} names={v.names} locale={locale} />
      </Section>
    ) : null;

  const statsBlock = m.blocks.stats ? (
    <Section title={t.statsTitle}>
      <StatsComparison stats={f.statistics} home={homeTeam} away={awayTeam} locale={locale} />
    </Section>
  ) : null;

  const goalsBlock =
    finished && goals.length > 0 ? (
      <Section title={t.goalsTitle}>
        <GoalsList goals={goals} names={v.names} locale={locale} />
      </Section>
    ) : null;

  const motmBlock = motm ? (
    <Section title={t.motmTitle}>
      <ManOfTheMatch p={motm} locale={locale} note={fill(t.motmNote, { source: RATING_SOURCE })} />
    </Section>
  ) : null;

  const ratingsBlock =
    finished && rated.length > 1 ? (
      <Section title={t.ratingsTitle}>
        <PlayerRatings players={rated.slice(0, 5)} locale={locale} />
        <p className="mt-2 text-xs font-semibold text-muted-foreground">{fill(t.ratingsNote, { source: RATING_SOURCE })}</p>
      </Section>
    ) : null;

  const quinielaBlock =
    finished && m.split && correct != null ? (
      <Section title={t.quinielaTitle}>
        <Card className="p-5">
          <p className="leading-relaxed font-semibold">
            {fill(t.quinielaText, {
              pct: locale === 'es' ? `${correct} %` : `${correct}%`,
              n: m.split.total.toLocaleString(locale === 'pt' ? 'pt-BR' : locale === 'en' ? 'en-US' : 'es-MX'),
              outcome:
                f.goals.home === f.goals.away
                  ? t.outcomeDraw
                  : fill(t.outcomeWin, { team: (f.goals.home ?? 0) > (f.goals.away ?? 0) ? v.home : v.away }),
            })}
          </p>
          <div className="mt-4">
            <CommunitySplit split={m.split} home={v.home} away={v.away} locale={locale} compact />
          </div>
        </Card>
      </Section>
    ) : null;

  const midAd = <AdSlot id="match-mid" indexable={indexable} label={t.ad} />;

  // Block order per moment. The H2H → ad → table sequence is the plan C3
  // slot "between H2H and table".
  const mainBlocks = m.preview ? (
    <>
      {offNote}
      {previewBlock}
      {m.phase === 'scheduled' ? <KickoffTable iso={f.fixture.date} locale={locale} title={fill(t.kickoffTitle, { home: v.home, away: v.away })} /> : null}
      {watchBlock}
      {formBlock}
      {h2hBlock}
      {midAd}
      {tableBlock}
      {lineupsBlock}
      {injuriesBlock}
    </>
  ) : live ? (
    <>
      {eventsBlock}
      {statsBlock}
      {lineupsBlock}
      {h2hBlock}
      {midAd}
      {tableBlock}
    </>
  ) : (
    <>
      {summaryBlock}
      {goalsBlock}
      {motmBlock}
      {statsBlock}
      {ratingsBlock}
      {quinielaBlock}
      {lineupsBlock}
      {eventsBlock}
      {h2hBlock}
      {midAd}
      {tableBlock}
    </>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd data={sportsEventNode(m, v, locale, v.seasonHref)} />
      <LocalTimeScript locale={locale} />
      <SiteNav />

      <main className="mx-auto max-w-6xl px-4 pt-2 pb-12 sm:px-8">
        <Breadcrumbs crumbs={v.crumbs} currentPath={path} />

        <DisplayHeading as="h1" className="mt-4 text-3xl sm:text-4xl">
          {v.matchName}
        </DisplayHeading>

        <Scoreboard
          f={f}
          locale={locale}
          eyebrow={v.eyebrow}
          homeHref={teamPath(locale, homeTeam)}
          awayHref={teamPath(locale, awayTeam)}
          venue={venue}
          referee={referee}
        />

        <AdSlot id="match-below-score" indexable={indexable} label={t.ad} />

        <div className="grid grid-cols-1 gap-x-10 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0">
            {mainBlocks}
            <FaqSection title={t.faqTitle} entries={faq} pagePath={path} />
          </div>

          <aside className="min-w-0 space-y-8 lg:pt-10">
            <div className="mt-10 lg:mt-0">
              <PredictCta
                locale={locale}
                fixtureId={f.fixture.id}
                slug={canonical}
                split={m.split}
                home={v.home}
                away={v.away}
                played={finished}
              />
            </div>

            {m.sameDay.length > 0 ? (
              <Section title={fill(t.sameDayTitle, { date: dayLabel })} className="mt-0" action={{ href: datePath(locale, m.localDate), label: t.sameDayAll }}>
                <MatchRowList fixtures={m.sameDay} locale={locale} showLeague />
              </Section>
            ) : null}

            {m.nextInLeague.length > 0 ? (
              <Section title={fill(t.nextTitle, { competition: v.compLabel })} className="mt-0">
                <MatchRowList fixtures={m.nextInLeague} locale={locale} showDate />
              </Section>
            ) : null}
          </aside>
        </div>

        <AdSlot id="match-end" indexable={indexable} label={t.ad} />
      </main>

      <SiteFooter locale={locale} />
    </div>
  );
}
