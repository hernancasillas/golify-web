// Mathematical clinch detection for World Cup groups.
//
// Determines, per group, which final positions are mathematically locked
// regardless of the remaining results — so the bracket can show "Definido"
// instead of "Proyección" before the group physically finishes (e.g. a team
// that already secured 1st via head-to-head with a game still to play).
//
// SOUND BY CONSTRUCTION: a position is reported locked only when the same team
// holds it across EVERY win/draw/loss combination of the remaining matches AND
// every tie it cannot break by points or head-to-head points. Tiebreaks that
// depend on the goal difference / goals scored of an UNPLAYED match are treated
// as ambiguous (both orders possible), so we never over-claim a lock. The cost
// is completeness: a purely goal-difference clinch is left as a projection —
// the safe direction to err.
//
// FIFA tiebreak order implemented (Annex, group stage):
//   points → head-to-head among tied teams (pts, GD, GF) → overall GD →
//   overall GF. Fair-play and FIFA ranking are not modelled (no data); a tie
//   still unresolved after overall GF is treated as ambiguous.

import type {
  APIFootballFixture,
  APIFootballStanding,
} from "@/lib/api-football.types";

export interface ClinchMatch {
  homeId: number;
  awayId: number;
  /** Final goals when finished; null when not yet played (an open outcome). */
  homeGoals: number | null;
  awayGoals: number | null;
}

export interface GroupClinch {
  /** teamId → every final position (1-based) the team can still occupy. */
  possibleRanks: Map<number, Set<number>>;
  /** position (1-based) → every team that can still finish there. */
  positionOccupants: Map<number, Set<number>>;
}

// Brute-force guard: 3^n combinations. A WC group has ≤6 matches (3^6 = 729).
const MAX_REMAINING = 8;

/** A match with its outcome resolved for one enumerated combination. */
interface ResolvedMatch {
  homeId: number;
  awayId: number;
  homeGoals: number | null; // null when goals are unknown (remaining match)
  awayGoals: number | null;
  played: boolean; // true → goals are known
}

function pointsFor(m: ResolvedMatch, teamId: number): number {
  const isHome = m.homeId === teamId;
  if (m.played) {
    const gf = isHome ? m.homeGoals! : m.awayGoals!;
    const ga = isHome ? m.awayGoals! : m.homeGoals!;
    return gf > ga ? 3 : gf === ga ? 1 : 0;
  }
  // Remaining match: outcome encoded in homeGoals/awayGoals as 1/0 markers.
  const homeWin = m.homeGoals === 1 && m.awayGoals === 0;
  const awayWin = m.homeGoals === 0 && m.awayGoals === 1;
  if (homeWin) return isHome ? 3 : 0;
  if (awayWin) return isHome ? 0 : 3;
  return 1; // draw
}

/** Criterion value for a set of teams; `known=false` when goals are needed but
 *  some required match is unplayed, making the comparison ambiguous. */
interface Metric {
  values: Map<number, number>;
  known: boolean;
}

function totalPoints(ids: number[], matches: ResolvedMatch[]): Map<number, number> {
  const pts = new Map<number, number>();
  for (const id of ids) pts.set(id, 0);
  for (const m of matches) {
    if (pts.has(m.homeId)) pts.set(m.homeId, pts.get(m.homeId)! + pointsFor(m, m.homeId));
    if (pts.has(m.awayId)) pts.set(m.awayId, pts.get(m.awayId)! + pointsFor(m, m.awayId));
  }
  return pts;
}

