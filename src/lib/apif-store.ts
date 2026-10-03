// Shared API-Football cache + quota guard, stored in Supabase.
//
// Why: the web and the mobile app share ONE API-Football key (75k/day). On
// 2026-10-02 crawler traffic on the web spent the whole daily quota and the
// app was left without data. Two rules now hold:
//
//   1. Every Vercel instance and every deploy reads the same cached copy of a
//      URL (table api_football_cache), so the web fetches a URL once per TTL,
//      not once per instance or per deploy.
//   2. The web stops calling the provider when the daily requests left fall
//      under WEB_RESERVE (default 30,000) or the day's total usage passes WEB_SHARE (30%) of the
//      limit. From then on it serves the cached
//      copy, even if stale, so the app always keeps that headroom.
//
// Server-only. Uses the service role key (never NEXT_PUBLIC_). Without it the
// module degrades to "no shared cache" and only the in-memory guard applies.
// Tables: fuchibol/supabase/migrations/20261002120000_api_football_shared_cache.sql

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const URL_ = process.env.SUPABASE_URL ?? '';
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

/** Daily requests the web must leave for the app (absolute floor). */
export const WEB_RESERVE = Number(process.env.API_FOOTBALL_WEB_RESERVE ?? 30000);
/** The web only calls while the day's TOTAL usage (app + web) is under this
 *  share of the daily limit. 0.3 of 150k = the web stops at 45k used, so the
 *  app always keeps at least 70% of the day. */
export const WEB_SHARE = Number(process.env.API_FOOTBALL_WEB_SHARE ?? 0.3);

let client: SupabaseClient | null = null;
// Kill switch, off by default: on 2026-10-02 crawler traffic writing large
// JSON bodies here saturated the Supabase project the app also uses. Turn it
// on (APIF_SHARED_CACHE=1) only with a write budget in place.
const ENABLED = process.env.APIF_SHARED_CACHE === '1';

function db(): SupabaseClient | null {
  if (!ENABLED || !URL_ || !SERVICE) return null;
  client ??= createClient(URL_, SERVICE, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    // The cache must never be slower than the provider: give up after 3 s.
    global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(3000) }) },
  });
  return client;
}

export interface StoredPage {
  body: unknown;
  fresh: boolean;
}

export async function readCache(key: string): Promise<StoredPage | null> {
  const c = db();
  if (!c) return null;
  try {
    const { data, error } = await c
      .from('api_football_cache')
      .select('body, expires_at')
      .eq('cache_key', key)
      .maybeSingle();
    if (error || !data) return null;
    return { body: data.body, fresh: new Date(data.expires_at).getTime() > Date.now() };
  } catch {
    return null;
  }
}

export async function writeCache(key: string, body: unknown, ttlSeconds: number): Promise<void> {
  const c = db();
  if (!c) return;
  try {
    const now = Date.now();
    await c.from('api_football_cache').upsert({
      cache_key: key,
      body,
      fetched_at: new Date(now).toISOString(),
      expires_at: new Date(now + ttlSeconds * 1000).toISOString(),
    });
  } catch {
    // A failed write only costs a future refetch.
  }
}

// ---- Quota ------------------------------------------------------------------
// Source of truth: GET /status, which reports the exact daily count and does
// not count against the quota. (The x-ratelimit-requests-remaining header is
// not reliable: once blocked it still reads 74999.) One instance refreshes the
// shared snapshot every 5 minutes; the rest read it.

const STATUS_URL = 'https://v3.football.api-sports.io/status';
const SNAPSHOT_MS = 5 * 60_000;

let quota: { remaining: number; limit: number; observedAt: number } | null = null;
let quotaReadAt = 0;
let refreshing: Promise<void> | null = null;

function startOfUtcDay(): number {
  const d = new Date();
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

async function saveSnapshot(remaining: number, limit: number): Promise<void> {
  quota = { remaining, limit, observedAt: Date.now() };
  const c = db();
  if (!c) return;
  try {
    await c.from('api_football_quota').upsert({ id: 1, remaining, limit_day: limit, observed_at: new Date().toISOString() });
  } catch {}
}

/** The provider said the daily quota is gone: tell every instance. */
export function noteExhausted(): void {
  void saveSnapshot(0, quota?.limit ?? 150000);
}

async function refreshFromStatus(): Promise<void> {
  const key = process.env.API_FOOTBALL_KEY ?? '';
  if (!key) return;
  try {
    const res = await fetch(STATUS_URL, { headers: { 'x-apisports-key': key }, cache: 'no-store', signal: AbortSignal.timeout(5000) });
    const json = await res.json();
    const r = json?.response?.requests;
    if (r && Number.isFinite(r.current) && Number.isFinite(r.limit_day)) {
      await saveSnapshot(Math.max(0, r.limit_day - r.current), r.limit_day);
    } else if (/request limit for the day/i.test(JSON.stringify(json?.errors ?? ''))) {
      await saveSnapshot(0, quota?.limit ?? 150000);
    }
  } catch {}
}

/** May the web spend a provider request right now? */
export async function webMayCall(): Promise<boolean> {
  const c = db();
  if (c && Date.now() - quotaReadAt > 60_000) {
    quotaReadAt = Date.now();
    try {
      const { data } = await c.from('api_football_quota').select('remaining, limit_day, observed_at').eq('id', 1).maybeSingle();
      if (data) {
        const at = new Date(data.observed_at).getTime();
        if (!quota || at > quota.observedAt) quota = { remaining: data.remaining, limit: data.limit_day, observedAt: at };
      }
    } catch {}
  }
  const stale = !quota || Date.now() - quota.observedAt > SNAPSHOT_MS || quota.observedAt < startOfUtcDay();
  if (stale) {
    refreshing ??= refreshFromStatus().finally(() => {
      refreshing = null;
    });
    await refreshing;
  }
  if (!quota) return true;
  if (quota.observedAt < startOfUtcDay()) return true;
  const used = quota.limit - quota.remaining;
  return quota.remaining > WEB_RESERVE && used < quota.limit * WEB_SHARE;
}
