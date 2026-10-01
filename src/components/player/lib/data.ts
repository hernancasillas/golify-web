// Everything the player page renders, loaded once per render (React cache
// dedupes the generateMetadata + page calls) and reduced to plain facts.
//
// API budget per uncached render (plan rule: ~10, shared quota with the app):
//   profile 1 · season stats ×2 · transfers 1 · trophies 1 · team season
//   fixtures 1 · last-5 fixture details ≤5 (shared cache with match pages,
//   finished matches cached for a day) · squad 1.
// Most of these are long-TTL (daily/weekly), so a warm render costs ~0–3.

import { cache } from 'react';
import {
  FINISHED_STATUSES,
  TTL,
  getFixtureDetail,
  getPlayer,
  getPlayerProfile,
  getPlayerTransfers,
  getPlayerTrophies,
  getSquad,
  getTeamFixtures,
  getTeamSeasonFixtures,
  type Fixture,
  type PlayerBio,
  type PlayerSeasonStats,
  type SquadPlayer,
  type TeamRef,
  type Transfer,
  type Trophy,
} from '@/lib/api-football';
import { competitionById, isCovered, type Competition } from '@/lib/competitions';
import { slugify } from '@/lib/slug';
import { findFcCard, type FcCard } from './fc';

// ---- Names ------------------------------------------------------------------

/** The name people search for. The provider's short name abbreviates the
 *  first name ("E. Haaland"); when it does, and the initial matches the real
 *  first name, we expand it ("Erling Haaland"). Anything else ("Mohamed
 *  Salah", "Raphael Veiga", "Icaro") is already the common name. */
export function commonName(p: Pick<PlayerBio, 'name' | 'firstname'>): string {
  const m = /^((?:\p{L}\.\s*)+)(.+)$/u.exec(p.name.trim());
  const first = p.firstname?.trim().split(/\s+/)[0];
  if (!m || !first) return p.name;
  const initial = slugify(m[1])[0];
  if (!initial || slugify(first)[0] !== initial) return p.name;
  return `${first} ${m[2].trim()}`;
}

export function fullName(p: Pick<PlayerBio, 'firstname' | 'lastname'>): string | null {
  const n = [p.firstname, p.lastname].filter(Boolean).join(' ').trim();
  return n || null;
}

// ---- Seasons ---------------------------------------------------------------

/** A national team row: API-Football names them after the country
 *  ("Mexico", "Mexico U23"). */
function isNationalTeam(team: TeamRef, nationality: string | null): boolean {
  // The provider sometimes sends a stats row with a null team.
  if (!nationality || !team?.name) return false;
  return team.name === nationality || team.name.startsWith(`${nationality} U`);
}

export interface CompetitionLine {
  season: number;
  leagueId: number | null;
  leagueName: string;
  competition: Competition | null;
  team: TeamRef;
  national: boolean;
  apps: number;
  starts: number;
  minutes: number;
  goals: number;
  assists: number;
  rating: number | null;
  yellow: number;
  red: number;
}

export interface SeasonTotals {
  season: number;
  apps: number;
  minutes: number;
  goals: number;
  assists: number;
  shots: number | null;
  shotsOn: number | null;
  passAccuracy: number | null;
  yellow: number;
  red: number;
  conceded: number | null;
  saves: number | null;
  /** Covered competitions summed into these totals. */
  competitions: string[];
}

const n = (v: number | null | undefined) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

function toLine(s: PlayerSeasonStats, season: number, nationality: string | null): CompetitionLine {
  const rating = s.games.rating ? Number(s.games.rating) : null;
  return {
    season,
    leagueId: s.league.id,
    leagueName: s.league.name,
    competition: s.league.id != null ? competitionById(s.league.id) : null,
    team: s.team,
    national: isNationalTeam(s.team, nationality),
    apps: n(s.games.appearences),
    starts: n(s.games.lineups),
    minutes: n(s.games.minutes),
    goals: n(s.goals.total),
    assists: n(s.goals.assists),
    rating: rating != null && Number.isFinite(rating) && rating > 0 ? rating : null,
    yellow: n(s.cards.yellow),
    red: n(s.cards.red) + n(s.cards.yellowred),
  };
}

