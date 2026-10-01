import Link from 'next/link';
import type { Fixture, TeamRef } from '@/lib/api-football';
import { matchPath, teamPath, type RouteLocale } from '@/lib/routes';
import { Card, Logo, OUTCOME_LETTER, OutcomeChip } from './ui';

const L = {
  es: { newest: 'Más reciente a la derecha', vs: 'vs' },
  pt: { newest: 'Mais recente à direita', vs: 'x' },
  en: { newest: 'Most recent on the right', vs: 'vs' },
} as const;

function outcome(x: Fixture, teamId: number): 'W' | 'D' | 'L' | null {
  const { home, away } = x.goals;
  if (home == null || away == null) return null;
  const mine = x.teams.home.id === teamId ? home : away;
  const theirs = x.teams.home.id === teamId ? away : home;
  return mine > theirs ? 'W' : mine < theirs ? 'L' : 'D';
}

/** Last five results of each side, every chip linking to that match. */
export function FormGuide({
  rows,
  locale,
}: {
  rows: { team: TeamRef; fixtures: Fixture[] }[];
  locale: RouteLocale;
}) {
  const shown = rows.filter((r) => r.fixtures.length > 0);
  if (shown.length === 0) return null;
  const t = L[locale];
  return (
    <Card className="divide-y divide-border">
      {shown.map(({ team, fixtures }) => (
        <div key={team.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
          <Link href={teamPath(locale, team)} className="flex min-w-0 items-center gap-2.5 font-extrabold hover:underline">
            <Logo src={team.logo} size={24} />
            <span className="truncate">{team.name}</span>
          </Link>
          <ol className="flex gap-1.5">
            {[...fixtures].reverse().map((x) => {
              const o = outcome(x, team.id);
              if (!o) return null;
              const rival = x.teams.home.id === team.id ? x.teams.away.name : x.teams.home.name;
              const label = `${t.vs} ${rival} ${x.goals.home}-${x.goals.away}`;
              return (
                <li key={x.fixture.id}>
                  <Link href={matchPath(locale, x)} aria-label={label} title={label}>
                    <OutcomeChip outcome={o} label={OUTCOME_LETTER[locale][o]} />
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      ))}
      <p className="px-4 py-2 text-[11px] font-semibold text-muted-foreground">{t.newest}</p>
    </Card>
  );
}
