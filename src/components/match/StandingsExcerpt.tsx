import Link from 'next/link';
import type { StandingsGroup } from '@/lib/api-football';
import { teamPath, type RouteLocale } from '@/lib/routes';
import { Card, Logo } from './ui';

const L = {
  es: { team: 'Equipo', p: 'PJ', gd: 'DG', pts: 'Pts', gap: 'Más equipos' },
  pt: { team: 'Time', p: 'J', gd: 'SG', pts: 'Pts', gap: 'Mais times' },
  en: { team: 'Team', p: 'P', gd: 'GD', pts: 'Pts', gap: 'More teams' },
} as const;

/** The table around the two teams, both highlighted. */
export function StandingsExcerpt({
  group,
  rows,
  highlight,
  caption,
  locale,
}: {
  group: StandingsGroup;
  rows: (number | null)[];
  highlight: number[];
  caption: string | null;
  locale: RouteLocale;
}) {
  const t = L[locale];
  return (
    <Card className="overflow-hidden">
      {caption ? <p className="border-b border-border px-4 py-2.5 text-xs font-bold tracking-wide text-muted-foreground uppercase">{caption}</p> : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[300px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-bold tracking-wide text-muted-foreground uppercase">
              <th className="w-10 px-3 py-2 text-right">#</th>
              <th className="px-2 py-2">{t.team}</th>
              <th className="w-10 px-2 py-2 text-right">{t.p}</th>
              <th className="w-12 px-2 py-2 text-right">{t.gd}</th>
              <th className="w-12 px-3 py-2 text-right">{t.pts}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((i, k) => {
              if (i == null) {
                return (
                  <tr key={`gap-${k}`} className="border-b border-border/60">
                    <td colSpan={5} className="px-3 py-1 text-center text-xs font-bold text-muted-foreground" aria-label={t.gap}>
                      …
                    </td>
                  </tr>
                );
              }
              const r = group.rows[i];
              const hi = highlight.includes(r.team.id);
              return (
                <tr key={r.team.id} className={`border-b border-border/60 last:border-0 ${hi ? 'bg-primary/10' : ''}`}>
                  <td className="px-3 py-2 text-right font-display font-bold tabular-nums">{r.rank}</td>
                  <td className="px-2 py-2">
                    <Link href={teamPath(locale, r.team)} className={`flex min-w-0 items-center gap-2 hover:underline ${hi ? 'font-extrabold' : 'font-semibold'}`}>
                      <Logo src={r.team.logo} size={18} />
                      <span className="truncate">{r.team.name}</span>
                    </Link>
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums text-muted-foreground">{r.all.played}</td>
                  <td className="px-2 py-2 text-right tabular-nums text-muted-foreground">{r.goalsDiff > 0 ? `+${r.goalsDiff}` : r.goalsDiff}</td>
                  <td className="px-3 py-2 text-right font-display font-bold tabular-nums">{r.points}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