function totals(season: number, rows: PlayerSeasonStats[], competitionLabel: (s: PlayerSeasonStats) => string): SeasonTotals | null {
  const covered = rows.filter((s) => s.league.id != null && isCovered(s.league.id) && n(s.games.appearences) > 0);
  if (!covered.length) return null;
  let passes = 0;
  let passWeighted = 0;
  let shotsKnown = false;
  let gkKnown = false;
  const t: SeasonTotals = {
    season,
    apps: 0,
    minutes: 0,
    goals: 0,
    assists: 0,
    shots: 0,
    shotsOn: 0,
    passAccuracy: null,
    yellow: 0,
    red: 0,
    conceded: 0,
    saves: 0,
    competitions: [],
  };
  for (const s of covered) {
    t.apps += n(s.games.appearences);
    t.minutes += n(s.games.minutes);
    t.goals += n(s.goals.total);
    t.assists += n(s.goals.assists);
    if (s.shots.total != null || s.shots.on != null) shotsKnown = true;
    t.shots = (t.shots ?? 0) + n(s.shots.total);
    t.shotsOn = (t.shotsOn ?? 0) + n(s.shots.on);
    if (s.passes.total && s.passes.accuracy != null) {
      passes += s.passes.total;
      passWeighted += s.passes.total * s.passes.accuracy;
    }
    t.yellow += n(s.cards.yellow);
    t.red += n(s.cards.red) + n(s.cards.yellowred);
    if (s.goals.conceded != null || s.goals.saves != null) gkKnown = true;
    t.conceded = (t.conceded ?? 0) + n(s.goals.conceded);
    t.saves = (t.saves ?? 0) + n(s.goals.saves);
    const label = competitionLabel(s);
    if (!t.competitions.includes(label)) t.competitions.push(label);
  }
  if (!shotsKnown) {
    t.shots = null;
    t.shotsOn = null;
  }
  if (!gkKnown) {
    t.conceded = null;
    t.saves = null;
  }
  // API-Football's per-row accuracy is a percentage of that row's passes, so
  // the season figure is the pass-weighted mean, not the mean of the rows.
  t.passAccuracy = passes > 0 ? Math.round(passWeighted / passes) : null;
  return t;
}

// ---- Club ------------------------------------------------------------------

export interface ClubInfo {
  team: TeamRef;
  /** Main covered league the club plays this season (breadcrumb, copy). */
  league: Competition | null;
  number: number | null;
}

function pickClub(rows: PlayerSeasonStats[], nationality: string | null): ClubInfo | null {
  const clubRows = rows.filter((s) => !isNationalTeam(s.team, nationality));
  if (!clubRows.length) return null;
  // The club he actually plays for: most minutes, then most apps. A mid-season
  // transfer leaves two clubs in one season; the busier one wins until the
  // new club's minutes overtake it.
  const byTeam = new Map<number, { team: TeamRef; minutes: number; apps: number; rows: PlayerSeasonStats[] }>();
  for (const s of clubRows) {
    const e = byTeam.get(s.team.id) ?? { team: s.team, minutes: 0, apps: 0, rows: [] };
    e.minutes += n(s.games.minutes);
    e.apps += n(s.games.appearences);
    e.rows.push(s);
    byTeam.set(s.team.id, e);
  }
  const best = [...byTeam.values()].sort((a, b) => b.minutes - a.minutes || b.apps - a.apps)[0];
  const leagueRows = best.rows
    .map((s) => ({ s, c: s.league.id != null ? competitionById(s.league.id) : null }))
    .filter((x): x is { s: PlayerSeasonStats; c: Competition } => !!x.c);
  const league =
    leagueRows.filter((x) => x.c.kind === 'league').sort((a, b) => n(b.s.games.appearences) - n(a.s.games.appearences))[0]?.c ??
    leagueRows.sort((a, b) => n(b.s.games.appearences) - n(a.s.games.appearences))[0]?.c ??
    null;
  const number = best.rows.map((s) => s.games.number).find((x): x is number => typeof x === 'number') ?? null;
  return { team: best.team, league, number };
}

