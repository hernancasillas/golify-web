// EA Sports FC catalog (Supabase, anon-readable fc_* tables) for the
// /fc/{jugador} pages, their index and their sitemap.
//
// Explicit column lists everywhere: fc_players and fc_teams carry a large
// `raw` jsonb we never render. Errors throw (an ISR regeneration that throws
// keeps the last good copy); a missing row returns null (→ notFound()).
//
// Wrapped in React `cache` so generateMetadata and the page share one query
// per render.

import { cache } from 'react';
import { supabase } from '@/lib/supabase-server';
import { apiFootballGet, TTL, type PlayerBio } from '@/lib/api-football';
import { slugify } from '@/lib/slug';

export const FC_GAME_CODE = 'fc26';
/** Plan: the FC sitemap lists players at or above this overall. */
export const FC_SITEMAP_MIN_OVERALL = 75;
export const FC_SITEMAP_MAX = 5000;

export interface FcGame {
  id: string;
  code: string;
  name: string;
  /** "EA FC 26" — the form people search. */
  short: string;
}

export interface FcPlayerRow {
  player_id: number;
  slug: string;
  firstname: string | null;
  lastname: string | null;
  known_as: string | null;
  overall_rating: number | null;
  potential: number | null;
  age: number | null;
  nationality_name: string | null;
  positions: number[] | null;
  primary_position: number | null;
  headshot_url: string | null;
  value_eur: number | null;
  wage_eur: number | null;
  updated_at: string | null;
}

const PLAYER_COLUMNS =
  'player_id, slug, firstname, lastname, known_as, overall_rating, potential, age, nationality_name, positions, primary_position, headshot_url, value_eur, wage_eur, updated_at';

export interface FcTeamRow {
  team_id: number;
  slug: string;
  name: string;
  overall_rating: number | null;
  league_id: number | null;
  league_name: string | null;
}

export interface FcMembership {
  team: FcTeamRow;
  jersey_number: number | null;
  is_captain: boolean;
  is_loaned: boolean;
  contract_end: string | null;
  /** club | national | custom (EA's "Rest of World Custom" historic XIs). */
  kind: 'club' | 'national' | 'custom';
}

/** EA's bucket for its own all-time / historic custom teams. */
const CUSTOM_LEAGUE_ID = 2255;

function ensureConfigured() {
  if (!process.env.SUPABASE_URL) throw new Error('fc: SUPABASE_URL missing');
}

export const getFcGame = cache(async (): Promise<FcGame> => {
  ensureConfigured();
  const { data, error } = await supabase
    .from('fc_game_versions')
    .select('id, code, name')
    .eq('code', FC_GAME_CODE)
    .maybeSingle();
  if (error) throw new Error(`fc: game version lookup failed: ${error.message}`);
  if (!data) throw new Error(`fc: game version ${FC_GAME_CODE} missing`);
  const d = data as { id: string; code: string; name: string };
  return { ...d, short: `EA FC ${d.code.replace(/^fc/i, '')}` };
});

export const getFcPlayer = cache(async (playerId: number): Promise<FcPlayerRow | null> => {
  const game = await getFcGame();
  const { data, error } = await supabase
    .from('fc_players')
    .select(PLAYER_COLUMNS)
    .eq('game_version_id', game.id)
    .eq('player_id', playerId)
    .maybeSingle();
  if (error) throw new Error(`fc: player ${playerId} lookup failed: ${error.message}`);
  return (data as FcPlayerRow | null) ?? null;
});

/** Every player sharing a slug (EA ships icon/hero variants of one person
 *  under separate ids). The best-rated one is the canonical page for the
 *  name; the variants stay reachable but noindex, so Google sees one page
 *  per footballer instead of fourteen near-identical ones. */
