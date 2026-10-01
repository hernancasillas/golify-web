// EA FC card for a real player, looked up in the app's FC catalogue
// (Supabase `fc_players`, anon-readable). The catalogue has its own ids, so
// the only way to join is by who the player is: name, nationality and age.
//
// A wrong card on a player page is worse than no card ("Markus Haaland, 60"
// on Erling's page), so this only answers when exactly ONE row survives every
// check. Anything ambiguous returns null and the block does not render.
//
// Read through PostgREST with a plain cached fetch (not supabase-js): the page
// is ISR, and a fetch carrying `next.revalidate` keeps it cacheable.

import type { PlayerBio } from '@/lib/api-football';
import { TTL } from '@/lib/api-football';
import { slugify } from '@/lib/slug';
import { sameCountry } from './countries';

export interface FcCard {
  player_id: number;
  slug: string;
  known_as: string;
  overall_rating: number;
  primary_position: number | null;
  /** "EA Sports FC 26" */
  game: string;
}

interface FcRow {
  player_id: number;
  slug: string;
  known_as: string | null;
  firstname: string | null;
  lastname: string | null;
  overall_rating: number | null;
  primary_position: number | null;
  nationality_name: string | null;
  age: number | null;
}

const GAME_CODE = 'fc26';

// EA position ids → the abbreviations the game itself prints.
const POSITIONS: Record<number, string> = {
  0: 'GK', 1: 'SW', 2: 'RWB', 3: 'RB', 4: 'CB', 5: 'CB', 6: 'CB', 7: 'LB', 8: 'LWB', 9: 'CDM', 10: 'CDM',
  11: 'CDM', 12: 'RM', 13: 'CM', 14: 'CM', 15: 'CM', 16: 'LM', 17: 'CAM', 18: 'CAM', 19: 'CAM', 20: 'CF',
  21: 'CF', 22: 'CF', 23: 'RW', 24: 'ST', 25: 'ST', 26: 'ST', 27: 'LW',
};

export function fcPositionLabel(id: number | null): string | null {
  return id == null ? null : (POSITIONS[id] ?? null);
}

async function rest<T>(table: string, params: Record<string, string>): Promise<T[] | null> {
  const base = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!base || !key) return null;
  const url = new URL(`${base}/rest/v1/${table}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  try {
    const res = await fetch(url.toString(), {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      next: { revalidate: TTL.weekly },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) ? (data as T[]) : null;
  } catch {
    return null;
  }
}

function tokens(s: string | null | undefined): string[] {
  if (!s) return [];
  return slugify(s).split('-').filter(Boolean);
}

/** Age on a given day, from an ISO birth date. */
function ageOn(birth: string, day: Date): number | null {
  const b = new Date(`${birth}T00:00:00Z`);
  if (Number.isNaN(+b)) return null;
  let age = day.getUTCFullYear() - b.getUTCFullYear();
  const m = day.getUTCMonth() - b.getUTCMonth();
  if (m < 0 || (m === 0 && day.getUTCDate() < b.getUTCDate())) age--;
  return age;
}

export async function findFcCard(p: PlayerBio): Promise<FcCard | null> {
  const lastTokens = tokens(p.lastname).filter((t) => t.length >= 3).slice(0, 4);
  const firstTokens = tokens(p.firstname);
  if (!lastTokens.length || !firstTokens.length || !p.birth?.date || !p.nationality) return null;

  const versions = await rest<{ id: string; name: string; release_year: number | null }>('fc_game_versions', {
    select: 'id,name,release_year',
    code: `eq.${GAME_CODE}`,
  });
  const version = versions?.[0];
  if (!version) return null;

  // The slug column is already accent-free, so it can be matched with ilike
  // against our own slugified surname tokens.
  const rows = await rest<FcRow>('fc_players', {
    select: 'player_id,slug,known_as,firstname,lastname,overall_rating,primary_position,nationality_name,age',
    game_version_id: `eq.${version.id}`,
    or: `(${lastTokens.map((t) => `slug.ilike.*${t}*`).join(',')})`,
    limit: '60',
  });
  if (!rows?.length) return null;

  // EA freezes ages when the game's database is cut (mid release year), so
  // compare against the player's age on that date, with a year of slack.
  const refDay = new Date(Date.UTC(version.release_year ?? new Date().getUTCFullYear() - 1, 6, 1));
  const refAge = ageOn(p.birth.date, refDay);
  if (refAge == null) return null;

  const apiLast = new Set(tokens(p.lastname));
  const apiFirst = new Set(firstTokens);

  const matches = rows.filter((r) => {
    if (!sameCountry(r.nationality_name, p.nationality)) return false;
    if (r.age == null || Math.abs(r.age - refAge) > 1) return false;
    const eaLast = tokens(r.lastname);
    if (!eaLast.length || !eaLast.every((t) => apiLast.has(t))) return false;
    const eaFirst = tokens(r.firstname);
    if (!eaFirst.length || !apiFirst.has(eaFirst[0])) return false;
    return r.overall_rating != null;
  });
  if (matches.length !== 1) return null;

  const m = matches[0];
  return {
    player_id: m.player_id,
    slug: m.slug,
    known_as: m.known_as ?? `${m.firstname ?? ''} ${m.lastname ?? ''}`.trim(),
    overall_rating: m.overall_rating as number,
    primary_position: m.primary_position,
    game: version.name,
  };
}
