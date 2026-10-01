import { localizeDeep, localizeFixtures } from '@/lib/nations';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  getLeagueTeams,
  getTeamFixtures,
  getTeamPlayers,
  type Fixture,
  type StandingRow,
  type TeamInfo,
} from '@/lib/api-football';
import { competitionById, competitionName, roundLabel, seasonLabel, type Competition } from '@/lib/competitions';
import { getPickSplit } from '@/lib/community';
import {
  competitionPath,
  h2hPath,
  matchPath,
  playerPath,
  stadiumPath,
  teamPath,
  transfersPath,
} from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import { intlLocale, kickoffRows, longDateIn, shortDateIn, timeIn } from '@/lib/timezones';
import { AdSlot } from '@/components/ads/AdSlot';
import { CommunitySplit } from '@/components/blocks/CommunitySplit';
import { FaqSection } from '@/components/blocks/FaqSection';
import { LocalTime } from '@/components/LocalTime';
import { TeamCta } from '@/components/team/TeamCta';
import { Avatar, Crest, FixtureRow, OutcomeBadge, Panel } from '@/components/team/ui';
import {
  compSeasonSlug,
  countryName,
  currentPhase,
  currentRun,
  groupByPosition,
  isFinished,
  isFriendly,
  isUpcoming,
  leagueLabel,
  leaders,
  loadSeasonFixtures,
  loadSquad,
  loadTeam,
  mainSeasonLabel,
  loadTransfers,
  nowMs,
  outcomeFor,
  recentTransfers,
  seasonLine,
  teamRef,
  zoneForCountry,
  type Outcome,
} from '../_lib/data';
import { loadShell, resolveTeam, sportsTeamNode, TeamFrame, type TeamShell } from '../_lib/shell';
import { asLocale, teamStrings, type TeamStrings, fill } from '../_lib/strings';

// Team hub (plan A4 "Equipo"): next match with kickoff by country, form,
// table position, scorers, squad, transfers, seasons and rivals — every block
// backed by API-Football data and hidden when the data is not there.
//
// ISR: rendered on first request, then regenerated at most hourly. The team
// itself is loaded strictly (a failed API call keeps the last good copy);
// every other block tolerates a failure by not rendering.
//
// Quota per regeneration (most calls are shared cache entries with the
// sub-pages and the league pages): team, leagues, coach, standings, season
// fixtures, players (2–3 pages), squad, transfers, league teams.
export const revalidate = 3600;

export async function generateStaticParams() {
  return [];
}

type Params = { locale: string; slug: string };


export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  const locale = asLocale(raw);
  const core = await loadTeam(slug, locale);
  if (!core) return {};
  const L = teamStrings(locale);
  const t = core.info.team;
  const main = core.main;
  const league = main ? (main.competition ? competitionName(main.competition, locale) : main.name) : '';
  const vars = { team: t.name, country: countryName(t.country, locale), league, season: mainSeasonLabel(core) };
  return pageMetadata({
    locale,
    path: (l) => teamPath(l, teamRef(core)),
    title: fill(L.metaTitle, vars),
    description: fill(league ? L.metaDesc : L.metaDescNoLeague, vars),
    noindex: !core.playsCovered,
    images: t.logo ? [{ url: t.logo, width: 150, height: 150, alt: t.name }] : undefined,
    appRoute: `team/${t.id}`,
  });
}

// ---- Rules over real data --------------------------------------------------