/** Head-to-head metrics among `ids`: only matches with BOTH ends in `ids`. */
function miniMetric(
  ids: number[],
  matches: ResolvedMatch[],
  kind: "pts" | "gd" | "gf",
): Metric {
  const set = new Set(ids);
  const mutual = matches.filter((m) => set.has(m.homeId) && set.has(m.awayId));
  const values = new Map<number, number>();
  for (const id of ids) values.set(id, 0);
  let known = true;
  for (const m of mutual) {
    if (kind === "pts") {
      values.set(m.homeId, values.get(m.homeId)! + pointsFor(m, m.homeId));
      values.set(m.awayId, values.get(m.awayId)! + pointsFor(m, m.awayId));
      continue;
    }
    if (!m.played) {
      known = false; // GD/GF need goals we don't have
      continue;
    }
    if (kind === "gd") {
      values.set(m.homeId, values.get(m.homeId)! + (m.homeGoals! - m.awayGoals!));
      values.set(m.awayId, values.get(m.awayId)! + (m.awayGoals! - m.homeGoals!));
    } else {
      values.set(m.homeId, values.get(m.homeId)! + m.homeGoals!);
      values.set(m.awayId, values.get(m.awayId)! + m.awayGoals!);
    }
  }
  return { values, known };
}

/** Overall (full-group) GD or GF for each team; `known=false` if any of their
 *  matches is unplayed. */
function overallMetric(
  ids: number[],
  matches: ResolvedMatch[],
  kind: "gd" | "gf",
): Metric {
  const set = new Set(ids);
  const values = new Map<number, number>();
  for (const id of ids) values.set(id, 0);
  let known = true;
  for (const m of matches) {
    const involvesBlock = set.has(m.homeId) || set.has(m.awayId);
    if (!involvesBlock) continue;
    if (!m.played) {
      if (set.has(m.homeId) || set.has(m.awayId)) known = false;
      continue;
    }
    if (set.has(m.homeId)) {
      values.set(
        m.homeId,
        values.get(m.homeId)! + (kind === "gd" ? m.homeGoals! - m.awayGoals! : m.homeGoals!),
      );
    }
    if (set.has(m.awayId)) {
      values.set(
        m.awayId,
        values.get(m.awayId)! + (kind === "gd" ? m.awayGoals! - m.homeGoals! : m.awayGoals!),
      );
    }
  }
  return { values, known };
}

/** Split `ids` into descending value buckets; preserves ties as same bucket. */
function bucketByValueDesc(ids: number[], values: Map<number, number>): number[][] {
  const sorted = [...ids].sort((a, b) => values.get(b)! - values.get(a)!);
  const buckets: number[][] = [];
  for (const id of sorted) {
    const last = buckets[buckets.length - 1];
    if (last && values.get(last[0])! === values.get(id)!) last.push(id);
    else buckets.push([id]);
  }
  return buckets;
}

/**
 * Orders a points-tied block into tiers (top → bottom). A tier with >1 team is
 * ambiguous: any of its teams may occupy any of its positions. Applies the
 * head-to-head criteria, re-applying to still-tied subsets (per FIFA), then
 * overall GD/GF. Stops at the first criterion whose data is unknown.
 */
function resolveBlock(ids: number[], matches: ResolvedMatch[]): number[][] {
  if (ids.length === 1) return [ids];

  const criteria: (() => Metric)[] = [
    () => miniMetric(ids, matches, "pts"),
    () => miniMetric(ids, matches, "gd"),
    () => miniMetric(ids, matches, "gf"),
    () => overallMetric(ids, matches, "gd"),
    () => overallMetric(ids, matches, "gf"),
  ];

  for (const criterion of criteria) {
    const { values, known } = criterion();
    if (!known) break; // ambiguous from here down
    const buckets = bucketByValueDesc(ids, values);
    if (buckets.length > 1) {
      // Split achieved — recurse into each still-tied subset (smaller block).
      return buckets.flatMap((b) => resolveBlock(b, matches));
    }
    // All equal on this criterion → try the next one.
  }
  return [ids]; // unbreakable with the data/criteria we have → ambiguous
}

/** Full group ordering for one enumerated combination. */
function orderGroup(teamIds: number[], matches: ResolvedMatch[]): number[][] {
  const pts = totalPoints(teamIds, matches);
  const pointBlocks = bucketByValueDesc(teamIds, pts);
  return pointBlocks.flatMap((b) => resolveBlock(b, matches));
}

