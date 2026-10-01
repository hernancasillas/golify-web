// Head-to-head record computed from the provider's meeting list.
//
// Scope, stated everywhere the numbers appear: API-Football's head-to-head
// history only reaches back to the seasons it carries (around 2010–2016 for
// most Latin American leagues), so a "historial" here is "the meetings we have
// on record", never "all-time". The page copy says so in every sentence that
// uses a total.

import type { Fixture, FixtureDetail, TeamRef } from '@/lib/api-football';
import { goalsAgainst, goalsFor, isFriendly, isPlayed, isShootoutEvent, isUpcoming, resultFor } from './shared';

export interface Run {
  length: number;
  from: Fixture;
  to: Fixture;
}

export interface SideRecord {
  team: TeamRef;
  wins: number;
  goals: number;
  /** Largest winning margin (ties broken by goals scored). */
  biggestWin: Fixture | null;
  /** Longest stretch of meetings without losing. */
  unbeaten: Run | null;
  /** Record as the home side. */
  home: { played: number; w: number; d: number; l: number };
}

export interface CompetitionSplit {
  leagueId: number;
  sample: Fixture;
  played: number;
  winsA: number;
  draws: number;
  winsB: number;
}

export interface H2HRecord {
  a: SideRecord;
  b: SideRecord;
  /** Finished meetings the record is computed over, newest first. */
  counted: Fixture[];
  draws: number;
  /** Friendlies left out of the record (still listed with their label). */
  friendliesExcluded: number;
  /** True when every finished meeting was a friendly, so friendlies count. */
  includesFriendlies: boolean;
  mostGoals: Fixture | null;
  /** Ongoing streak from the latest meeting backwards. */
  streak: { side: 'a' | 'b'; kind: 'wins' | 'unbeaten'; length: number } | null;
  byCompetition: CompetitionSplit[];
  next: Fixture | null;
}

function latestTeam(fixtures: Fixture[], id: number): TeamRef | null {
  for (const f of fixtures) {
    if (f.teams.home.id === id) return { id, name: f.teams.home.name, logo: f.teams.home.logo };
    if (f.teams.away.id === id) return { id, name: f.teams.away.name, logo: f.teams.away.logo };
  }
  return null;
}

/** Both teams as the most recent meeting names them (clubs rebrand: the
 *  provider renamed "Guadalajara" to "Guadalajara Chivas" mid-history). */
export function pairTeams(newestFirst: Fixture[], idA: number, idB: number): [TeamRef, TeamRef] | null {
  const a = latestTeam(newestFirst, idA);
  const b = latestTeam(newestFirst, idB);
  return a && b ? [a, b] : null;
}

function side(team: TeamRef, counted: Fixture[]): SideRecord {
  let wins = 0;
  let goals = 0;
  let biggestWin: Fixture | null = null;
  const home = { played: 0, w: 0, d: 0, l: 0 };
  for (const f of counted) {
    const r = resultFor(f, team.id);
    goals += goalsFor(f, team.id);
    if (r === 'w') {
      wins++;
      const margin = goalsFor(f, team.id) - goalsAgainst(f, team.id);
      const best = biggestWin ? goalsFor(biggestWin, team.id) - goalsAgainst(biggestWin, team.id) : -1;
      if (margin > best || (margin === best && biggestWin && goalsFor(f, team.id) > goalsFor(biggestWin, team.id))) {
        biggestWin = f;
      }
    }
    if (f.teams.home.id === team.id) {
      home.played++;
      home[r]++;
    }
  }
  // Unbeaten runs, oldest → newest.
  let unbeaten: Run | null = null;
  const chrono = [...counted].reverse();
  let start = -1;
  for (let i = 0; i < chrono.length; i++) {
    if (resultFor(chrono[i], team.id) === 'l') {
      start = -1;
      continue;
    }
    if (start < 0) start = i;
    const length = i - start + 1;
    if (!unbeaten || length > unbeaten.length) unbeaten = { length, from: chrono[start], to: chrono[i] };
  }
  return { team, wins, goals, biggestWin, unbeaten, home };
}

