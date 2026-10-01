// Transfer window of a league, built from API-Football `/transfers?team=`.
//
// Shared by the /fichajes/{liga} page and its sitemap source, so both apply
// the same indexing threshold to the same rows.
//
// Cost: one cached call per league team (18–30), TTL daily. That is the whole
// budget of the page — there is no per-player fan-out. Every call is `strict`:
// if one team's list fails, the render throws and Next keeps the last good
// copy, instead of publishing a window with that club's moves silently missing.
//
// The provider's data is noisy, so rows are cleaned before they are shown:
//   - `/transfers?team=X` returns the whole career of every player who ever
//     passed through X, so moves between two other clubs are dropped;
//   - the same move is often listed twice a day apart, or once per spelling
//     of a club ("Leon" / "Club Leon"), so near-duplicates collapse to one;
//   - a "move" from a club to itself is dropped.

import {
  apiFootballGet,
  currentSeason,
  getLeagueInfoCached,
  getLeagueTeams,
  TTL,
  type PlayerTransfers,
  type TeamInfo,
} from '@/lib/api-football';
import type { Competition } from '@/lib/competitions';
import type { RouteLocale } from '@/lib/routes';

/** Months of history the window covers (plan: "últimos 6 meses"). */
export const WINDOW_MONTHS = 6;
/** Plan A4/§5: a transfers hub is indexable with at least this many moves. */
export const INDEX_THRESHOLD = 5;
/** Bound on teams per league, so a 30-club league stays inside the budget. */
const MAX_TEAMS = 30;
/** Two listings of the same player move this close together are one move. */
const DUPLICATE_DAYS = 10;

export interface ClubRef {
  id: number;
  name: string;
  logo: string;
  /** True when the club plays in this league this season. */
  inLeague: boolean;
}

export interface TransferRow {
  key: string;
  /** YYYY-MM-DD */
  date: string;
  player: { id: number; name: string };
  from: ClubRef;
  to: ClubRef;
  /** Raw provider type ("Loan", "Free", "€ 3M", "N/A"…). */
  type: string | null;
  /** Fee in euros when the provider gives one ("€ 3.8M"). */
  feeEur: number | null;
}

export interface LeagueWindow {
  season: number;
  /** ISO date the window starts at. */
  since: string;
  teams: TeamInfo[];
  rows: TransferRow[];
  /** Moves between two clubs of this league (counted as an arrival AND a
   *  departure in the totals). */
  internal: number;
  /** Arrivals / departures per league club. */
  balance: { team: ClubRef; in: number; out: number }[];
}

/** Only leagues: a cup's 32–47 clubs would blow the per-page budget, and a
 *  cup has no transfer window of its own. */
export function hasTransfersPage(c: Competition): boolean {
  return c.kind === 'league';
}

function parseFee(type: string | null): number | null {
  if (!type) return null;
  const m = /^€\s*([\d.]+)\s*([MK])?$/i.exec(type.trim());
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n) || n <= 0) return null;
  const mult = m[2]?.toUpperCase() === 'M' ? 1_000_000 : m[2]?.toUpperCase() === 'K' ? 1_000 : 1;
  return Math.round(n * mult);
}

/** A type that says nothing ("N/A", "-", null) loses to one that does. */
function informative(type: string | null): boolean {
  return !!type && !['n/a', '-', '€ n/a', ''].includes(type.trim().toLowerCase());
}

// "Club America" ↔ "Club America U21": a player moving between a club and
// its own reserve or youth side is squad admin, not a transfer.
const YOUTH_SUFFIX = /^(u-?\d{2}|sub-?\d{2}|ii|iii|b|c|reserves?|res\.?|youth|academy|juvenil|w|women|femenil)$/i;

function isOwnYouthMove(a: string, b: string): boolean {
  const x = a.trim().toLowerCase();
  const y = b.trim().toLowerCase();
  const [short, long] = x.length <= y.length ? [x, y] : [y, x];
  if (!long.startsWith(`${short} `)) return false;
  return YOUTH_SUFFIX.test(long.slice(short.length + 1).trim());
}

function daysBetween(a: string, b: string): number {
  return Math.abs(Date.parse(a) - Date.parse(b)) / 86_400_000;
}

function monthsAgo(now: Date, months: number): string {
  const d = new Date(now);
  d.setUTCMonth(d.getUTCMonth() - months);
  return d.toISOString().slice(0, 10);
}

async function seasonTeams(leagueId: number, season: number): Promise<{ season: number; teams: TeamInfo[] }> {
  const teams = await getLeagueTeams(leagueId, season, { strict: true });
  if (teams.length > 0) return { season, teams };
  // A season the provider already flags as current can still be unpopulated
  // for a few days; the previous one is the window people are talking about.
  const prev = await getLeagueTeams(leagueId, season - 1, { strict: true });
  if (prev.length > 0) return { season: season - 1, teams: prev };
  throw new Error(`transfers: league ${leagueId} has no teams for ${season} or ${season - 1}`);
}