export function computeGroupClinch(
  teamIds: number[],
  matches: ClinchMatch[],
): GroupClinch | null {
  const remaining = matches.filter(
    (m) => m.homeGoals === null || m.awayGoals === null,
  );
  if (remaining.length > MAX_REMAINING) return null;

  const possibleRanks = new Map<number, Set<number>>();
  const positionOccupants = new Map<number, Set<number>>();
  for (const id of teamIds) possibleRanks.set(id, new Set());
  for (let p = 1; p <= teamIds.length; p++) positionOccupants.set(p, new Set());

  const playedResolved: ResolvedMatch[] = matches
    .filter((m) => m.homeGoals !== null && m.awayGoals !== null)
    .map((m) => ({ ...m, played: true }));

  const total = Math.pow(3, remaining.length);
  for (let combo = 0; combo < total; combo++) {
    // Encode this combo's outcome per remaining match as 1/0 markers.
    const resolvedRemaining: ResolvedMatch[] = [];
    let c = combo;
    for (const m of remaining) {
      const outcome = c % 3;
      c = Math.floor(c / 3);
      resolvedRemaining.push({
        homeId: m.homeId,
        awayId: m.awayId,
        homeGoals: outcome === 0 ? 1 : 0, // 0 → home win
        awayGoals: outcome === 1 ? 1 : 0, // 1 → away win; else draw (0/0)
        played: false,
      });
    }
    const all = [...playedResolved, ...resolvedRemaining];
    const tiers = orderGroup(teamIds, all);

    let pos = 1;
    for (const tier of tiers) {
      const span = tier.length;
      for (const id of tier) {
        for (let p = pos; p < pos + span; p++) {
          possibleRanks.get(id)!.add(p);
          positionOccupants.get(p)!.add(id);
        }
      }
      pos += span;
    }
  }

  return { possibleRanks, positionOccupants };
}

const FINISHED_STATUS = new Set(["FT", "AET", "PEN"]);

function groupLetterOf(group: string | undefined | null): string | null {
  return group?.match(/Group ([A-Z])$/i)?.[1]?.toUpperCase() ?? null;
}

/**
 * Builds per-group clinch data straight from API standings + fixtures. Groups
 * teams by their standings group letter, collects each group's finished
 * round-robin results (live/in-progress matches count as open outcomes), and
 * runs the clinch engine. Skips a group whose fixtures are incomplete (can't
 * reason soundly without the full round-robin). Shared by BracketsTab and
 * GruposTab so both tables agree on what's locked / qualified.
 */
export function buildGroupClinch(
  standings: APIFootballStanding[],
  fixtures: APIFootballFixture[],
): Map<string, GroupClinch> {
  const teamGroup = new Map<number, string>();
  const groupTeams = new Map<string, number[]>();
  for (const s of standings) {
    const letter = groupLetterOf(s.group);
    if (!letter) continue;
    teamGroup.set(s.team.id, letter);
    if (!groupTeams.has(letter)) groupTeams.set(letter, []);
    groupTeams.get(letter)!.push(s.team.id);
  }

  const byGroup = new Map<string, ClinchMatch[]>();
  for (const f of fixtures) {
    if (!/group/i.test(f.league.round)) continue;
    const letter = teamGroup.get(f.teams.home.id);
    if (!letter || teamGroup.get(f.teams.away.id) !== letter) continue;
    const finished = FINISHED_STATUS.has(f.fixture.status.short);
    if (!byGroup.has(letter)) byGroup.set(letter, []);
    byGroup.get(letter)!.push({
      homeId: f.teams.home.id,
      awayId: f.teams.away.id,
      homeGoals: finished ? f.goals.home : null,
      awayGoals: finished ? f.goals.away : null,
    });
  }

  const result = new Map<string, GroupClinch>();
  for (const [letter, ids] of groupTeams) {
    const ms = byGroup.get(letter) ?? [];
    const expected = (ids.length * (ids.length - 1)) / 2;
    if (ids.length < 2 || ms.length !== expected) continue;
    const c = computeGroupClinch(ids, ms);
    if (c) result.set(letter, c);
  }
  return result;
}
