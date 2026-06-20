import type { APIFootballStanding } from "@/lib/api-football.types";
// Relative import (not "@/") so this module stays runnable under the pure
// `node --test` runner. `simulateLiveStandings` is itself dependency-free
// (type-only imports) and is the same projection used by the group tables, so
// the bracket and the standings cards never disagree about live scores.
import { simulateLiveStandings } from "./liveStandings";
import {
  FINAL,
  lookupThirdPlaceAssignment,
  QUARTER_FINALS,
  ROUND_OF_16,
  ROUND_OF_32,
  SEMI_FINALS,
  type SlotSpec,
  THIRD_PLACE_PLAYOFF,
  type ThirdPlaceSlot,
} from "./worldCup2026BracketAssignments";
import type {
  BracketMatch,
  BracketMeta,
  BracketSlot,
  GenerateBracketInput,
  GroupLetter,
  RankedGroup,
  ThirdPlaceEntry,
  WorldCupBracket,
} from "./types";

const GROUP_LETTERS: GroupLetter[] = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L",
];
const MATCHES_PER_TEAM = 3;

// ─── Ranking ─────────────────────────────────────────────────────────────────

/**
 * Deterministic group-ranking comparator. Returns negative when `a` should rank
 * ABOVE `b`. Order: points → goal difference → goals scored → the API's own
 * rank (which already resolves head-to-head / fair-play when our criteria tie)
 * → team id (final, fully deterministic tiebreak).
 *
 * Head-to-head and fair-play are not separately available in the standings data
 * model, so we defer to the API's resolved `rank` for those cases.
 */
export function compareStandingRows(
  a: APIFootballStanding,
  b: APIFootballStanding,
): number {
  if (b.points !== a.points) return b.points - a.points;
  if (b.goalsDiff !== a.goalsDiff) return b.goalsDiff - a.goalsDiff;
  if (b.all.goals.for !== a.all.goals.for) return b.all.goals.for - a.all.goals.for;
  if (a.rank !== b.rank) return a.rank - b.rank;
  return a.team.id - b.team.id;
}

/** Extracts the group letter (A–L) from a standing's group field, or null. */
export function parseGroupLetter(group: string | undefined | null): GroupLetter | null {
  const m = group?.match(/Group\s+([A-L])\s*$/i);
  const letter = m?.[1]?.toUpperCase();
  return letter && (GROUP_LETTERS as string[]).includes(letter)
    ? (letter as GroupLetter)
    : null;
}

/**
 * Buckets flat standings by group, projects live fixtures onto each group, and
 * sorts every group top-to-bottom. Returns groups in alphabetical order.
 */
export function rankGroups(input: GenerateBracketInput): RankedGroup[] {
  const { standings, liveFixtures = [] } = input;
  const buckets = new Map<GroupLetter, APIFootballStanding[]>();
  for (const s of standings) {
    const letter = parseGroupLetter(s.group);
    if (!letter) continue;
    if (!buckets.has(letter)) buckets.set(letter, []);
    buckets.get(letter)!.push(s);
  }

  const result: RankedGroup[] = [];
  for (const letter of GROUP_LETTERS) {
    const rows = buckets.get(letter);
    if (!rows) continue;
    // Project live scores (no-op when there are no live fixtures for the group),
    // then apply our deterministic comparator.
    const projected = simulateLiveStandings(rows, liveFixtures) as APIFootballStanding[];
    const sorted = [...projected].sort(compareStandingRows);
    result.push({ group: letter, rows: sorted });
  }
  return result;
}

/**
 * Ranks all third-placed teams across the groups and flags the best 8. A group
 * contributes a third-placed team only when it has at least 3 ranked rows.
 */
export function rankThirdPlace(rankedGroups: RankedGroup[]): ThirdPlaceEntry[] {
  const thirds: { group: GroupLetter; row: APIFootballStanding }[] = [];
  for (const g of rankedGroups) {
    if (g.rows.length >= 3) thirds.push({ group: g.group, row: g.rows[2] });
  }

  thirds.sort((a, b) => compareStandingRows(a.row, b.row));

  return thirds.map((t, i) => ({
    group: t.group,
    row: t.row,
    rank: i + 1,
    qualified: i < 8,
  }));
}

// ─── Slot resolution ───────────────────────────────────────────────────────────

interface ResolveContext {
  groupsByLetter: Map<GroupLetter, RankedGroup>;
  /** winner-slot → assigned third-place group, when the Annex C lookup resolved. */
  thirdAssignment: Record<ThirdPlaceSlot, GroupLetter> | null;
}

