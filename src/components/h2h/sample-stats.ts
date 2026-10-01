// Result statistics over a sample of finished matches (the matches played at
// a stadium, the matches a referee officiated). Pure functions: the pages
// state the sample's size next to every number computed here.

import type { Fixture, FixtureDetail } from '@/lib/api-football';
import { isPlayed, isShootoutEvent } from './shared';

export interface LeagueCount {
  leagueId: number;
  /** One fixture of the competition, to print its name and link it. */
  sample: Fixture;
  n: number;
}

export interface SampleStats {
  played: number;
  goals: number;
  homeWins: number;
  draws: number;
  awayWins: number;
  /** Widest margin in the sample (ties: more goals, then the newest). */
  biggest: Fixture | null;
  /** Competitions in the sample, most matches first. */
  byLeague: LeagueCount[];
}

function margin(f: Fixture): number {
  return Math.abs((f.goals.home ?? 0) - (f.goals.away ?? 0));
}

function total(f: Fixture): number {
  return (f.goals.home ?? 0) + (f.goals.away ?? 0);
}

/** `fixtures` may contain anything; only finished matches with a score count. */
export function sampleStats(fixtures: Fixture[]): SampleStats {
  const played = fixtures.filter(isPlayed).sort((a, b) => b.fixture.date.localeCompare(a.fixture.date));
  let goals = 0;
  let homeWins = 0;
  let draws = 0;
  let awayWins = 0;
  let biggest: Fixture | null = null;
  const leagues = new Map<number, LeagueCount>();
  for (const f of played) {
    const h = f.goals.home ?? 0;
    const a = f.goals.away ?? 0;
    goals += h + a;
    // Over 90/120 minutes: a shootout is a draw, as on the H2H page.
    if (h > a) homeWins++;
    else if (a > h) awayWins++;
    else draws++;
    if (margin(f) > 0 && (!biggest || margin(f) > margin(biggest) || (margin(f) === margin(biggest) && total(f) > total(biggest)))) {
      biggest = f;
    }
    const l = leagues.get(f.league.id) ?? { leagueId: f.league.id, sample: f, n: 0 };
    l.n++;
    leagues.set(f.league.id, l);
  }
  return {
    played: played.length,
    goals,
    homeWins,
    draws,
    awayWins,
    biggest,
    byLeague: [...leagues.values()].sort((x, y) => y.n - x.n),
  };
}

export interface DisciplineStats {
  /** Matches whose event feed was available (the denominator). */
  matches: number;
  yellow: number;
  red: number;
  /** Penalties awarded in play (scored or missed, shootouts excluded). */
  penalties: number;
  /** Cards shown to the home side / the away side. */
  homeCards: number;
  awayCards: number;
  /** Per-fixture counts, to print next to each match. */
  perFixture: Map<number, { yellow: number; red: number; penalties: number }>;
}

/** Cards and penalties from fixture events. A match with an empty event feed
 *  is left out of the sample instead of counted as "no cards". */
export function disciplineStats(details: FixtureDetail[]): DisciplineStats {
  const out: DisciplineStats = { matches: 0, yellow: 0, red: 0, penalties: 0, homeCards: 0, awayCards: 0, perFixture: new Map() };
  for (const f of details) {
    if (f.events.length === 0) continue;
    out.matches++;
    const row = { yellow: 0, red: 0, penalties: 0 };
    for (const e of f.events) {
      if (e.type === 'Card') {
        // One event per card shown. A second yellow is a sending-off: the
        // provider spells it "Red Card" or, in some feeds, "Second Yellow card".
        if (/second yellow|red/i.test(e.detail)) row.red++;
        else if (/yellow/i.test(e.detail)) row.yellow++;
        else continue;
        if (e.team.id === f.teams.home.id) out.homeCards++;
        else if (e.team.id === f.teams.away.id) out.awayCards++;
      } else if (e.type === 'Goal' && (e.detail === 'Penalty' || e.detail === 'Missed Penalty') && !isShootoutEvent(e)) {
        row.penalties++;
      }
    }
    out.yellow += row.yellow;
    out.red += row.red;
    out.penalties += row.penalties;
    out.perFixture.set(f.fixture.id, row);
  }
  return out;
}
