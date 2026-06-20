// Overlays real knockout fixtures onto the projected bracket.
//
// The engine only fills the Round of 32 (from group standings); R16→Final stay
// as "winner of match N" placeholders. Once knockout matches are actually
// scheduled/played, this layer attaches each real fixture to its bracket slot
// and propagates winners forward — so a played R32 result fills the R16 slot it
// feeds, and so on up to the Final.
//
// Matching is by team-pair (no FIFA match number exists in the API): a knockout
// fixture whose two teams equal a bracket match's two resolved participants is
// that match. Winners come from API-Football's `teams.home/away.winner` flag,
// which already accounts for extra time and penalties.

import type { APIFootballFixture } from '@/lib/api-football.types';
import type { BracketMatch, BracketSlot, WorldCupBracket } from './types';

export interface OverlayTeam {
  id: number;
  name: string;
  logo: string;
}

export interface MatchOverlay {
  /** Resolved participants (from group qualification or a prior round's winner). */
  home: OverlayTeam | null;
  away: OverlayTeam | null;
  /** The real fixture for this match, when one exists for the resolved pair. */
  fixture: {
    id: number;
    date: string;
    statusShort: string;
    elapsed: number | null;
    homeId: number;
    homeGoals: number | null;
    awayGoals: number | null;
  } | null;
  /** Winner team id once decided (drives the next round). */
  winnerId: number | null;
}

const FINISHED = new Set(['FT', 'AET', 'PEN']);

function pairKey(a: number, b: number): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

function teamFromSlot(slot: BracketSlot): OverlayTeam | null {
  return slot.team
    ? { id: slot.team.id, name: slot.team.name, logo: slot.team.logo }
    : null;
}

/**
 * Builds a matchNumber → overlay map. Walks rounds in bracket order so each
 * round can read the winners resolved by the previous one.
 */
export function buildBracketOverlay(
  bracket: WorldCupBracket,
  fixtures: APIFootballFixture[],
): Map<number, MatchOverlay> {
  // Index knockout fixtures (exclude group stage) by team-pair.
  const byPair = new Map<string, APIFootballFixture>();
  for (const f of fixtures) {
    if (/group/i.test(f.league.round)) continue;
    byPair.set(pairKey(f.teams.home.id, f.teams.away.id), f);
  }

  const overlays = new Map<number, MatchOverlay>();

  // Winner via API's flag (accounts for AET/PEN). Null until settled, which
  // keeps the next round as a placeholder.
  const winnerOf = (f: APIFootballFixture): number | null => {
    if (f.teams.home.winner === true) return f.teams.home.id;
    if (f.teams.away.winner === true) return f.teams.away.id;
    return null;
  };

  const teamRef = (
    f: APIFootballFixture,
    side: 'home' | 'away',
  ): OverlayTeam => ({
    id: f.teams[side].id,
    name: f.teams[side].name,
    logo: f.teams[side].logo,
  });

  const resolve = (
    match: BracketMatch,
    homeTeam: OverlayTeam | null,
    awayTeam: OverlayTeam | null,
  ): MatchOverlay => {
    let fixture: MatchOverlay['fixture'] = null;
    let winnerId: number | null = null;
    let home = homeTeam;
    let away = awayTeam;

    if (homeTeam && awayTeam) {
      const f = byPair.get(pairKey(homeTeam.id, awayTeam.id));
      if (f) {
        // Use the fixture's own team objects (authoritative names/logos).
        home = teamRef(f, 'home');
        away = teamRef(f, 'away');
        fixture = {
          id: f.fixture.id,
          date: f.fixture.date,
          statusShort: f.fixture.status.short,
          elapsed: f.fixture.status.elapsed,
          homeId: f.teams.home.id,
          homeGoals: f.goals.home,
          awayGoals: f.goals.away,
        };
        if (FINISHED.has(f.fixture.status.short)) {
          winnerId = winnerOf(f);
        }
      }
    }

    const overlay: MatchOverlay = { home, away, fixture, winnerId };
    overlays.set(match.matchNumber, overlay);
    return overlay;
  };

  // Winner of a feeding match → OverlayTeam (id+name+logo), or null.
  const winnerTeam = (matchNumber: number): OverlayTeam | null => {
    const o = overlays.get(matchNumber);
    if (!o || o.winnerId == null) return null;
    if (o.home?.id === o.winnerId) return o.home;
    if (o.away?.id === o.winnerId) return o.away;
    return null;
  };
  const loserTeam = (matchNumber: number): OverlayTeam | null => {
    const o = overlays.get(matchNumber);
    if (!o || o.winnerId == null) return null;
    if (o.home && o.home.id !== o.winnerId) return o.home;
    if (o.away && o.away.id !== o.winnerId) return o.away;
    return null;
  };

  const teamForSource = (slot: BracketSlot): OverlayTeam | null => {
    switch (slot.source.type) {
      case 'group':
      case 'thirdPlacePending':
        return teamFromSlot(slot); // R32: from group standings
      case 'matchWinner':
        return winnerTeam(slot.source.matchNumber);
      case 'matchLoser':
        return loserTeam(slot.source.matchNumber);
    }
  };

  // R32 first (participants from group standings), then each later round reads
  // the winners the previous round just resolved.
  for (const m of bracket.roundOf32) {
    resolve(m, teamFromSlot(m.home), teamFromSlot(m.away));
  }
  for (const m of bracket.roundOf16) {
    resolve(m, teamForSource(m.home), teamForSource(m.away));
  }
  for (const m of bracket.quarterFinals) {
    resolve(m, teamForSource(m.home), teamForSource(m.away));
  }
  for (const m of bracket.semiFinals) {
    resolve(m, teamForSource(m.home), teamForSource(m.away));
  }
  // Third-place playoff feeds off the semifinal LOSERS.
  resolve(
    bracket.thirdPlace,
    teamForSource(bracket.thirdPlace.home),
    teamForSource(bracket.thirdPlace.away),
  );
  resolve(
    bracket.final,
    teamForSource(bracket.final.home),
    teamForSource(bracket.final.away),
  );

  return overlays;
}
