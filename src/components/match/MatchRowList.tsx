import Link from 'next/link';
import type { Fixture } from '@/lib/api-football';
import { matchPath, type RouteLocale } from '@/lib/routes';
import { shortDateIn, timeIn } from '@/lib/timezones';
import { Card, Logo } from './ui';
import { isFinishedShort, isLiveShort, minuteText } from './status';

// Compact list of fixtures (H2H, other matches of the day, next in the
// tournament). Kickoff time/date is printed in the zone of the locale's main
// market (CDMX / Brasília / US Eastern) with the zone named, since this is
// server HTML and "local time" would be the server's.

const ZONE: Record<RouteLocale, { zone: string; label: string }> = {
  es: { zone: 'America/Mexico_City', label: 'CDMX' },
  pt: { zone: 'America/Sao_Paulo', label: 'Brasília' },
  en: { zone: 'America/New_York', label: 'ET' },
};

export function zoneFor(locale: RouteLocale) {
  return ZONE[locale];
}

export function MatchRowList({
  fixtures,
  locale,
  showDate = false,
  showLeague = false,
  highlightTeam,
}: {
  fixtures: Fixture[];
  locale: RouteLocale;
  showDate?: boolean;
  showLeague?: boolean;
  /** Bold this team's name (H2H lists). */
  highlightTeam?: number;
}) {
  if (fixtures.length === 0) return null;
  const z = ZONE[locale];
  return (
    <Card>
      <ul className="divide-y divide-border">
        {fixtures.map((x) => {
          const short = x.fixture.status.short;
          const played = x.goals.home != null && x.goals.away != null && (isFinishedShort(short) || isLiveShort(short));
          const live = isLiveShort(short);
          return (
            <li key={x.fixture.id}>
              <Link href={matchPath(locale, x)} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2">
                <span className="w-16 shrink-0 text-xs leading-tight font-bold text-muted-foreground">
                  {showDate ? <span className="block capitalize">{shortDateIn(x.fixture.date, z.zone, locale)}</span> : null}
                  {live ? (
                    <span className="text-live">{minuteText(x.fixture.status.elapsed, x.fixture.status.extra) || 'LIVE'}</span>
                  ) : played ? null : (
                    <span className="tabular-nums">
                      {timeIn(x.fixture.date, z.zone, locale)} <span className="font-semibold">{z.label}</span>
                    </span>
                  )}
                </span>
                <span className="min-w-0 flex-1 text-sm">
                  {showLeague ? (
                    <span className="block truncate text-[11px] font-bold tracking-wide text-muted-foreground uppercase">{x.league.name}</span>
                  ) : null}
                  {(['home', 'away'] as const).map((side) => (
                    <span key={side} className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-2">
                        <Logo src={x.teams[side].logo} size={16} />
                        <span className={`truncate ${x.teams[side].id === highlightTeam ? 'font-extrabold' : 'font-semibold'}`}>
                          {x.teams[side].name}
                        </span>
                      </span>
                      {played ? (
                        <span className={`shrink-0 font-display font-bold tabular-nums ${live ? 'text-live' : ''}`}>{x.goals[side]}</span>
                      ) : null}
                    </span>
                  ))}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