export const getSlugSiblings = cache(async (slug: string): Promise<{ player_id: number; overall_rating: number | null }[]> => {
  const game = await getFcGame();
  const { data, error } = await supabase
    .from('fc_players')
    .select('player_id, overall_rating')
    .eq('game_version_id', game.id)
    .eq('slug', slug)
    .order('overall_rating', { ascending: false, nullsFirst: false })
    .order('player_id', { ascending: true })
    .limit(50);
  if (error) throw new Error(`fc: slug siblings lookup failed: ${error.message}`);
  return (data as { player_id: number; overall_rating: number | null }[]) ?? [];
});

export const getMemberships = cache(async (playerId: number): Promise<FcMembership[]> => {
  const game = await getFcGame();
  const { data: links, error } = await supabase
    .from('fc_team_players')
    .select('team_id, jersey_number, is_captain, is_loaned, contract_end')
    .eq('game_version_id', game.id)
    .eq('player_id', playerId)
    .limit(20);
  if (error) throw new Error(`fc: memberships lookup failed: ${error.message}`);
  const rows = (links ?? []) as {
    team_id: number;
    jersey_number: number | null;
    is_captain: boolean;
    is_loaned: boolean;
    contract_end: string | null;
  }[];
  if (rows.length === 0) return [];

  const { data: teams, error: tErr } = await supabase
    .from('fc_teams')
    .select('team_id, slug, name, overall_rating, league_id, league_name')
    .eq('game_version_id', game.id)
    .in(
      'team_id',
      rows.map((r) => r.team_id),
    );
  if (tErr) throw new Error(`fc: teams lookup failed: ${tErr.message}`);
  const byId = new Map(((teams ?? []) as FcTeamRow[]).map((t) => [t.team_id, t]));

  const out: FcMembership[] = [];
  for (const r of rows) {
    const team = byId.get(r.team_id);
    if (!team) continue;
    const kind: FcMembership['kind'] =
      team.league_name === 'International' ? 'national' : team.league_id === CUSTOM_LEAGUE_ID ? 'custom' : 'club';
    out.push({ team, jersey_number: r.jersey_number, is_captain: r.is_captain, is_loaned: r.is_loaned, contract_end: r.contract_end, kind });
  }
  const order = { club: 0, national: 1, custom: 2 };
  return out.sort((a, b) => order[a.kind] - order[b.kind] || (b.team.overall_rating ?? 0) - (a.team.overall_rating ?? 0));
});

/** Best-rated teammates in one team (internal links to sibling pages). */
export const getTeammates = cache(async (teamId: number, excludePlayerId: number, limit = 6): Promise<FcPlayerRow[]> => {
  const game = await getFcGame();
  const { data: links, error } = await supabase
    .from('fc_team_players')
    .select('player_id')
    .eq('game_version_id', game.id)
    .eq('team_id', teamId)
    .limit(80);
  if (error) throw new Error(`fc: roster lookup failed: ${error.message}`);
  const ids = ((links ?? []) as { player_id: number }[]).map((l) => l.player_id).filter((id) => id !== excludePlayerId);
  if (ids.length === 0) return [];
  const { data, error: pErr } = await supabase
    .from('fc_players')
    .select(PLAYER_COLUMNS)
    .eq('game_version_id', game.id)
    .in('player_id', ids)
    .order('overall_rating', { ascending: false, nullsFirst: false })
    .limit(limit);
  if (pErr) throw new Error(`fc: teammates lookup failed: ${pErr.message}`);
  return (data as FcPlayerRow[]) ?? [];
});

export const getTopPlayers = cache(async (limit = 100): Promise<FcPlayerRow[]> => {
  const game = await getFcGame();
  const { data, error } = await supabase
    .from('fc_players')
    .select(PLAYER_COLUMNS)
    .eq('game_version_id', game.id)
    .order('overall_rating', { ascending: false, nullsFirst: false })
    .order('player_id', { ascending: true })
    // Over-fetch: variants of one footballer collapse to one row below.
    .limit(limit * 3);
  if (error) throw new Error(`fc: top players lookup failed: ${error.message}`);
  const seen = new Set<string>();
  const out: FcPlayerRow[] = [];
  for (const p of (data as FcPlayerRow[]) ?? []) {
    if (seen.has(p.slug)) continue;
    seen.add(p.slug);
    out.push(p);
    if (out.length >= limit) break;
  }
  return out;
});

