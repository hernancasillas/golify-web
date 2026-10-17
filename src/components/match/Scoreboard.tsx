import Link from 'next/link';
import type { Fixture } from '@/lib/api-football';
import { LocalTime } from '@/components/LocalTime';
import { TRACKED_LEAGUE_IDS } from '@/lib/leagues';
import { LiveScore } from './LiveScore';
import { Logo } from './ui';
import { isLiveShort, type MatchLocale } from './status';

const L = {
  es: { kickoff: 'Inicio', venue: 'Estadio', referee: 'Árbitro', ht: 'Medio tiempo', pens: 'Penales' },
  pt: { kickoff: 'Início', venue: 'Estádio', referee: 'Árbitro', ht: 'Intervalo', pens: 'Pênaltis' },
  en: { kickoff: 'Kickoff', venue: 'Venue', referee: 'Referee', ht: 'Half-time', pens: 'Penalties' },
} as const;

function TeamSide({ team, href }: { team: Fixture['teams']['home']; href: string }) {
  return (
    <Link href={href} className="group flex min-w-0 flex-col items-center gap-3 text-center">
      <Logo src={team.logo} size={80} />
      <span className="max-w-full font-display text-2xl leading-none font-black break-words uppercase group-hover:underline sm:text-4xl">{team.name}</span>
    </Link>
  );
}

// The "Partido del día" card from the Home design, grown into the page head:
// both teams, the score (kept live by <LiveScore>) and the match facts.
export function Scoreboard({
  f,
  locale,
  eyebrow,
  homeHref,
  awayHref,
  venue,
  referee,
}: {
  f: Fixture;
  locale: MatchLocale;
  eyebrow: string;
  homeHref: string;
  awayHref: string;
  venue: { label: string; href: string | null } | null;
  referee: { label: string; href: string } | null;
}) {
  const t = L[locale];
  const ht = f.score?.halftime;
  const pen = f.score?.penalty;
  const showHt = ht?.home != null && ht?.away != null && f.fixture.status.short !== '1H';
  const showPens = pen?.home != null && pen?.away != null;

  return (
    <div className="mt-5">
      <p className="text-center text-sm font-extrabold tracking-[0.06em] uppercase">{eyebrow}</p>
      <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 sm:gap-6">
        <TeamSide team={f.teams.home} href={homeHref} />
        <div className="flex flex-col items-center gap-1.5">
          {/* Keyed on live-vs-not: while the match is live the client copy
              (fresher than a cached server render) is kept across refreshes;
              once a refresh brings the final whistle it restarts from it. */}
          <LiveScore
            key={isLiveShort(f.fixture.status.short) ? 'live' : f.fixture.status.short}
            fixtureId={f.fixture.id}
            // /api/live-fixtures only carries the tracked leagues; polling
            // for any other match would never find it.
            pollable={TRACKED_LEAGUE_IDS.includes(f.league.id)}
            locale={locale}
            initial={{
              home: f.goals.home,
              away: f.goals.away,
              short: f.fixture.status.short,
              elapsed: f.fixture.status.elapsed,
              extra: f.fixture.status.extra ?? null,
            }}
          />
          {showHt ? (
            <span className="text-xs font-semibold text-field-muted tabular-nums">
              {t.ht}: {ht!.home}-{ht!.away}
            </span>
          ) : null}
          {showPens ? (
            <span className="text-xs font-bold tabular-nums">
              {t.pens}: {pen!.home}-{pen!.away}
            </span>
          ) : null}
        </div>
        <TeamSide team={f.teams.away} href={awayHref} />
      </div>

      <dl className="mt-7 grid grid-cols-1 gap-3 border-t border-field-foreground/25 pt-5 text-sm sm:grid-cols-3">
        <div className="min-w-0">
          <dt className="text-xs font-bold tracking-wide text-muted-foreground uppercase">{t.kickoff}</dt>
          <dd className="mt-0.5 font-semibold">
            <LocalTime iso={f.fixture.date} locale={locale} />
          </dd>
        </div>
        {venue ? (
          <div className="min-w-0">
            <dt className="text-xs font-bold tracking-wide text-muted-foreground uppercase">{t.venue}</dt>
            <dd className="mt-0.5 font-semibold break-words">
              {venue.href ? (
                <Link href={venue.href} className="hover:underline">
                  {venue.label}
                </Link>
              ) : (
                venue.label
              )}
            </dd>
          </div>
        ) : null}
        {referee ? (
          <div className="min-w-0">
            <dt className="text-xs font-bold tracking-wide text-muted-foreground uppercase">{t.referee}</dt>
            <dd className="mt-0.5 font-semibold break-words">
              <Link href={referee.href} className="hover:underline">
                {referee.label}
              </Link>
            </dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}
