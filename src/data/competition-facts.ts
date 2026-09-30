// Evergreen facts per competition that the data provider does not carry:
// how the format works (liguilla, play-in, descenso…) and the list of recent
// champions. Rendered on competition/season pages (plan A4 "formato
// explicado, campeones") and used as the answer block AI engines quote.
//
// Every entry cites its sources and the date it was checked. Formats change
// (Liga MX has changed its play-in rules more than once), so a stale entry is
// worse than none: update `checked` whenever it is re-verified.

export interface CompetitionFacts {
  leagueId: number;
  /** 40–60 word answer to "¿cómo funciona {liga}?" per locale. */
  formatSummary: { es: string; pt?: string; en?: string };
  /** Longer bullet points about the format, per locale. */
  formatPoints: { es: string[]; pt?: string[]; en?: string[] };
  /** Most recent first. `season` is the human label ("Clausura 2026"). */
  champions: { season: string; champion: string; runnerUp?: string }[];
  sources: { title: string; url: string }[];
  /** YYYY-MM-DD */
  checked: string;
}

/** Filled by the competition research. */
export const COMPETITION_FACTS: CompetitionFacts[] = [];

export function factsFor(leagueId: number): CompetitionFacts | null {
  return COMPETITION_FACTS.find((f) => f.leagueId === leagueId) ?? null;
}
