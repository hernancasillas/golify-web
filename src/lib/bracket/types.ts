import type { APIFootballFixture, APIFootballStanding } from "@/lib/api-football.types";

/** Group letters A–L (12 groups in the 2026 World Cup). */
export type GroupLetter =
  | "A" | "B" | "C" | "D" | "E" | "F"
  | "G" | "H" | "I" | "J" | "K" | "L";

/** Knockout round identifiers. */
export type BracketRound = "R32" | "R16" | "QF" | "SF" | "F" | "3P";

/** Finishing position within a group used to source a bracket slot. */
export type GroupPosition = 1 | 2 | 3;

/**
 * A team as resolved by the engine. Mirrors the minimal shape we need from
 * `APIFootballStanding["team"]` so the engine stays decoupled from the API.
 */
export interface BracketTeam {
  id: number;
  name: string;
  logo: string;
}

/**
 * Describes where a bracket slot draws its participant from. The engine always
 * fills this in, even before the team is known, so the UI can render a
 * meaningful placeholder ("1A", "2C", "3rd A/B/C/D/F", "Winner M74").
 */
export type BracketSource =
  | {
      /** Sourced from a group standing position (winner / runner-up / third). */
      type: "group";
      group: GroupLetter;
      position: GroupPosition;
    }
  | {
      /**
       * A third-place slot whose group is not yet decided. `eligibleGroups`
       * is the official set of groups whose third-placed team could land here.
       */
      type: "thirdPlacePending";
      eligibleGroups: GroupLetter[];
    }
  | {
      /** Winner of an earlier knockout match (downstream placeholder path). */
      type: "matchWinner";
      matchNumber: number;
    }
  | {
      /** Loser of an earlier match (used only by the third-place playoff). */
      type: "matchLoser";
      matchNumber: number;
    };

/** One side (home or away) of a bracket match. */
export interface BracketSlot {
  source: BracketSource;
  /** Resolved team, or null when still undetermined. */
  team: BracketTeam | null;
  /** Short placeholder shown when `team` is null, e.g. "1A", "2C", "3º A/B/C". */
  placeholder: string;
}

/** A single bracket match (projected — not necessarily played yet). */
export interface BracketMatch {
  /** Official FIFA match number (73–104). */
  matchNumber: number;
  round: BracketRound;
  home: BracketSlot;
  away: BracketSlot;
}

/** A group ranked top-to-bottom by the engine. */
export interface RankedGroup {
  group: GroupLetter;
  /** Standings rows sorted 1st → last. Length is whatever the data provides. */
  rows: APIFootballStanding[];
}

/** A third-placed team within the cross-group ranking. */
export interface ThirdPlaceEntry {
  group: GroupLetter;
  row: APIFootballStanding;
  /** 1-based rank among all third-placed teams (1 = best). */
  rank: number;
  /** True when this team is among the best 8 and qualifies. */
  qualified: boolean;
}

/** Diagnostic / status metadata about the projection. */
export interface BracketMeta {
  /** Group letters present in the input (sorted). */
  groupsPresent: GroupLetter[];
  /** True when all 12 groups are present with a determinable top 3. */
  canProjectThirdPlace: boolean;
  /** The sorted 8-group key used for the Annex C lookup, or null. */
  thirdPlaceKey: string | null;
  /** True when every group has played all its matches. */
  groupStageComplete: boolean;
  /** Full third-place ranking (all groups), best → worst. */
  thirdPlaceRanking: ThirdPlaceEntry[];
}

/** Output of `generateWorldCupBracket`. Rounds are in bracket (fold) order. */
export interface WorldCupBracket {
  roundOf32: BracketMatch[]; // 16
  roundOf16: BracketMatch[]; // 8
  quarterFinals: BracketMatch[]; // 4
  semiFinals: BracketMatch[]; // 2
  thirdPlace: BracketMatch; // 1 (match 103)
  final: BracketMatch; // 1 (match 104)
  meta: BracketMeta;
}

/** Input to `generateWorldCupBracket`. */
export interface GenerateBracketInput {
  /** Flat standings for all groups (as returned by `getWorldCupStandings`). */
  standings: APIFootballStanding[];
  /**
   * Optional live fixtures. When provided, their scores are projected onto the
   * standings before ranking, so the bracket reflects in-progress matches.
   */
  liveFixtures?: APIFootballFixture[];
}