// ---- Matches -----------------------------------------------------------------

export interface MatchLine {
  fixture: Fixture;
  /** His team's result: W / D / L. */
  result: 'W' | 'D' | 'L' | null;
  /** 'played' with a stat line; 'bench' = in the squad sheet, 0 minutes;
   *  'out' = not in the match sheet; 'nodata' = the provider has no player
   *  stats for this match. */
  status: 'played' | 'bench' | 'out' | 'nodata';
  minutes: number | null;
  goals: number;
  assists: number;
  rating: number | null;
}

function resultFor(f: Fixture, teamId: number): MatchLine['result'] {
  // `goals` excludes the shoot-out, so a match decided on penalties reads as
  // the draw it was (the shoot-out is shown next to the score).
  const { home, away } = f.goals;
  if (home == null || away == null) return null;
  const mine = f.teams.home.id === teamId ? home : away;
  const theirs = f.teams.home.id === teamId ? away : home;
  return mine > theirs ? 'W' : mine < theirs ? 'L' : 'D';
}

async function lastMatches(teamId: number, playerId: number, seasonFixtures: Fixture[]): Promise<MatchLine[]> {
  let finished = seasonFixtures.filter((f) => FINISHED_STATUSES.includes(f.fixture.status.short));
  if (!finished.length) {
    // Season just started: the last five are last season's.
    finished = (await getTeamFixtures(teamId, { last: 5 })).filter((f) => FINISHED_STATUSES.includes(f.fixture.status.short));
  }
  const last5 = [...finished].sort((a, b) => b.fixture.date.localeCompare(a.fixture.date)).slice(0, 5);
  // Finished matches do not change: a day-long cache entry, shared with the
  // match pages that request the same /fixtures?id= URL.
  const details = await Promise.all(last5.map((f) => getFixtureDetail(f.fixture.id, { revalidate: TTL.daily })));
  return last5.map((f, i) => {
    const d = details[i];
    const base = { fixture: f, result: resultFor(f, teamId), minutes: null, goals: 0, assists: 0, rating: null };
    if (!d || !d.players.length) return { ...base, status: 'nodata' as const };
    const mine = d.players.find((t) => t.team.id === teamId) ?? null;
    const row = mine?.players.find((p) => p.player.id === playerId);
    if (!row) {
      const inSheet = d.lineups.some((l) => l.team.id === teamId && [...l.startXI, ...l.substitutes].some((x) => x.player.id === playerId));
      return { ...base, status: inSheet ? ('bench' as const) : ('out' as const) };
    }
    const st = row.statistics[0];
    const minutes = st?.games.minutes ?? null;
    if (!minutes) return { ...base, status: 'bench' as const };
    const rating = st.games.rating ? Number(st.games.rating) : null;
    return {
      ...base,
      status: 'played' as const,
      minutes,
      goals: n(st.goals.total),
      assists: n(st.goals.assists),
      rating: rating != null && Number.isFinite(rating) && rating > 0 ? rating : null,
    };
  });
}

// ---- Career ------------------------------------------------------------------

export interface Stint {
  team: TeamRef;
  from: string | null;
  to: string | null;
  loan: boolean;
  current: boolean;
}

/** Club stints from the transfer list: each move opens a stint at the new
 *  club and closes the previous one. The first club's start is unknown. */
