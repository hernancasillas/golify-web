import type { BracketRound, GroupLetter } from "./types";
import {
  THIRD_PLACE_SLOT_ORDER,
  WC2026_THIRD_PLACE_MATRIX,
} from "./worldCup2026Matrix";

/**
 * worldCup2026BracketAssignments
 * ───────────────────────────────
 * Single source of truth for the 2026 World Cup knockout structure.
 *
 * The 2026 format does NOT place third-placed teams into fixed slots: which
 * group's third-placed team faces which group winner depends on which 8 of the
 * 12 groups produce a qualifying third-placed team. FIFA publishes the official
 * mapping (495 = C(12,8) combinations) in Annex C of the tournament
 * regulations. That table lives — verbatim and validated — in
 * `worldCup2026Matrix.ts`. Everything here is table-driven; there is no
 * per-combination branching.
 *
 * Structure source: Wikipedia "2026 FIFA World Cup knockout stage" bracket,
 * cross-checked with the FIFA match schedule. All match numbers are official.
 */

/** Winner-group slots that face a third-placed team (matrix column order). */
export type ThirdPlaceSlot = (typeof THIRD_PLACE_SLOT_ORDER)[number];

/** How a single side of a match is sourced. */
export type SlotSpec =
  | { kind: "winner"; group: GroupLetter }
  | { kind: "runnerUp"; group: GroupLetter }
  | { kind: "third"; winnerSlot: ThirdPlaceSlot; eligible: GroupLetter[] }
  | { kind: "matchWinner"; matchNumber: number }
  | { kind: "matchLoser"; matchNumber: number };

export interface MatchSpec {
  /** Official FIFA match number. */
  matchNumber: number;
  round: BracketRound;
  home: SlotSpec;
  away: SlotSpec;
}

const w = (group: GroupLetter): SlotSpec => ({ kind: "winner", group });
const r = (group: GroupLetter): SlotSpec => ({ kind: "runnerUp", group });
const third = (winnerSlot: ThirdPlaceSlot, eligible: GroupLetter[]): SlotSpec => ({
  kind: "third",
  winnerSlot,
  eligible,
});
const mw = (matchNumber: number): SlotSpec => ({ kind: "matchWinner", matchNumber });
const ml = (matchNumber: number): SlotSpec => ({ kind: "matchLoser", matchNumber });

/**
 * Round of 32, in BRACKET (fold) order: consecutive pairs feed one Round-of-16
 * match, so a renderer can pair slot 2i / 2i+1 → R16[i] with no extra mapping.
 * (FIFA match numbers are preserved on each entry.)
 */
export const ROUND_OF_32: MatchSpec[] = [
  { matchNumber: 74, round: "R32", home: w("E"), away: third("E", ["A", "B", "C", "D", "F"]) },
  { matchNumber: 77, round: "R32", home: w("I"), away: third("I", ["C", "D", "F", "G", "H"]) },
  { matchNumber: 73, round: "R32", home: r("A"), away: r("B") },
  { matchNumber: 75, round: "R32", home: w("F"), away: r("C") },
  { matchNumber: 76, round: "R32", home: w("C"), away: r("F") },
  { matchNumber: 78, round: "R32", home: r("E"), away: r("I") },
  { matchNumber: 79, round: "R32", home: w("A"), away: third("A", ["C", "E", "F", "H", "I"]) },
  { matchNumber: 80, round: "R32", home: w("L"), away: third("L", ["E", "H", "I", "J", "K"]) },
  { matchNumber: 83, round: "R32", home: r("K"), away: r("L") },
  { matchNumber: 84, round: "R32", home: w("H"), away: r("J") },
  { matchNumber: 81, round: "R32", home: w("D"), away: third("D", ["B", "E", "F", "I", "J"]) },
  { matchNumber: 82, round: "R32", home: w("G"), away: third("G", ["A", "E", "H", "I", "J"]) },
  { matchNumber: 86, round: "R32", home: w("J"), away: r("H") },
  { matchNumber: 88, round: "R32", home: r("D"), away: r("G") },
  { matchNumber: 85, round: "R32", home: w("B"), away: third("B", ["E", "F", "G", "I", "J"]) },
  { matchNumber: 87, round: "R32", home: w("K"), away: third("K", ["D", "E", "I", "J", "L"]) },
];