export async function getLeagueWindow(c: Competition, now: Date = new Date()): Promise<LeagueWindow> {
  const info = await getLeagueInfoCached(c.id, { strict: true });
  // A covered league must exist upstream: null is an API anomaly, not a 404.
  if (!info) throw new Error(`transfers: league ${c.id} lookup returned nothing`);
  const current = currentSeason(info);
  if (!current) throw new Error(`transfers: league ${c.id} has no season`);

  const { season, teams: allTeams } = await seasonTeams(c.id, current);
  const teams = allTeams.slice(0, MAX_TEAMS);
  const leagueClubs = new Map(teams.map((t) => [t.team.id, t.team]));

  const lists = await Promise.all(
    teams.map((t) =>
      apiFootballGet<PlayerTransfers>('/transfers', { team: t.team.id }, { revalidate: TTL.daily, strict: true }),
    ),
  );

  const since = monthsAgo(now, WINDOW_MONTHS);
  // A move announced for the coming weeks is news; one dated years ahead is
  // a data-entry error.
  const until = new Date(now.getTime() + 90 * 86_400_000).toISOString().slice(0, 10);

  const club = (ref: { id: number; name: string; logo: string }): ClubRef => {
    const own = leagueClubs.get(ref.id);
    // League clubs take the name /teams gives them, which is the name their
    // team page builds its canonical slug from: no redirect hop on the link.
    return own
      ? { id: own.id, name: own.name, logo: own.logo, inLeague: true }
      : { id: ref.id, name: ref.name, logo: ref.logo, inLeague: false };
  };

  const candidates: TransferRow[] = [];
  for (const list of lists) {
    for (const p of list) {
      for (const t of p.transfers ?? []) {
        const date = (t.date ?? '').slice(0, 10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < since || date > until) continue;
        const out = t.teams?.out;
        const inn = t.teams?.in;
        if (!out?.id || !inn?.id || out.id === inn.id) continue;
        if (!leagueClubs.has(out.id) && !leagueClubs.has(inn.id)) continue;
        if (isOwnYouthMove(out.name, inn.name)) continue;
        candidates.push({
          key: `${p.player.id}-${out.id}-${inn.id}-${date}`,
          date,
          player: { id: p.player.id, name: p.player.name },
          from: club(out),
          to: club(inn),
          type: t.type ?? null,
          feeEur: parseFee(t.type ?? null),
        });
      }
    }
  }

  candidates.sort((a, b) => a.date.localeCompare(b.date) || a.key.localeCompare(b.key));
  const rows: TransferRow[] = [];
  for (const row of candidates) {
    const dup = rows.find(
      (r) =>
        r.player.id === row.player.id &&
        (r.from.id === row.from.id || r.to.id === row.to.id) &&
        daysBetween(r.date, row.date) <= DUPLICATE_DAYS,
    );
    if (!dup) {
      rows.push(row);
      continue;
    }
    if (!informative(dup.type) && informative(row.type)) {
      dup.type = row.type;
      dup.feeEur = row.feeEur;
    }
  }
  rows.sort((a, b) => b.date.localeCompare(a.date) || a.player.name.localeCompare(b.player.name));

  const balance = teams
    .map((t) => {
      const ref: ClubRef = { id: t.team.id, name: t.team.name, logo: t.team.logo, inLeague: true };
      return {
        team: ref,
        in: rows.filter((r) => r.to.id === ref.id).length,
        out: rows.filter((r) => r.from.id === ref.id).length,
      };
    })
    .filter((b) => b.in + b.out > 0)
    .sort((a, b) => b.in + b.out - (a.in + a.out) || b.in - a.in || a.team.name.localeCompare(b.team.name));

  const internal = rows.filter((r) => r.from.inLeague && r.to.inLeague).length;
  return { season, since, teams, rows, balance, internal };
}

// ---- Labels -------------------------------------------------------------

const TYPE_LABEL: Record<string, Record<RouteLocale, string>> = {
  loan: { es: 'Préstamo', pt: 'Empréstimo', en: 'Loan' },
  free: { es: 'Libre', pt: 'Livre', en: 'Free' },
  transfer: { es: 'Traspaso', pt: 'Transferência', en: 'Transfer' },
  'return from loan': { es: 'Fin de préstamo', pt: 'Fim de empréstimo', en: 'Loan return' },
};

const TYPE_ALIAS: Record<string, string> = {
  loan: 'loan',
  free: 'free',
  'free agent': 'free',
  'free transfer': 'free',
  '€ free': 'free',
  transfer: 'transfer',
  'return from loan': 'return from loan',
  'back from loan': 'return from loan',
};

const NO_DATA: Record<RouteLocale, string> = { es: 'Sin dato', pt: 'Sem dado', en: 'Not given' };

/** Kind of move, for the filter chips and the type column. */
export function transferKind(type: string | null): 'loan' | 'free' | 'transfer' | 'return from loan' | 'fee' | 'unknown' {
  if (parseFee(type) != null) return 'fee';
  const alias = TYPE_ALIAS[(type ?? '').trim().toLowerCase()];
  return (alias as 'loan' | 'free' | 'transfer' | 'return from loan' | undefined) ?? 'unknown';
}

/** Translated type; a fee is shown exactly as the provider gives it. */
export function transferTypeLabel(type: string | null, locale: RouteLocale): string {
  const kind = transferKind(type);
  if (kind === 'fee') return type!.trim();
  if (kind === 'unknown') return informative(type) ? type!.trim() : NO_DATA[locale];
  return TYPE_LABEL[kind][locale];
}