function summarySentences(s: TeamShell, results: Outcome[]): string[] {
  const { L, team, standing, compName } = s;
  const out: string[] = [];
  if (standing && compName) {
    const r = standing.row;
    out.push(
      fill(L.sPosition, {
        team: team.name,
        rank: String(r.rank),
        league: compName,
        pts: String(r.points),
        played: String(r.all.played),
        w: String(r.all.win),
        d: String(r.all.draw),
        l: String(r.all.lose),
      }),
    );
  }
  const wins = currentRun(results, (o) => o === 'W');
  const unbeaten = currentRun(results, (o) => o !== 'L');
  const losses = currentRun(results, (o) => o === 'L');
  const winless = currentRun(results, (o) => o !== 'W');
  if (wins >= 3) out.push(fill(L.sWinRun, { n: String(wins) }));
  else if (unbeaten >= 4) out.push(fill(L.sUnbeaten, { n: String(unbeaten) }));
  else if (losses >= 3) out.push(fill(L.sLossRun, { n: String(losses) }));
  else if (winless >= 4) out.push(fill(L.sWinless, { n: String(winless) }));

  if (standing && compName) {
    const r = standing.row;
    const home = r.home;
    const away = r.away;
    if (home && home.played >= 3 && home.lose === 0) {
      out.push(fill(L.sHomeUnbeaten, { league: compName, w: String(home.win), d: String(home.draw), played: String(home.played) }));
    } else if (away && away.played >= 3 && away.lose === 0) {
      out.push(fill(L.sAwayUnbeaten, { league: compName, w: String(away.win), d: String(away.draw), played: String(away.played) }));
    }
    const rows = standing.group.rows;
    if (rows.length >= 6 && r.all.played >= 3) {
      const maxFor = Math.max(...rows.map((x) => x.all.goals.for));
      const minAgainst = Math.min(...rows.map((x) => x.all.goals.against));
      // Only when the team holds the record alone: "the best attack" shared
      // with two others is not a fact worth a sentence.
      if (r.all.goals.for === maxFor && rows.filter((x) => x.all.goals.for === maxFor).length === 1) {
        out.push(fill(L.sTopAttack, { league: compName, n: String(maxFor) }));
      }
      if (r.all.goals.against === minAgainst && rows.filter((x) => x.all.goals.against === minAgainst).length === 1) {
        out.push(fill(L.sBestDefense, { league: compName, n: String(minAgainst) }));
      }
    }
  }
  return out;
}

/** Same-city clubs of the league first (the derbies the data can prove),
 *  then the teams around it in the table. 3–6 pairs, never invented. */
