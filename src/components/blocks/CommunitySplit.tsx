import type { PickSplit } from '@/lib/community';
import type { RouteLocale } from '@/lib/routes';

const L = {
  es: { title: 'Pronóstico de la comunidad', draw: 'Empate', of: 'Pronóstico de {n} hinchas en Golify' },
  pt: { title: 'Palpite da comunidade', draw: 'Empate', of: 'Palpite de {n} torcedores no Golify' },
  en: { title: 'Community prediction', draw: 'Draw', of: 'Predicted by {n} fans on Golify' },
} as const;

const NF: Record<RouteLocale, string> = { es: 'es-MX', pt: 'pt-BR', en: 'en-US' };

// 1 / X / 2 bars from real quiniela picks. Renders nothing without data —
// never a placeholder percentage.
export function CommunitySplit({
  split,
  home,
  away,
  locale,
  title,
  compact = false,
}: {
  split: PickSplit | null;
  home: string;
  away: string;
  locale: RouteLocale;
  title?: string;
  compact?: boolean;
}) {
  if (!split) return null;
  const t = L[locale];
  const rows: [string, number][] = [
    [home, split.pct.home],
    [t.draw, split.pct.draw],
    [away, split.pct.away],
  ];
  const max = Math.max(...rows.map((r) => r[1]));
  return (
    <section className={compact ? '' : 'mt-8'}>
      {compact ? null : <h2 className="font-display text-lg font-bold tracking-wide uppercase">{title ?? t.title}</h2>}
      <div className={`${compact ? '' : 'mt-3'} space-y-2.5 rounded-2xl border border-border bg-surface p-4`}>
        {rows.map(([label, pct]) => (
          <div key={label} className="flex items-center gap-3 text-sm">
            <span className="w-28 shrink-0 truncate font-semibold">{label}</span>
            <span className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2">
              <span
                className={`absolute inset-y-0 left-0 rounded-full ${pct === max ? 'bg-primary' : 'bg-muted-foreground/50'}`}
                style={{ width: `${pct}%` }}
              />
            </span>
            <span className="w-11 shrink-0 text-right font-bold tabular-nums">{pct} %</span>
          </div>
        ))}
        <p className="pt-1 text-xs font-semibold text-muted-foreground">
          {t.of.replace('{n}', split.total.toLocaleString(NF[locale]))}
        </p>
      </div>
    </section>
  );
}