export function computeH2H(all: Fixture[], a: TeamRef, b: TeamRef, now: number): H2HRecord {
  const newestFirst = [...all].sort((p, q) => q.fixture.date.localeCompare(p.fixture.date));
  const played = newestFirst.filter(isPlayed);
  const official = played.filter((f) => !isFriendly(f));
  const includesFriendlies = official.length === 0 && played.length > 0;
  const counted = includesFriendlies ? played : official;

  const ra = side(a, counted);
  const rb = side(b, counted);
  const draws = counted.length - ra.wins - rb.wins;

  let mostGoals: Fixture | null = null;
  for (const f of counted) {
    const g = (f.goals.home ?? 0) + (f.goals.away ?? 0);
    if (!mostGoals || g > (mostGoals.goals.home ?? 0) + (mostGoals.goals.away ?? 0)) mostGoals = f;
  }

  // Current streak from the newest meeting.
  let streak: H2HRecord['streak'] = null;
  if (counted.length > 0) {
    const first = resultFor(counted[0], a.id);
    if (first !== 'd') {
      const s: 'a' | 'b' = first === 'w' ? 'a' : 'b';
      const id = s === 'a' ? a.id : b.id;
      let wins = 0;
      while (wins < counted.length && resultFor(counted[wins], id) === 'w') wins++;
      let unbeaten = 0;
      while (unbeaten < counted.length && resultFor(counted[unbeaten], id) !== 'l') unbeaten++;
      streak = wins >= 2 ? { side: s, kind: 'wins', length: wins } : unbeaten >= 3 ? { side: s, kind: 'unbeaten', length: unbeaten } : null;
    } else {
      // A draw last time: the streak, if any, is an unbeaten one.
      for (const s of ['a', 'b'] as const) {
        const id = s === 'a' ? a.id : b.id;
        let n = 0;
        while (n < counted.length && resultFor(counted[n], id) !== 'l') n++;
        if (n >= 3 && (!streak || n > streak.length)) streak = { side: s, kind: 'unbeaten', length: n };
      }
    }
  }

  const comps = new Map<number, CompetitionSplit>();
  for (const f of counted) {
    const c = comps.get(f.league.id) ?? { leagueId: f.league.id, sample: f, played: 0, winsA: 0, draws: 0, winsB: 0 };
    c.played++;
    const r = resultFor(f, a.id);
    if (r === 'w') c.winsA++;
    else if (r === 'l') c.winsB++;
    else c.draws++;
    comps.set(f.league.id, c);
  }

  const next =
    [...newestFirst].reverse().find((f) => isUpcoming(f, now)) ?? null;

  return {
    a: ra,
    b: rb,
    counted,
    draws,
    friendliesExcluded: includesFriendlies ? 0 : played.length - official.length,
    includesFriendlies,
    mostGoals,
    streak,
    byCompetition: [...comps.values()].sort((x, y) => y.played - x.played),
    next,
  };
}

export interface Scorer {
  id: number | null;
  name: string;
  teamId: number;
  goals: number;
  penalties: number;
}

/** Goals per player across the given finished meetings. Own goals and
 *  shootout kicks are not a player's goals in a duel, so they are left out. */
export function duelScorers(details: FixtureDetail[]): Scorer[] {
  const by = new Map<string, Scorer>();
  for (const f of details) {
    for (const e of f.events) {
      if (e.type !== 'Goal' || !e.player?.name) continue;
      if (e.detail === 'Own Goal' || e.detail === 'Missed Penalty' || isShootoutEvent(e)) continue;
      const key = e.player.id ? `id:${e.player.id}` : `n:${e.player.name}:${e.team.id}`;
      const s = by.get(key) ?? { id: e.player.id, name: e.player.name, teamId: e.team.id, goals: 0, penalties: 0 };
      s.goals++;
      if (e.detail === 'Penalty') s.penalties++;
      by.set(key, s);
    }
  }
  return [...by.values()].sort((x, y) => y.goals - x.goals || x.name.localeCompare(y.name));
}
