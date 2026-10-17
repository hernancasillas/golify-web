import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { fixturePhase, type Fixture } from '@/lib/api-football';
import { matchPath, type RouteLocale } from '@/lib/routes';

// One match as a broadcast strip: status | home | score block | away. The
// score sits in an inverted block like the score bug of a TV graphic. Layout
// switches to stacked teams by container width (globals.css, `.fx`), so the
// same row works in a narrow sidebar and on a wide board.
//
// LiveScoreUpdater patches `[data-score]` and `[data-minute]` in rows marked
// `data-live-fixture`, and slides in the `.fx-gol` band when a score changes.

const VS: Record<RouteLocale, string> = { es: 'vs', pt: 'x', en: 'vs' };
const GOAL: Record<RouteLocale, string> = { es: 'GOL', pt: 'GOL', en: 'GOAL' };

export function FxRow({
  f,
  locale,
  status,
  ariaLabel,
}: {
  f: Fixture;
  locale: RouteLocale;
  /** The status cell content: live minute, kickoff time, "Final"… */
  status: ReactNode;
  ariaLabel?: string;
}) {
  const phase = fixturePhase(f);
  const scored = f.goals.home != null && f.goals.away != null && phase !== 'scheduled';
  const decided = phase === 'finished';
  const homeLost = decided && f.teams.home.winner === false;
  const awayLost = decided && f.teams.away.winner === false;
  return (
    <Link
      href={matchPath(locale, f)}
      className="fx"
      data-phase={phase}
      data-live-fixture={phase === 'live' ? f.fixture.id : undefined}
      aria-label={ariaLabel}
    >
      <span className="fx-m">{status}</span>
      <span className={`fx-t fx-h${homeLost ? ' fx-lost' : ''}`}>
        <span className="fx-nm" data-team="home">{f.teams.home.name}</span>
        <Image src={f.teams.home.logo} alt="" width={28} height={28} unoptimized />
      </span>
      <span className="fx-s">
        {scored ? (
          <>
            <span data-score="home">{f.goals.home}</span>
            <span className="fx-sep" aria-hidden>–</span>
            <span data-score="away">{f.goals.away}</span>
          </>
        ) : (
          VS[locale]
        )}
      </span>
      <span className={`fx-t fx-a${awayLost ? ' fx-lost' : ''}`}>
        <Image src={f.teams.away.logo} alt="" width={28} height={28} unoptimized />
        <span className="fx-nm" data-team="away">{f.teams.away.name}</span>
      </span>
      {phase === 'live' ? (
        <span className="fx-gol" aria-hidden>
          {GOAL[locale]} <small />
        </span>
      ) : null}
    </Link>
  );
}
