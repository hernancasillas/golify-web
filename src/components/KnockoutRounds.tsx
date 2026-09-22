import Image from 'next/image';
import Link from 'next/link';
import type { Fixture } from '@/lib/api-football';

// The World Cup 2026 knockout rounds, rendered as a readable results ladder.
// The tournament is over, so this is an archive: fixed facts that keep earning
// the "llaves del mundial" / "world cup bracket" searches long after the final.

export const KNOCKOUT_ROUNDS = [
  'Round of 32',
  'Round of 16',
  'Quarter-finals',
  'Semi-finals',
  '3rd Place Final',
  'Final',
] as const;

export const ROUND_LABELS: Record<string, { es: string; en: string }> = {
  'Round of 32': { es: 'Dieciseisavos de final', en: 'Round of 32' },
  'Round of 16': { es: 'Octavos de final', en: 'Round of 16' },
  'Quarter-finals': { es: 'Cuartos de final', en: 'Quarter-finals' },
  'Semi-finals': { es: 'Semifinales', en: 'Semi-finals' },
  '3rd Place Final': { es: 'Tercer lugar', en: 'Third place' },
  Final: { es: 'Final', en: 'Final' },
};

export function roundLabel(round: string, locale: string): string {
  const entry = ROUND_LABELS[round];
  if (!entry) return round;
  return locale === 'en' ? entry.en : entry.es;
}

function winnerSide(f: Fixture): 'home' | 'away' | null {
  if (f.teams.home.winner) return 'home';
  if (f.teams.away.winner) return 'away';
  return null;
}

function TieRow({ f, locale }: { f: Fixture; locale: string }) {
  const winner = winnerSide(f);
  const played = f.goals.home != null && f.goals.away != null;
  const extra = ['AET', 'PEN'].includes(f.fixture.status.short)
    ? f.fixture.status.short === 'PEN'
      ? locale === 'en'
        ? 'on penalties'
        : 'en penales'
      : locale === 'en'
        ? 'after extra time'
        : 'tras la prórroga'
    : null;

  return (
    <Link
      href={`/${locale}/match/${f.fixture.id}`}
      className="block rounded-2xl border border-border bg-surface p-4 transition hover:border-primary/40 hover:bg-surface-2"
    >
      <div className="space-y-2">
        {(['home', 'away'] as const).map((side) => (
          <div key={side} className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2">
              <Image
                src={f.teams[side].logo}
                alt=""
                width={20}
                height={20}
                unoptimized
                className="h-5 w-5 shrink-0 object-contain"
              />
              <span
                className={`truncate text-sm ${
                  winner === side ? 'font-extrabold text-foreground' : 'font-bold text-muted-foreground'
                }`}
              >
                {f.teams[side].name}
              </span>
            </span>
            <span className="shrink-0 font-display text-base font-bold tabular-nums">
              {played ? f.goals[side] : '-'}
            </span>
          </div>
        ))}
      </div>
      {extra ? (
        <p className="mt-2 text-xs font-bold text-muted-foreground">{extra}</p>
      ) : null}
    </Link>
  );
}

export function KnockoutRounds({
  fixtures,
  locale,
}: {
  fixtures: Fixture[];
  locale: string;
}) {
  return (
    <>
      {KNOCKOUT_ROUNDS.map((round) => {
        const ties = fixtures
          .filter((f) => f.league.round === round)
          .sort((a, b) => a.fixture.date.localeCompare(b.fixture.date));
        if (ties.length === 0) return null;
        return (
          <section key={round} className="mt-10">
            <h2 className="mb-4 font-display text-xl font-bold tracking-wide uppercase">
              {roundLabel(round, locale)}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {ties.map((f) => (
                <TieRow key={f.fixture.id} f={f} locale={locale} />
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}

/** The team that lifted the trophy, read from the final rather than hardcoded. */
export function champion(fixtures: Fixture[]): { name: string; logo: string; score: string; runnerUp: string } | null {
  const final = fixtures.find((f) => f.league.round === 'Final');
  if (!final || final.goals.home == null || final.goals.away == null) return null;
  const homeWon = !!final.teams.home.winner;
  const winner = homeWon ? final.teams.home : final.teams.away;
  const loser = homeWon ? final.teams.away : final.teams.home;
  const top = Math.max(final.goals.home, final.goals.away);
  const bottom = Math.min(final.goals.home, final.goals.away);
  return {
    name: winner.name,
    logo: winner.logo,
    score: `${top}-${bottom}`,
    runnerUp: loser.name,
  };
}
