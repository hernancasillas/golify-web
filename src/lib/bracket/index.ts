export * from "./types";
export {
  buildThirdPlaceKey,
  FINAL,
  lookupThirdPlaceAssignment,
  QUARTER_FINALS,
  ROUND_OF_16,
  ROUND_OF_32,
  SEMI_FINALS,
  type SlotSpec,
  THIRD_PLACE_ELIGIBILITY,
  THIRD_PLACE_PLAYOFF,
  type ThirdPlaceSlot,
} from "./worldCup2026BracketAssignments";
export {
  THIRD_PLACE_SLOT_ORDER,
  WC2026_THIRD_PLACE_MATRIX,
} from "./worldCup2026Matrix";
export {
  compareStandingRows,
  generateWorldCupBracket,
  parseGroupLetter,
  rankGroups,
  rankThirdPlace,
} from "./bracketEngine";
export {
  buildGroupClinch,
  computeGroupClinch,
  type GroupClinch,
} from "./clinch";
export {
  buildBracketOverlay,
  type MatchOverlay,
  type OverlayTeam,
} from "./overlay";