/** Round of 16 (bracket order). Each pair feeds one quarterfinal. */
export const ROUND_OF_16: MatchSpec[] = [
  { matchNumber: 89, round: "R16", home: mw(74), away: mw(77) },
  { matchNumber: 90, round: "R16", home: mw(73), away: mw(75) },
  { matchNumber: 93, round: "R16", home: mw(76), away: mw(78) },
  { matchNumber: 94, round: "R16", home: mw(79), away: mw(80) },
  { matchNumber: 91, round: "R16", home: mw(83), away: mw(84) },
  { matchNumber: 92, round: "R16", home: mw(81), away: mw(82) },
  { matchNumber: 95, round: "R16", home: mw(86), away: mw(88) },
  { matchNumber: 96, round: "R16", home: mw(85), away: mw(87) },
];

/** Quarterfinals (bracket order). */
export const QUARTER_FINALS: MatchSpec[] = [
  { matchNumber: 97, round: "QF", home: mw(89), away: mw(90) },
  { matchNumber: 98, round: "QF", home: mw(93), away: mw(94) },
  { matchNumber: 99, round: "QF", home: mw(91), away: mw(92) },
  { matchNumber: 100, round: "QF", home: mw(95), away: mw(96) },
];

/** Semifinals (bracket order). */
export const SEMI_FINALS: MatchSpec[] = [
  { matchNumber: 101, round: "SF", home: mw(97), away: mw(98) },
  { matchNumber: 102, round: "SF", home: mw(99), away: mw(100) },
];

/** Match for third place (match 103). */
export const THIRD_PLACE_PLAYOFF: MatchSpec = {
  matchNumber: 103,
  round: "3P",
  home: ml(101),
  away: ml(102),
};

/** Final (match 104). */
export const FINAL: MatchSpec = {
  matchNumber: 104,
  round: "F",
  home: mw(101),
  away: mw(102),
};

/**
 * Official per-slot third-place eligibility (which group's third-placed team
 * can ever land in each winner slot). Derived from ROUND_OF_32 so it can never
 * drift from the match definitions. Used to validate the Annex C matrix.
 */
export const THIRD_PLACE_ELIGIBILITY: Record<ThirdPlaceSlot, GroupLetter[]> =
  ROUND_OF_32.reduce(
    (acc, m) => {
      if (m.away.kind === "third") acc[m.away.winnerSlot] = m.away.eligible;
      return acc;
    },
    {} as Record<ThirdPlaceSlot, GroupLetter[]>,
  );

/** Builds the canonical Annex C lookup key from qualifying third-place groups. */
export function buildThirdPlaceKey(qualifiedGroups: GroupLetter[]): string {
  return [...qualifiedGroups].sort().join("");
}

/**
 * Looks up the official Annex C assignment for a set of qualifying third-place
 * groups. Returns a map of winner-slot → assigned third-place group, or null if
 * the combination is not exactly 8 groups / not found in the matrix.
 */
export function lookupThirdPlaceAssignment(
  qualifiedGroups: GroupLetter[],
): Record<ThirdPlaceSlot, GroupLetter> | null {
  if (qualifiedGroups.length !== 8) return null;
  const key = buildThirdPlaceKey(qualifiedGroups);
  const packed = WC2026_THIRD_PLACE_MATRIX[key];
  if (!packed || packed.length !== THIRD_PLACE_SLOT_ORDER.length) return null;
  const out = {} as Record<ThirdPlaceSlot, GroupLetter>;
  THIRD_PLACE_SLOT_ORDER.forEach((slot, i) => {
    out[slot] = packed[i] as GroupLetter;
  });
  return out;
}
