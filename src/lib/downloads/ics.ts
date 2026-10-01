// RFC 5545 calendar of a team's fixtures. Times are UTC ("Z"), so every phone
// shows them in its own zone; a kickoff still TBD is an all-day event on the
// scheduled date instead of a made-up hour.

import { fixturePhase, type Fixture } from '@/lib/api-football';
import { matchPath, type RouteLocale } from '@/lib/routes';
import { absolute } from '@/lib/seo';
import { isTimeTbd } from './zones';

function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** Lines longer than 75 octets are folded (continuation starts with a space). */
function fold(line: string): string {
  const bytes = Buffer.from(line, 'utf8');
  if (bytes.length <= 75) return line;
  const parts: string[] = [];
  let cur = '';
  for (const ch of line) {
    if (Buffer.byteLength(cur + ch, 'utf8') > (parts.length ? 74 : 75)) {
      parts.push(cur);
      cur = '';
    }
    cur += ch;
  }
  parts.push(cur);
  return parts.join('\r\n ');
}

function utc(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

const STR = {
  es: { tbd: 'Hora por confirmar', more: 'Marcador en vivo, alineaciones y alertas de gol' },
  pt: { tbd: 'Horário a confirmar', more: 'Placar ao vivo, escalações e alertas de gol' },
  en: { tbd: 'Kickoff time to be confirmed', more: 'Live score, lineups and goal alerts' },
} as const;

export function buildIcs(opts: { name: string; fixtures: Fixture[]; locale: RouteLocale; slug: string }): string {
  const t = STR[opts.locale];
  const stamp = utc(new Date());
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Golify//golify.futbol//' + opts.locale.toUpperCase(),
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${esc(opts.name)}`,
  ];
  for (const f of opts.fixtures) {
    const start = new Date(f.fixture.date);
    if (Number.isNaN(start.getTime())) continue;
    const url = absolute(matchPath(opts.locale, f));
    const summary = `${f.teams.home.name} vs ${f.teams.away.name}`;
    const finished = fixturePhase(f) === 'finished' && f.goals.home != null && f.goals.away != null;
    const desc = [f.league.name + ' · ' + f.league.round, finished ? `${f.goals.home}-${f.goals.away}` : null, isTimeTbd(f.fixture.status.short) ? t.tbd : null, `${t.more}: ${url}`]
      .filter(Boolean)
      .join('\n');
    lines.push('BEGIN:VEVENT', `UID:fixture-${f.fixture.id}@golify.futbol`, `DTSTAMP:${stamp}`);
    if (isTimeTbd(f.fixture.status.short)) {
      const d = f.fixture.date.slice(0, 10).replace(/-/g, '');
      const next = new Date(Date.UTC(+d.slice(0, 4), +d.slice(4, 6) - 1, +d.slice(6, 8) + 1)).toISOString().slice(0, 10).replace(/-/g, '');
      lines.push(`DTSTART;VALUE=DATE:${d}`, `DTEND;VALUE=DATE:${next}`);
    } else {
      lines.push(`DTSTART:${utc(start)}`, `DTEND:${utc(new Date(start.getTime() + 2 * 3600_000))}`);
    }
    lines.push(`SUMMARY:${esc(summary)}`, `DESCRIPTION:${esc(desc)}`, `URL:${url}`);
    const venue = [f.fixture.venue.name, f.fixture.venue.city].filter(Boolean).join(', ');
    if (venue) lines.push(`LOCATION:${esc(venue)}`);
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}
