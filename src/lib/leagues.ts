// Tracked leagues — shown as chips on Home and used to scope the live-matches
// widget (so it never surfaces a random worldwide match nobody here follows).
// Same list, single source of truth for both surfaces.
export const TRACKED_LEAGUES = [
  { name: 'Liga MX', id: 262 },
  { name: 'UEFA Champions League', id: 2 },
  { name: 'Premier League', id: 39 },
  { name: 'La Liga', id: 140 },
  { name: 'Bundesliga', id: 78 },
  { name: 'Serie A', id: 135 },
  { name: 'Ligue 1', id: 61 },
  { name: 'MLS', id: 253 },
  { name: 'Saudi Pro League', id: 307 },
  { name: 'Liga Argentina', id: 128 },
  { name: 'Primeira Liga', id: 94 },
] as const;

export const TRACKED_LEAGUE_IDS = TRACKED_LEAGUES.map((l) => l.id);