/** Sitemap rows: overall ≥ 75, one per slug (the canonical variant), bounded. */
export async function getSitemapPlayers(): Promise<{ player_id: number; slug: string; updated_at: string | null }[]> {
  const game = await getFcGame();
  const pageSize = 1000;
  const rows: { player_id: number; slug: string; updated_at: string | null }[] = [];
  const seen = new Set<string>();
  // Ordered exactly like getSlugSiblings (overall desc, id asc), so the first
  // row of a slug is the variant its page treats as canonical.
  for (let from = 0; from < FC_SITEMAP_MAX * 2; from += pageSize) {
    const { data, error } = await supabase
      .from('fc_players')
      .select('player_id, slug, updated_at')
      .eq('game_version_id', game.id)
      .gte('overall_rating', FC_SITEMAP_MIN_OVERALL)
      .order('overall_rating', { ascending: false, nullsFirst: false })
      .order('player_id', { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`fc: sitemap lookup failed: ${error.message}`);
    const page = (data as { player_id: number; slug: string; updated_at: string | null }[]) ?? [];
    for (const p of page) {
      if (seen.has(p.slug)) continue;
      seen.add(p.slug);
      rows.push(p);
      if (rows.length >= FC_SITEMAP_MAX) return rows;
    }
    if (page.length < pageSize) break;
  }
  return rows;
}

// ---- Display helpers ------------------------------------------------------

export function fcDisplayName(p: Pick<FcPlayerRow, 'known_as' | 'firstname' | 'lastname' | 'slug'>): string {
  const known = p.known_as?.trim();
  if (known) return known;
  const full = [p.firstname, p.lastname].filter(Boolean).join(' ').trim();
  return full || p.slug;
}

// ---- Link to the real player page -----------------------------------------
//
// Only with a confident match: API-Football profile search by last name, then
// same nationality, age within one year (the game's snapshot is a season
// old), last name contained in the provider's full name, and exactly one
// candidate left. Anything less and the page simply shows no link: a wrong
// link would tie the rating to the wrong footballer.

function norm(s: string | null | undefined): string {
  return slugify(s ?? '').replace(/-/g, ' ').trim();
}

export async function findRealPlayer(p: FcPlayerRow): Promise<{ id: number; name: string } | null> {
  if (!p.lastname || !p.nationality_name || p.age == null) return null;
  const q = norm(p.lastname);
  if (q.length < 3 || q === 'x') return null;
  let rows: { player: PlayerBio }[];
  try {
    // Search only accepts letters, digits and spaces: the slugified form.
    rows = await apiFootballGet<{ player: PlayerBio }>('/players/profiles', { search: q }, { revalidate: TTL.weekly, strict: true });
  } catch {
    // Enrichment only: no match is the honest outcome of a failed lookup.
    return null;
  }
  // 250 is a full page: there may be more candidates we did not see, so a
  // "unique" match on this page is not proven unique.
  if (rows.length >= 250) return null;

  const nat = norm(p.nationality_name);
  const lastTokens = q.split(' ').filter(Boolean);
  const first = norm(p.firstname).split(' ')[0] ?? '';
  const hits = rows.filter(({ player: r }) => {
    if (!r?.id || r.age == null || !r.nationality) return false;
    if (norm(r.nationality) !== nat) return false;
    if (Math.abs(r.age - p.age!) > 1) return false;
    const full = ` ${norm([r.firstname, r.lastname, r.name].filter(Boolean).join(' '))} `;
    if (!lastTokens.every((t) => full.includes(` ${t} `))) return false;
    // When EA gives a first name, the provider's must agree on it too.
    return !first || full.includes(` ${first} `);
  });
  if (hits.length !== 1) return null;
  return { id: hits[0].player.id, name: hits[0].player.name };
}
