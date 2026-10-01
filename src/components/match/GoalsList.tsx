import type { RouteLocale } from '@/lib/routes';
import type { GoalItem } from './facts';
import { PlayerLink } from './PlayerLink';
import { Card, Logo } from './ui';
import { minuteText } from './status';

const L = {
  es: { penalty: 'penal', own: 'en contra', assist: 'Asistencia' },
  pt: { penalty: 'pênalti', own: 'contra', assist: 'Assistência' },
  en: { penalty: 'penalty', own: 'own goal', assist: 'Assist' },
} as const;

/** Every goal with its minute, scorer, assist and the running score. */
export function GoalsList({
  goals,
  names,
  locale,
}: {
  goals: GoalItem[];
  names: Map<number, string>;
  locale: RouteLocale;
}) {
  if (goals.length === 0) return null;
  const t = L[locale];
  const nm = (id: number | null, fb: string | null) => (id != null ? names.get(id) : undefined) ?? fb ?? '';
  return (
    <Card>
      <ol className="divide-y divide-border">
        {goals.map((g, i) => {
          const e = g.event;
          return (
            <li key={`${e.time.elapsed}-${e.player.id}-${i}`} className="flex items-center gap-3 px-4 py-3">
              <span className="w-12 shrink-0 text-right font-display text-sm font-bold tabular-nums text-muted-foreground">
                {minuteText(e.time.elapsed, e.time.extra)}
              </span>
              {g.score ? (
                <span className="w-11 shrink-0 rounded-md bg-surface-2 py-0.5 text-center font-display text-sm font-bold tabular-nums">
                  {g.score.home}-{g.score.away}
                </span>
              ) : null}
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-bold">
                  <PlayerLink id={e.player.id} name={nm(e.player.id, e.player.name)} locale={locale} />
                  {g.kind !== 'normal' ? (
                    <span className="font-semibold text-muted-foreground"> ({g.kind === 'own' ? t.own : t.penalty})</span>
                  ) : null}
                </p>
                {e.assist.name ? (
                  <p className="text-xs font-semibold text-muted-foreground">
                    {t.assist}: <PlayerLink id={e.assist.id} name={nm(e.assist.id, e.assist.name)} locale={locale} />
                  </p>
                ) : null}
              </div>
              <span className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Logo src={e.team.logo} size={18} />
                <span className="hidden sm:inline">{e.team.name}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
