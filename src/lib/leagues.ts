// Tracked leagues — the league chips on Home, the scope of the live-matches
// widget, the /today and /live boards, and the league pages we put in the
// sitemap. One source of truth for all of them.
//
// Order is deliberate: the markets we are pushing into come first (Mexico,
// Brazil, Argentina, the rest of South America, the US), then Europe. The
// order drives the chip order on Home and the section order on the results
// boards, so a visitor from São Paulo sees the Brasileirão before the
// Bundesliga.
//
// `name` is our own label, not the API's: API-Football calls both the Italian
// and the Brazilian top flight "Serie A", which would be unreadable side by
// side.

export type Market = 'mx' | 'br' | 'ar' | 'co' | 'ec' | 'cl' | 'us' | 'sudamerica' | 'europa' | 'mundo';

export const TRACKED_LEAGUES = [
  { name: 'Liga MX', id: 262, market: 'mx' },
  { name: 'Brasileirão', id: 71, market: 'br' },
  { name: 'Liga Argentina', id: 128, market: 'ar' },
  { name: 'Copa Libertadores', id: 13, market: 'sudamerica' },
  { name: 'Copa Sudamericana', id: 11, market: 'sudamerica' },
  { name: 'MLS', id: 253, market: 'us' },
  { name: 'Copa do Brasil', id: 73, market: 'br' },
  { name: 'Copa Argentina', id: 130, market: 'ar' },
  { name: 'Concacaf Champions Cup', id: 16, market: 'mundo' },
  { name: 'Leagues Cup', id: 772, market: 'mundo' },
  { name: 'Primera A Colombia', id: 239, market: 'co' },
  { name: 'Liga Pro Ecuador', id: 242, market: 'ec' },
  { name: 'Primera División de Chile', id: 265, market: 'cl' },
  { name: 'UEFA Champions League', id: 2, market: 'europa' },
  { name: 'Premier League', id: 39, market: 'europa' },
  { name: 'La Liga', id: 140, market: 'europa' },
  { name: 'Serie A', id: 135, market: 'europa' },
  { name: 'Bundesliga', id: 78, market: 'europa' },
  { name: 'Ligue 1', id: 61, market: 'europa' },
  { name: 'Primeira Liga', id: 94, market: 'europa' },
  { name: 'Saudi Pro League', id: 307, market: 'mundo' },
] as const;

// Typed as number[] rather than the literal tuple `as const` would infer, so
// callers can test membership with a plain league id.
export const TRACKED_LEAGUE_IDS: readonly number[] = TRACKED_LEAGUES.map(
  (l) => l.id,
);

export function leagueLabel(id: number): string | null {
  return TRACKED_LEAGUES.find((l) => l.id === id)?.name ?? null;
}