function careerFrom(transfers: Transfer[], clubId: number | null): Stint[] {
  const moves = [...transfers]
    .filter((t) => t.date && t.teams?.in?.id && t.teams?.out?.id)
    .sort((a, b) => a.date.localeCompare(b.date));
  if (!moves.length) return [];
  const stints: Stint[] = [{ team: moves[0].teams.out, from: null, to: moves[0].date, loan: false, current: false }];
  for (let i = 0; i < moves.length; i++) {
    const t = moves[i];
    const next = moves[i + 1];
    const prev = stints[stints.length - 1];
    if (prev.team.id === t.teams.in.id) {
      prev.to = next?.date ?? null;
      continue;
    }
    stints.push({
      team: t.teams.in,
      from: t.date,
      to: next?.date ?? null,
      loan: /loan/i.test(t.type ?? '') && !/back/i.test(t.type ?? ''),
      current: false,
    });
  }
  const last = stints[stints.length - 1];
  // Only call the last stint "current" when the stats agree he is still
  // there; the transfer feed lags behind the season data.
  if (last.to == null) last.current = clubId != null && last.team.id === clubId;
  return stints.reverse();
}

/** Newest first, without the provider's double entries (the same move filed
 *  twice a few weeks apart, e.g. on signing and on registration). */
function dedupeTransfers(transfers: Transfer[]): Transfer[] {
  const out: Transfer[] = [];
  const sorted = [...transfers]
    // A move from a club to itself is an internal promotion (academy → first
    // team), not a transfer.
    .filter((t) => t.date && t.teams?.in?.id && t.teams?.out?.id && t.teams.in.id !== t.teams.out.id)
    .sort((a, b) => b.date.localeCompare(a.date));
  for (const t of sorted) {
    const dup = out.find(
      (o) =>
        o.teams.in.id === t.teams.in.id &&
        o.teams.out.id === t.teams.out.id &&
        Math.abs(new Date(o.date).getTime() - new Date(t.date).getTime()) < 120 * 86400_000,
    );
    if (!dup) out.push(t);
  }
  return out;
}

// ---- Trophies ------------------------------------------------------------------

function seasonStart(s: string): number {
  const m = /(\d{4})/.exec(s);
  return m ? Number(m[1]) : 0;
}

// ---- Loader ------------------------------------------------------------------

export interface PlayerPageData {
  profile: PlayerBio;
  name: string;
  fullName: string | null;
  club: ClubInfo | null;
  position: string | null;
  number: number | null;
  age: number | null;
  current: SeasonTotals | null;
  /** API season the "current" tiles describe (this year, or last year when
   *  this year has no covered appearances yet). */
  currentSeason: number;
  lines: CompetitionLine[];
  seasonsShown: number[];
  matches: MatchLine[];
  nextMatch: Fixture | null;
  career: Stint[];
  transfers: Transfer[];
  titles: Trophy[];
  titlesTotal: number;
  similar: SquadPlayer[];
  fc: FcCard | null;
  /** Plan A4 threshold: ≥ 1 appearance in a covered competition this season
   *  or last. */
  indexable: boolean;
}

function ageFrom(birth: string | null | undefined, fallback: number | null): number | null {
  if (!birth) return fallback;
  const b = new Date(`${birth}T00:00:00Z`);
  if (Number.isNaN(+b)) return fallback;
  const now = new Date();
  let age = now.getUTCFullYear() - b.getUTCFullYear();
  const m = now.getUTCMonth() - b.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < b.getUTCDate())) age--;
  return age;
}

