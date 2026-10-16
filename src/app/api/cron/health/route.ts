// The web's view of the shared API-Football quota, for people and alerts.
// GET with `Authorization: Bearer $CRON_SECRET`. Reads the free /status
// endpoint (does not count against the quota), at most every 5 minutes.
//
// {
//   "limit": 150000, "used": 48210, "remaining": 101790,   // the whole key, app + web
//   "webShare": 0.3, "heavyShare": 0.1, "reserve": 30000,   // the rules in force
//   "webAllowed": true, "heavyAllowed": false,              // may the web call now
//   "observedAt": "2026-10-15T23:41:07.000Z"
// }

import { NextResponse } from 'next/server';
import { quotaView } from '@/lib/apif-store';

export const dynamic = 'force-dynamic';
export const maxDuration = 15;

export async function GET(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  return NextResponse.json(await quotaView(), { headers: { 'Cache-Control': 'no-store' } });
}
