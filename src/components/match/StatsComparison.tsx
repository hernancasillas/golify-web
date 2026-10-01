import type { TeamStatistics, TeamRef } from '@/lib/api-football';
import type { RouteLocale } from '@/lib/routes';
import { Card, Logo } from './ui';

// Provider stat type → label. Only these rows are shown, in this order; a
// row renders when both teams report a value.
const ROWS: { type: string; es: string; pt: string; en: string; pct?: boolean }[] = [
  { type: 'Ball Possession', es: 'Posesión', pt: 'Posse de bola', en: 'Possession', pct: true },
  { type: 'expected_goals', es: 'Goles esperados (xG)', pt: 'Gols esperados (xG)', en: 'Expected goals (xG)' },
  { type: 'Total Shots', es: 'Tiros', pt: 'Finalizações', en: 'Shots' },
  { type: 'Shots on Goal', es: 'Tiros a puerta', pt: 'Chutes no gol', en: 'Shots on target' },
  { type: 'Shots off Goal', es: 'Tiros desviados', pt: 'Chutes para fora', en: 'Shots off target' },
  { type: 'Blocked Shots', es: 'Tiros bloqueados', pt: 'Chutes bloqueados', en: 'Blocked shots' },
  { type: 'Corner Kicks', es: 'Tiros de esquina', pt: 'Escanteios', en: 'Corners' },
  { type: 'Total passes', es: 'Pases', pt: 'Passes', en: 'Passes' },
  { type: 'Passes %', es: 'Precisión de pase', pt: 'Precisão de passe', en: 'Pass accuracy', pct: true },
  { type: 'Goalkeeper Saves', es: 'Atajadas', pt: 'Defesas', en: 'Saves' },
  { type: 'Fouls', es: 'Faltas', pt: 'Faltas', en: 'Fouls' },
  { type: 'Offsides', es: 'Fueras de lugar', pt: 'Impedimentos', en: 'Offsides' },
  { type: 'Yellow Cards', es: 'Tarjetas amarillas', pt: 'Cartões amarelos', en: 'Yellow cards' },
  { type: 'Red Cards', es: 'Tarjetas rojas', pt: 'Cartões vermelhos', en: 'Red cards' },
];

function num(v: number | string | null | undefined): number | null {
  if (v == null) return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace('%', ''));
  return Number.isFinite(n) ? n : null;
}

export function hasStats(stats: TeamStatistics[]): boolean {
  return stats.length === 2 && stats.every((s) => s.statistics.length > 0);
}

export function StatsComparison({
  stats,
  home,
  away,
  locale,
}: {
  stats: TeamStatistics[];
  home: TeamRef;
  away: TeamRef;
  locale: RouteLocale;
}) {
  const h = stats.find((s) => s.team.id === home.id);
  const a = stats.find((s) => s.team.id === away.id);
  if (!h || !a) return null;

  const rows = ROWS.flatMap((r) => {
    const hv = h.statistics.find((s) => s.type === r.type)?.value;
    const av = a.statistics.find((s) => s.type === r.type)?.value;
    const hn = num(hv);
    const an = num(av);
    // Red cards are commonly null for "none"; every other row needs data.
    if (r.type === 'Red Cards' && (hn != null || an != null)) {
      return [{ ...r, hn: hn ?? 0, an: an ?? 0 }];
    }
    if (hn == null || an == null) return [];
    return [{ ...r, hn, an }];
  });
  if (rows.length === 0) return null;

  const fmt = (n: number, pct?: boolean) => (pct ? `${n}${locale === 'es' ? ' %' : '%'}` : String(n));

  return (
    <Card className="p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between text-xs font-extrabold tracking-wide uppercase">
        <span className="flex min-w-0 items-center gap-2">
          <Logo src={home.logo} size={20} />
          <span className="truncate">{home.name}</span>
        </span>
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate">{away.name}</span>
          <Logo src={away.logo} size={20} />
        </span>
      </div>
      <ul className="space-y-3.5">
        {rows.map((r) => {
          const total = r.hn + r.an;
          const hw = total > 0 ? (r.hn / total) * 100 : 50;
          const hLead = r.hn > r.an;
          const aLead = r.an > r.hn;
          return (
            <li key={r.type}>
              <div className="flex items-baseline justify-between text-sm">
                <span className={`font-display font-bold tabular-nums ${hLead ? 'text-foreground' : 'text-muted-foreground'}`}>{fmt(r.hn, r.pct)}</span>
                <span className="px-2 text-center text-xs font-bold text-muted-foreground">{r[locale]}</span>
                <span className={`font-display font-bold tabular-nums ${aLead ? 'text-foreground' : 'text-muted-foreground'}`}>{fmt(r.an, r.pct)}</span>
              </div>
              <div className="mt-1.5 flex h-2 gap-1 overflow-hidden" aria-hidden>
                <span className="flex flex-1 justify-end overflow-hidden rounded-full bg-surface-2">
                  <span className={`h-full rounded-full ${hLead ? 'bg-primary' : 'bg-muted-foreground/45'}`} style={{ width: `${total > 0 ? hw : 0}%` }} />
                </span>
                <span className="flex flex-1 overflow-hidden rounded-full bg-surface-2">
                  <span className={`h-full rounded-full ${aLead ? 'bg-primary' : 'bg-muted-foreground/45'}`} style={{ width: `${total > 0 ? 100 - hw : 0}%` }} />
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