export const loadPlayer = cache(async (id: number): Promise<PlayerPageData | null> => {
  // Primary entity: strict, so a provider failure throws (ISR keeps the last
  // good copy) and only a genuine "no such player" becomes a 404.
  const profile = await getPlayerProfile(id, { strict: true });
  if (!profile) return null;

  const year = new Date().getUTCFullYear();
  // Strict too: these two decide indexability, and an API failure must not
  // be published as "0 appearances → noindex".
  const [thisYear, lastYear, transfers, trophies] = await Promise.all([
    getPlayer(id, year, { strict: true }),
    getPlayer(id, year - 1, { strict: true }),
    getPlayerTransfers(id),
    getPlayerTrophies(id),
  ]);

  const nat = profile.nationality;
  const rowsY = thisYear?.statistics ?? [];
  const rowsP = lastYear?.statistics ?? [];

  const label = (s: PlayerSeasonStats) => {
    const c = s.league.id != null ? competitionById(s.league.id) : null;
    return c?.name ?? s.league.name;
  };
  // Which API season is "now" for him: this year once he has played club
  // football in it, otherwise last year. Between January and June a
  // cross-year season (Premier League 2026/27 = API 2026, Liga MX Clausura
  // 2027 = API 2026) is still last year's, and a national-team friendly in
  // March must not flip the page to an empty new season.
  const playedClub = (rows: PlayerSeasonStats[]) =>
    rows.some((s) => !isNationalTeam(s.team, nat) && n(s.games.appearences) > 0);
  const currentSeason = playedClub(rowsY) ? year : playedClub(rowsP) ? year - 1 : year;
  const currentRows = currentSeason === year ? rowsY : rowsP;
  // Tiles sum covered competitions only; a player whose new league we do not
  // cover gets the honest "no games in covered competitions yet" line.
  const current = totals(currentSeason, currentRows, label);

  // The club comes from the latest season with any club row, covered or not
  // (a move to an uncovered league must not leave him at his old club).
  const club = pickClub(currentRows.some((s) => !isNationalTeam(s.team, nat)) ? currentRows : rowsY.length ? rowsY : rowsP, nat) ??
    // No season rows at all: the latest transfer is the best evidence left.
    (() => {
      const latest = [...transfers].sort((a, b) => b.date.localeCompare(a.date))[0];
      return latest?.teams?.in?.id ? { team: latest.teams.in, league: null, number: null } : null;
    })();

  const lines = [...rowsY.map((s) => toLine(s, year, nat)), ...rowsP.map((s) => toLine(s, year - 1, nat))].filter(
    // The provider sometimes files a national team's all-time tally under one
    // season (42 Gold Cup games in 2025). No national side plays more than 15
    // matches of one competition in a season, so such a row is an error, not
    // a stat line, and is left out rather than published.
    (l) => l.apps > 0 && !(l.national && l.apps > 15),
  );
  const seasonsShown = [...new Set(lines.map((l) => l.season))].sort((a, b) => b - a);

  const position =
    profile.position ?? currentRows.map((s) => s.games.position).find((p): p is string => !!p) ?? null;
  const number = profile.number ?? club?.number ?? null;

  let matches: MatchLine[] = [];
  let nextMatch: Fixture | null = null;
  let similar: SquadPlayer[] = [];
  if (club) {
    const [seasonFixtures, squad] = await Promise.all([
      getTeamSeasonFixtures(club.team.id, currentSeason),
      getSquad(club.team.id),
    ]);
    const now = Date.now();
    nextMatch =
      seasonFixtures.find((f) => f.fixture.status.short === 'NS' && new Date(f.fixture.date).getTime() > now) ?? null;
    matches = await lastMatches(club.team.id, id, seasonFixtures);
    const inSquad = squad.some((p) => p.id === id);
    // "Similar" = same club, same position. Only when he is in that squad —
    // otherwise the club guess above may be stale.
    similar = inSquad && position ? squad.filter((p) => p.id !== id && p.position === position).slice(0, 3) : [];
  }

  const winners = trophies
    .filter((t) => t.place === 'Winner')
    .sort((a, b) => seasonStart(b.season) - seasonStart(a.season));

  const fc = await findFcCard(profile);

  const indexable = [...rowsY, ...rowsP].some(
    (s) => s.league.id != null && isCovered(s.league.id) && n(s.games.appearences) > 0,
  );

  return {
    profile,
    name: commonName(profile),
    fullName: fullName(profile),
    club,
    position,
    number,
    age: ageFrom(profile.birth?.date, profile.age),
    current,
    currentSeason,
    lines,
    seasonsShown,
    matches,
    nextMatch,
    career: careerFrom(dedupeTransfers(transfers), club?.team.id ?? null),
    transfers: dedupeTransfers(transfers).slice(0, 10),
    titles: winners.slice(0, 10),
    titlesTotal: winners.length,
    similar,
    fc,
    indexable,
  };
});
