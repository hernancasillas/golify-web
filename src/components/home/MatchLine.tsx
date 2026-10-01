import Image from 'next/image';
import Link from 'next/link';
import type { Fixture } from '@/lib/api-football';
import { fixturePhase } from '@/lib/api-football';
import { matchPath, type RouteLocale } from '@/lib/routes';
import { LocalTime } from '@/components/LocalTime';
import { intlLocale } from '@/lib/timezones';

// One compact fixture row for Home boards: clock or live minute, both teams,
// score once there is one. Whole row links to the match page.
export function MatchLine({ f, locale }: { f: Fixture; locale: RouteLocale }) {
  const phase = fixturePhase(f);
  const showScore = (phase === 'live' || phase === 'finished') && f.goals.home != null;
  return (
    <Link
      href={matchPath(locale, f)}
      className="flex items-center gap-3 px-3.5 py-3 transition-colors hover:bg-surface-2"
    >
      <span className="w-14 shrink-0 text-xs font-extrabold text-muted-foreground tabular-nums">
        {phase === 'live' ? (
          <span className="flex items-center gap-1.5 text-live">
            <span aria-hidden className="h-2 w-2 rounded-full bg-live" />
            {f.fixture.status.short === 'HT' ? 'HT' : `${f.fixture.status.elapsed ?? ''}'`}
          </span>
        ) : phase === 'finished' ? (
          'FT'
        ) : (
          <LocalTime iso={f.fixture.date} locale={intlLocale(locale)} style="time" />
        )}
      </span>
      <span className="min-w-0 flex-1 space-y-1.5">
        {([f.teams.home, f.teams.away] as const).map((tm, i) => (
          <span key={tm.id} className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2">
              <Image src={tm.logo} alt="" width={20} height={20} unoptimized className="h-5 w-5 shrink-0 object-contain" />
              <span className="truncate text-sm font-bold text-foreground">{tm.name}</span>
            </span>
            {showScore ? (
              <span className="font-display text-base font-bold tabular-nums text-foreground">
                {i === 0 ? f.goals.home : f.goals.away}
              </span>
            ) : null}
          </span>
        ))}
      </span>
    </Link>
  );
}