function teamFromRow(row: APIFootballStanding | undefined) {
  return row ? { id: row.team.id, name: row.team.name, logo: row.team.logo } : null;
}

function groupSlot(
  ctx: ResolveContext,
  group: GroupLetter,
  position: 1 | 2 | 3,
  placeholder: string,
): BracketSlot {
  const rows = ctx.groupsByLetter.get(group)?.rows;
  return {
    source: { type: "group", group, position },
    team: teamFromRow(rows?.[position - 1]),
    placeholder,
  };
}

function resolveSlot(spec: SlotSpec, ctx: ResolveContext): BracketSlot {
  switch (spec.kind) {
    case "winner":
      return groupSlot(ctx, spec.group, 1, `1${spec.group}`);
    case "runnerUp":
      return groupSlot(ctx, spec.group, 2, `2${spec.group}`);
    case "third": {
      const assignedGroup = ctx.thirdAssignment?.[spec.winnerSlot];
      if (assignedGroup) return groupSlot(ctx, assignedGroup, 3, `3${assignedGroup}`);
      return {
        source: { type: "thirdPlacePending", eligibleGroups: spec.eligible },
        team: null,
        placeholder: `3[${spec.eligible.join("")}]`,
      };
    }
    case "matchWinner":
      return {
        source: { type: "matchWinner", matchNumber: spec.matchNumber },
        team: null,
        placeholder: `W${spec.matchNumber}`,
      };
    case "matchLoser":
      return {
        source: { type: "matchLoser", matchNumber: spec.matchNumber },
        team: null,
        placeholder: `L${spec.matchNumber}`,
      };
  }
}

function buildMatch(
  spec: { matchNumber: number; round: BracketMatch["round"]; home: SlotSpec; away: SlotSpec },
  ctx: ResolveContext,
): BracketMatch {
  return {
    matchNumber: spec.matchNumber,
    round: spec.round,
    home: resolveSlot(spec.home, ctx),
    away: resolveSlot(spec.away, ctx),
  };
}

// ─── Entry point ───────────────────────────────────────────────────────────────

/**
 * Generates the projected World Cup 2026 knockout bracket from the CURRENT
 * group standings — "what would the Round of 32 look like if the group stage
 * ended right now". Pure and deterministic: no simulation, no prediction, no
 * randomness. Rounds are returned in bracket (fold) order.
 */
export function generateWorldCupBracket(
  input: GenerateBracketInput,
): WorldCupBracket {
  const rankedGroups = rankGroups(input);
  const groupsByLetter = new Map<GroupLetter, RankedGroup>(
    rankedGroups.map((g) => [g.group, g]),
  );
  const groupsPresent = rankedGroups.map((g) => g.group);

  const thirdPlaceRanking = rankThirdPlace(rankedGroups);

  // We can project third-place assignments only when all 12 groups have a
  // determinable top 3 — otherwise the cross-group ranking is incomplete.
  const canProjectThirdPlace =
    groupsPresent.length === 12 &&
    rankedGroups.every((g) => g.rows.length >= 3);

  const qualifiedGroups: GroupLetter[] = [];
  for (const e of thirdPlaceRanking) {
    if (e.qualified) qualifiedGroups.push(e.group);
  }

  const thirdAssignment = canProjectThirdPlace
    ? lookupThirdPlaceAssignment(qualifiedGroups)
    : null;

  const thirdPlaceKey =
    canProjectThirdPlace && qualifiedGroups.length === 8
      ? [...qualifiedGroups].sort().join("")
      : null;

  const groupStageComplete =
    rankedGroups.length === 12 &&
    rankedGroups.every(
      (g) =>
        g.rows.length === 4 &&
        g.rows.every((r) => r.all.played >= MATCHES_PER_TEAM),
    );

  const ctx: ResolveContext = { groupsByLetter, thirdAssignment };

  const meta: BracketMeta = {
    groupsPresent,
    canProjectThirdPlace,
    thirdPlaceKey,
    groupStageComplete,
    thirdPlaceRanking,
  };

  return {
    roundOf32: ROUND_OF_32.map((m) => buildMatch(m, ctx)),
    roundOf16: ROUND_OF_16.map((m) => buildMatch(m, ctx)),
    quarterFinals: QUARTER_FINALS.map((m) => buildMatch(m, ctx)),
    semiFinals: SEMI_FINALS.map((m) => buildMatch(m, ctx)),
    thirdPlace: buildMatch(THIRD_PLACE_PLAYOFF, ctx),
    final: buildMatch(FINAL, ctx),
    meta,
  };
}