function pickRivals(
  s: TeamShell,
  leagueTeams: TeamInfo[],
): { city: { id: number; name: string; logo: string }[]; table: { id: number; name: string; logo: string }[] } {
  const self = s.team.id;
  const norm = (v: string | null | undefined) =>
    (v ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().split(',')[0].trim();
  const myCity = norm(s.core.info.venue.city);
  const city = myCity
    ? leagueTeams
        .filter((t) => t.team.id !== self && norm(t.venue.city) === myCity)
        .map((t) => ({ id: t.team.id, name: t.team.name, logo: t.team.logo }))
        .slice(0, 4)
    : [];
  const table: { id: number; name: string; logo: string }[] = [];
  if (s.standing) {
    const rows = s.standing.group.rows;
    const idx = rows.findIndex((r) => r.team.id === self);
    const taken = new Set([self, ...city.map((c) => c.id)]);
    // Nearest positions first, alternating above and below.
    for (let d = 1; d < rows.length && city.length + table.length < 6; d++) {
      for (const j of [idx - d, idx + d]) {
        const r = rows[j];
        if (!r || taken.has(r.team.id) || city.length + table.length >= 6) continue;
        taken.add(r.team.id);
        table.push({ id: r.team.id, name: r.team.name, logo: r.team.logo });
      }
      if (city.length + table.length >= 3 && d >= 2) break;
    }
  }
  return { city, table };
}

function miniTable(rows: StandingRow[], teamId: number): StandingRow[] {
  const idx = rows.findIndex((r) => r.team.id === teamId);
  if (idx < 0) return [];
  const start = Math.max(0, Math.min(idx - 2, rows.length - 5));
  return rows.slice(start, start + 5);
}

function outcomeProps(L: TeamStrings, o: Outcome) {
  return { key: o, letter: L[o], title: L.wdl[o] };
}

// ---- Page ------------------------------------------------------------------

export default async function TeamPage({ params }: { params: Promise<Params> }) {
  const { locale: raw, slug } = await params;
  const locale = asLocale(raw);
  const core = await resolveTeam(slug, locale);
  const s = await loadShell(core, locale);
  const { L, team } = s;
  const id = team.id;
  const season = core.season;
  const main = core.main;
  const now = nowMs();
  const indexable = core.playsCovered;

  const [seasonFixturesRaw, players, squad, transferRowsRaw, leagueTeamsRaw] = await Promise.all([
    season ? loadSeasonFixtures(id, season) : Promise.resolve([] as Fixture[]),
    season ? getTeamPlayers(id, season) : Promise.resolve([]),
    loadSquad(id),
    loadTransfers(id),
    main ? getLeagueTeams(main.id, main.year) : Promise.resolve([] as TeamInfo[]),
  ]);

  const seasonFixtures = localizeFixtures(seasonFixturesRaw, locale);
  const transferRows = localizeDeep(transferRowsRaw, locale);
  const leagueTeams = localizeDeep(leagueTeamsRaw, locale);

  // The season list is the base (one call shared with the calendar). Between
  // seasons it may have nothing left to play or nothing played yet; only then
  // do we ask for the team's next / last matches across seasons.
  // Friendlies stay out of the form guide and the streak sentences: a
  // pre-season loss is not part of a team's run.
  const finishedSeason = seasonFixtures.filter((f) => isFinished(f) && !isFriendly(f.league));
  const liveNow = seasonFixtures.find((f) => ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE', 'INT'].includes(f.fixture.status.short));
  let upcoming = seasonFixtures.filter((f) => isUpcoming(f) && Date.parse(f.fixture.date) > now - 3 * 3600_000);
  let finished = finishedSeason;
  const [fallbackNextRaw, fallbackLastRaw] = await Promise.all([
    upcoming.length === 0 ? getTeamFixtures(id, { next: 5 }) : Promise.resolve([] as Fixture[]),
    finished.length === 0 ? getTeamFixtures(id, { last: 5 }) : Promise.resolve([] as Fixture[]),
  ]);
  const fallbackNext = localizeFixtures(fallbackNextRaw, locale);
  const fallbackLast = localizeFixtures(fallbackLastRaw, locale);
  if (upcoming.length === 0) upcoming = fallbackNext.filter(isUpcoming);
  if (finished.length === 0) finished = [...fallbackLast].filter((f) => isFinished(f) && !isFriendly(f.league)).sort((a, b) => a.fixture.date.localeCompare(b.fixture.date));

  const next = liveNow ?? upcoming[0] ?? null;
  const split = next ? await getPickSplit(next.fixture.id) : null;
  const results = finished.map((f) => outcomeFor(f, id)).filter((o): o is Outcome => o != null);
  const form = finished.slice(-5);
  const recent = finished.slice(-6).reverse();
  const upcomingList = upcoming.filter((f) => f !== next).slice(0, 5);
  const sentences = summarySentences(s, results);

  const scorers = leaders(players, id, (l) => l.goals, 5);
  const statsById = new Map(players.map((p) => [p.player.id, seasonLine(p, id)]));
  const squadGroups = groupByPosition(
    [...squad].sort((a, b) => (statsById.get(b.id)?.apps ?? 0) - (statsById.get(a.id)?.apps ?? 0) || (a.number ?? 99) - (b.number ?? 99)),
  );
  const moves = recentTransfers(transferRows, id, now);
  const movesIn = moves.filter((m) => m.direction === 'in').slice(0, 8);
  const movesOut = moves.filter((m) => m.direction === 'out').slice(0, 8);
  const rivals = pickRivals(s, leagueTeams);
  const mini = s.standing ? miniTable(s.standing.group.rows, id) : [];
  const seasonText = s.seasonText ?? '';
  // Played matches are dated in the club's own time zone (a result's date
  // does not depend on who reads it); upcoming ones in the visitor's.
  const zone = zoneForCountry(core.info.team.country, locale);

  // Season hub links for the competitions of this season (covered only).
  const compLinks = core.current.map((c) => {
    const comp = c.competition;
    const phase = c.id === main?.id ? (s.phase ?? currentPhase(seasonFixtures, c.id, now)) : currentPhase(seasonFixtures, c.id, now);
    const href = comp ? competitionPath(locale, c.id, compSeasonSlug(comp, c.year, phase)) : null;
    return { id: c.id, name: comp ? competitionName(comp, locale) : c.name, logo: c.logo, href };
  });

  // Seasons the team actually played in each covered competition (the
  // team-filtered /leagues lists only those), newest first.
  const seasonGroups = core.history
    .map((l) => ({ lid: l.league.id, comp: competitionById(l.league.id), l }))
    .filter((x): x is { lid: number; comp: Competition; l: (typeof core.history)[number] } => !!x.comp)
    .map(({ lid, comp, l }) => {
      const years = [...new Set(l.seasons.map((y) => y.year))].sort((a, b) => b - a).slice(0, comp.format === 'split' ? 4 : 6);
      const chips: { label: string; href: string | null }[] = [];
      for (const y of years) {
        if (comp.format === 'split') {
          const isCurrent = l.seasons.find((x) => x.year === y)?.current;
          const nowPhase = isCurrent && lid === main?.id ? s.phase : null;
          // Clausura first (it is the later tournament of the API season),
          // but not one that has not started yet.
          if (!(isCurrent && nowPhase === 'apertura')) {
            chips.push({ label: seasonLabel(comp, { apiSeason: y, phase: 'clausura' }, locale), href: competitionPath(locale, lid, compSeasonSlug(comp, y, 'clausura')) });
          }
          chips.push({ label: seasonLabel(comp, { apiSeason: y, phase: 'apertura' }, locale), href: competitionPath(locale, lid, compSeasonSlug(comp, y, 'apertura')) });
        } else {
          chips.push({ label: seasonLabel(comp, { apiSeason: y, phase: null }, locale), href: competitionPath(locale, lid, compSeasonSlug(comp, y, null)) });
        }
      }
      return { lid, name: competitionName(comp, locale), chips };
    })
    .filter((g) => g.chips.length > 0);

  // ---- FAQ (every answer from the data on this page) ----
  const faq: [string, string][] = [];
  const intl = intlLocale(locale);
  if (s.coach) {
    const since = s.coach.since
      ? fill(L.faqCoachSince, {
          date: new Date(s.coach.since).toLocaleDateString(intl, { month: 'long', year: 'numeric', timeZone: 'UTC' }),
        })
      : '';
    faq.push([fill(L.faqCoachQ, { team: team.name }), fill(L.faqCoachA, { team: team.name, coach: s.coach.coach.name, since })]);
  }
  const v = core.info.venue;
  if (v.name) {
    faq.push([
      fill(L.faqStadiumQ, { team: team.name }),
      fill(L.faqStadiumA, {
        team: team.name,
        venue: v.name,
        city: v.city ? fill(L.faqStadiumCity, { city: v.city }) : '',
        capacity: v.capacity ? fill(L.faqStadiumCap, { n: v.capacity.toLocaleString(intl) }) : '',
      }),
    ]);
  }
  if (next && !liveNow) {
    const z = zone;
    const tbd = next.fixture.status.short === 'TBD';
    const nv = {
      team: team.name,
      home: next.teams.home.name,
      away: next.teams.away.name,
      date: longDateIn(next.fixture.date, z.zone, locale),
      time: timeIn(next.fixture.date, z.zone, locale),
      zone: z.label,
      competition: leagueLabel(next.league, locale),
    };
    faq.push([fill(L.faqNextQ, { team: team.name }), fill(tbd ? L.faqNextTbdA : isFriendly(next.league) ? L.faqNextFriendlyA : L.faqNextA, nv)]);
  }
  if (s.standing && s.compName) {
    const r = s.standing.row;
    faq.push([
      fill(L.faqPosQ, { team: team.name, league: s.compName }),
      fill(L.faqPosA, {
        team: team.name,
        league: s.compName,
        rank: String(r.rank),
        pts: String(r.points),
        played: String(r.all.played),
        w: String(r.all.win),
        d: String(r.all.draw),
        l: String(r.all.lose),
      }),
    ]);
  }
  if (scorers[0]) {
    faq.push([
      fill(L.faqScorerQ, { team: team.name }),
      fill(L.faqScorerA, {
        player: scorers[0].name,
        team: team.name,
        season: seasonText,
        goals: String(scorers[0].value),
        apps: String(scorers[0].apps),
      }),
    ]);
  }

  const pagePath = teamPath(locale, team);
  const leagueTransfers = main ? transfersPath(locale, main.id) : null;
  const tableHref = main?.competition
    ? competitionPath(locale, main.id, compSeasonSlug(main.competition, main.year, s.phase), 'table')
    : null;

  return (
    <TeamFrame s={s} active="overview" title={team.name} jsonLd={[sportsTeamNode(s)]}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8">
        <div className="flex min-w-0 flex-col gap-6">
          {next ? <NextMatch f={next} s={s} live={!!liveNow} split={split} /> : null}

          {sentences.length || form.length ? (
            <Panel title={form.length ? L.form : undefined} aside={form.length ? L.formHint : undefined}>
              {form.length ? (
                <ol className="flex flex-wrap gap-2">
                  {form.map((f) => {
                    const o = outcomeFor(f, id);
                    if (!o) return null;
                    const home = f.teams.home.id === id;
                    const opp = home ? f.teams.away : f.teams.home;
                    // Score from this team's side (own goals first), the way
                    // a form guide reads.
                    const own = home ? f.goals.home : f.goals.away;
                    const against = home ? f.goals.away : f.goals.home;
                    return (
                      <li key={f.fixture.id}>
                        <Link
                          href={matchPath(locale, f)}
                          className="flex items-center gap-2 rounded-xl border border-border bg-surface-2 py-1.5 pr-3 pl-1.5 text-sm font-semibold transition-colors hover:border-primary/50"
                        >
                          <OutcomeBadge {...outcomeProps(L, o)} outcome={o} size="sm" />
                          <span className="tabular-nums">
                            {own}-{against}
                          </span>
                          <span className="max-w-[9rem] truncate text-muted-foreground">{opp.name}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              ) : null}
              {sentences.length ? (
                <p className={`${form.length ? 'mt-4' : ''} leading-relaxed font-semibold text-muted-foreground`}>
                  {sentences.join(' ')}
                </p>
              ) : null}
            </Panel>
          ) : null}

          {recent.length || upcomingList.length ? (
            <div className="grid gap-6 md:grid-cols-2">
              {recent.length ? (
                <Panel title={L.recent} flush>
                  <ul>
                    {recent.map((f) => {
                      const o = outcomeFor(f, id);
                      return (
                        <FixtureRow
                          key={f.fixture.id}
                          f={f}
                          locale={locale}
                          teamId={id}
                          outcome={o ? outcomeProps(L, o) : null}
                          dateLabel={shortDateIn(f.fixture.date, zone.zone, locale)}
                          meta={leagueLabel(f.league, locale)}
                        />
                      );
                    })}
                  </ul>
                </Panel>
              ) : null}
              {upcomingList.length ? (
                <Panel
                  title={L.upcoming}
                  flush
                  aside={
                    season ? (
                      <Link href={teamPath(locale, team, 'fixtures')} className="font-bold text-primary hover:underline">
                        {L.seeCalendar}
                      </Link>
                    ) : null
                  }
                >
                  <ul>
                    {upcomingList.map((f) => (
                      <FixtureRow key={f.fixture.id} f={f} locale={locale} teamId={id} meta={leagueLabel(f.league, locale)} />
                    ))}
                  </ul>
                </Panel>
              ) : null}
            </div>
          ) : null}

          <AdSlot label={L.ad} id="team-in-content-1" format="leaderboard" indexable={indexable} className="my-0" />

          {mini.length && s.compName ? (
            <Panel
              title={fill(L.standings, { league: s.compName })}
              flush
              aside={
                tableHref ? (
                  <Link href={tableHref} className="font-bold text-primary hover:underline">
                    {L.fullTable}
                  </Link>
                ) : null
              }
            >
              <div className="overflow-x-auto px-2 pb-2">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-bold tracking-wider text-muted-foreground uppercase">
                      <th className="px-3 py-2">#</th>
                      <th className="px-3 py-2">{L.tableCols.team}</th>
                      <th className="px-3 py-2 text-center">{L.tableCols.played}</th>
                      <th className="px-3 py-2 text-center">{L.tableCols.gd}</th>
                      <th className="px-3 py-2 text-right">{L.tableCols.pts}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mini.map((r) => {
                      const me = r.team.id === id;
                      return (
                        <tr key={r.team.id} className={`border-t border-border ${me ? 'bg-primary/10' : ''}`}>
                          <td className="px-3 py-2.5 font-display font-bold tabular-nums">{r.rank}</td>
                          <td className="px-3 py-2.5">
                            {me ? (
                              <span className="flex items-center gap-2 font-extrabold">
                                <Crest src={r.team.logo} size={20} />
                                {r.team.name}
                              </span>
                            ) : (
                              <Link href={teamPath(locale, r.team)} className="flex items-center gap-2 font-semibold hover:text-primary">
                                <Crest src={r.team.logo} size={20} />
                                {r.team.name}
                              </Link>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-center tabular-nums">{r.all.played}</td>
                          <td className="px-3 py-2.5 text-center tabular-nums">{r.goalsDiff > 0 ? `+${r.goalsDiff}` : r.goalsDiff}</td>
                          <td className="px-3 py-2.5 text-right font-display font-bold tabular-nums">{r.points}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Panel>
          ) : null}

          {scorers.length ? (
            <Panel title={L.scorers} aside={fill(L.scorersHint, { season: seasonText, team: team.name })}>
              <ol>
                {scorers.map((p, i) => (
                  <li key={p.id} className="flex items-center gap-3 border-t border-border py-2.5 first:border-t-0">
                    <span className="w-4 font-display font-bold text-muted-foreground tabular-nums">{i + 1}</span>
                    <Avatar src={p.photo} size={32} />
                    <Link href={playerPath(locale, p)} className="min-w-0 flex-1 truncate font-semibold hover:text-primary">
                      {p.name}
                    </Link>
                    <span className="font-display text-xl font-bold tabular-nums">{p.value}</span>
                  </li>
                ))}
              </ol>
            </Panel>
          ) : null}

          {squadGroups.length ? (
            <Panel
              title={L.squadPreview}
              aside={
                <Link href={teamPath(locale, team, 'squad')} className="font-bold text-primary hover:underline">
                  {L.seeSquad} ({fill(L.squadCount, { n: String(squad.length) })})
                </Link>
              }
            >
              <div className="grid gap-5 sm:grid-cols-2">
                {squadGroups.map((g) => (
                  <div key={g.position ?? 'other'}>
                    <h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                      {L.positions[g.position ?? 'other']} · {g.rows.length}
                    </h3>
                    <ul className="mt-2 space-y-1.5">
                      {g.rows.slice(0, 4).map((p) => (
                        <li key={p.id} className="flex items-center gap-2.5 text-sm">
                          <span className="w-6 text-right font-display font-bold text-muted-foreground tabular-nums">{p.number ?? ''}</span>
                          <Avatar src={p.photo} size={24} />
                          <Link href={playerPath(locale, p)} className="min-w-0 truncate font-semibold hover:text-primary">
                            {p.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Panel>
          ) : null}

          {movesIn.length || movesOut.length ? (
            <Panel
              title={L.transfers}
              aside={
                leagueTransfers && s.compName ? (
                  <Link href={leagueTransfers} className="font-bold text-primary hover:underline">
                    {fill(L.allTransfers, { league: s.compName })}
                  </Link>
                ) : null
              }
            >
              <div className="grid gap-5 sm:grid-cols-2">
                {(
                  [
                    ['in', L.transfersIn, movesIn],
                    ['out', L.transfersOut, movesOut],
                  ] as const
                ).map(([dir, label, list]) =>
                  list.length ? (
                    <div key={dir}>
                      <h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">{label}</h3>
                      <ul className="mt-2 divide-y divide-border">
                        {list.map((m) => (
                          <li key={`${m.playerId}-${dir}`} className="py-2 text-sm">
                            <Link href={playerPath(locale, { id: m.playerId, name: m.playerName })} className="font-bold hover:text-primary">
                              {m.playerName}
                            </Link>
                            <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs font-semibold text-muted-foreground">
                              <Crest src={m.other.logo} size={16} />
                              <Link href={teamPath(locale, m.other)} className="hover:text-foreground">
                                {fill(dir === 'in' ? L.fromClub : L.toClub, { club: m.other.name })}
                              </Link>
                              <span aria-hidden="true">·</span>
                              <time dateTime={m.date}>
                                {new Date(m.date).toLocaleDateString(intl, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })}
                              </time>
                              {m.type ? (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span>{L.transferTypes[m.type] ?? m.type}</span>
                                </>
                              ) : null}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null,
                )}
              </div>
            </Panel>
          ) : null}

          <AdSlot label={L.ad} id="team-in-content-2" format="in-article" indexable={indexable} className="my-0" />

          {rivals.city.length + rivals.table.length > 0 ? (
            <Panel title={L.rivals}>
              {(
                [
                  [L.rivalsCity, rivals.city],
                  [L.rivalsLeague, rivals.table],
                ] as const
              ).map(([label, list]) =>
                list.length ? (
                  <div key={label} className="mt-1 first:mt-0 [&+&]:mt-4">
                    <h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">{label}</h3>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {list.map((r) => (
                        <li key={r.id}>
                          <Link
                            href={h2hPath(locale, team, r)}
                            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-2 py-1.5 pr-4 pl-1.5 text-sm font-bold transition-colors hover:border-primary/50"
                          >
                            <Crest src={team.logo} size={22} />
                            {team.name} {L.vs} {r.name}
                            <Crest src={r.logo} size={22} />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null,
              )}
            </Panel>
          ) : null}

          <FaqSection title={fill(L.faqTitle, { team: team.name })} entries={faq} pagePath={pagePath} className="" />

          <AdSlot label={L.ad} id="team-in-content-3" format="leaderboard" indexable={indexable} className="my-0" />
        </div>

        <aside className="flex min-w-0 flex-col gap-6">
          <ClubCard s={s} />

          {compLinks.length ? (
            <Panel title={fill(L.competitions, { season: seasonText })} as="h2">
              <ul className="flex flex-wrap gap-2">
                {compLinks.map((c) => {
                  const inner = (
                    <>
                      <Crest src={c.logo} size={22} />
                      {c.name}
                    </>
                  );
                  const cls = 'inline-flex items-center gap-2 rounded-full border border-border bg-surface-2 py-1.5 pr-4 pl-1.5 text-sm font-bold';
                  return (
                    <li key={c.id}>
                      {c.href ? (
                        <Link href={c.href} className={`${cls} transition-colors hover:border-primary/50`}>
                          {inner}
                        </Link>
                      ) : (
                        <span className={cls}>{inner}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Panel>
          ) : null}

          {seasonGroups.map((g) => (
            <Panel key={g.lid} title={fill(L.seasons, { league: g.name })}>
              <ul className="flex flex-wrap gap-2">
                {g.chips.map((c) => (
                  <li key={c.label}>
                    {c.href ? (
                      <Link
                        href={c.href}
                        className="inline-flex rounded-full border border-border px-3 py-1.5 text-sm font-semibold transition-colors hover:border-primary/50 hover:text-primary"
                      >
                        {c.label}
                      </Link>
                    ) : (
                      <span className="inline-flex rounded-full border border-border px-3 py-1.5 text-sm font-semibold">{c.label}</span>
                    )}
                  </li>
                ))}
              </ul>
            </Panel>
          ))}

          <TeamCta
            compact
            teamId={id}
            title={fill(L.ctaTitle, { team: team.name })}
            body={fill(L.ctaBody, { team: team.name })}
            labels={{ open: L.openApp, ios: L.ios, android: L.android }}
          />
        </aside>
      </div>
    </TeamFrame>
  );
}

// ---- Blocks ----------------------------------------------------------------

function NextMatch({ f, s, live, split }: { f: Fixture; s: TeamShell; live: boolean; split: Awaited<ReturnType<typeof getPickSplit>> }) {
  const { L, locale } = s;
  const tbd = f.fixture.status.short === 'TBD';
  const comp = competitionById(f.league.id);
  const round = roundLabel(f.league.round, locale, comp);
  const rows = !tbd && !live ? kickoffRows(f.fixture.date, locale) : [];
  const side = (t: Fixture['teams']['home']) => (
    <Link href={teamPath(locale, t)} className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
      <Crest src={t.logo} size={56} />
      <span className="line-clamp-2 text-sm font-bold">{t.name}</span>
    </Link>
  );
  return (
    <Panel title={L.nextMatch} aside={isFriendly(f.league) ? leagueLabel(f.league, locale) : `${leagueLabel(f.league, locale)} · ${round}`}>
      <div className="flex items-center justify-between gap-3 rounded-xl bg-surface-2 p-4">
        {side(f.teams.home)}
        <div className="flex shrink-0 flex-col items-center gap-1 px-1 text-center">
          {live ? (
            <>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-live-glow px-2.5 py-1 text-xs font-bold text-live">
                <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-live" />
                {L.live}
                {f.fixture.status.elapsed ? ` ${f.fixture.status.elapsed}'` : ''}
              </span>
              <span className="font-display text-3xl font-bold tabular-nums">
                {f.goals.home ?? 0}-{f.goals.away ?? 0}
              </span>
            </>
          ) : (
            <span className="font-display text-3xl font-bold tabular-nums">
              {tbd ? L.vs : <LocalTime iso={f.fixture.date} locale={locale} style="time" />}
            </span>
          )}
        </div>
        {side(f.teams.away)}
      </div>
      <p className="mt-3 text-sm font-semibold text-muted-foreground">
        {tbd ? `${L.timeTbd} · ` : `${L.yourTime} `}
        <LocalTime iso={f.fixture.date} locale={locale} />
        {f.fixture.venue.name ? ` · ${f.fixture.venue.name}` : ''}
      </p>
      {rows.length ? (
        <div className="mt-4">
          <h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">{L.kickoffByCountry}</h3>
          <ul className="mt-2 grid grid-cols-1 gap-x-6 text-sm min-[420px]:grid-cols-2">
            {rows.map((r) => (
              <li key={r.key} className="flex items-baseline justify-between gap-3 border-t border-border py-1.5">
                <span className="truncate font-semibold">{r.label}</span>
                <span className="shrink-0 tabular-nums">
                  <span className="text-xs font-semibold text-muted-foreground capitalize">{r.date}</span>{' '}
                  <b>{r.time}</b>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {split ? (
        <div className="mt-4">
          <CommunitySplit split={split} home={f.teams.home.name} away={f.teams.away.name} locale={locale} compact />
        </div>
      ) : null}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold text-muted-foreground">{L.noStream}</p>
        <Link href={matchPath(locale, f)} className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground hover:brightness-105">
          {L.seeMatch} →
        </Link>
      </div>
    </Panel>
  );
}

function ClubCard({ s }: { s: TeamShell }) {
  const { L, locale, core, coach } = s;
  const v = core.info.venue;
  const intl = intlLocale(locale);
  const rows: { label: string; value: React.ReactNode }[] = [];
  if (v.name) {
    rows.push({
      label: L.facts.stadium,
      value: v.id ? (
        <Link href={stadiumPath(locale, { id: v.id, name: v.name })} className="font-bold text-primary hover:underline">
          {v.name}
        </Link>
      ) : (
        v.name
      ),
    });
  }
  if (v.capacity) rows.push({ label: L.facts.capacity, value: v.capacity.toLocaleString(intl) });
  if (v.city) rows.push({ label: L.facts.city, value: v.city });
  rows.push({ label: L.facts.country, value: countryName(core.info.team.country, locale) });
  if (core.info.team.founded) rows.push({ label: L.facts.founded, value: core.info.team.founded });
  return (
    <Panel>
      {coach ? (
        <div className="mb-4 flex items-center gap-3 border-b border-border pb-4">
          <Avatar src={coach.coach.photo} size={48} />
          <div className="min-w-0">
            <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">{L.facts.coach}</p>
            <p className="truncate font-bold">{coach.coach.name}</p>
            {coach.coach.nationality ? <p className="text-sm font-semibold text-muted-foreground">{coach.coach.nationality}</p> : null}
          </div>
        </div>
      ) : null}
      <dl className="space-y-2.5 text-sm">
        {rows.map((r) => (
          <div key={r.label} className="flex items-baseline justify-between gap-4">
            <dt className="font-semibold text-muted-foreground">{r.label}</dt>
            <dd className="min-w-0 text-right font-semibold">{r.value}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}
