import Image from 'next/image';
import type { RouteLocale } from '@/lib/routes';
import type { RatedPlayer } from './facts';
import { PlayerLink } from './PlayerLink';
import { Card, Logo } from './ui';

// "Figura del partido" is the highest provider rating, and the page says so:
// the strategy doc imagines a community vote, which the app does not collect
// yet, so we label the number with its real source instead of implying one.

export const RATING_SOURCE = 'API-Football';

const L = {
  es: { mins: 'min', goals: (n: number) => `${n} ${n === 1 ? 'gol' : 'goles'}`, assists: (n: number) => `${n} ${n === 1 ? 'asistencia' : 'asistencias'}`, rating: 'Calificación' },
  pt: { mins: 'min', goals: (n: number) => `${n} ${n === 1 ? 'gol' : 'gols'}`, assists: (n: number) => `${n} ${n === 1 ? 'assistência' : 'assistências'}`, rating: 'Nota' },
  en: { mins: 'min', goals: (n: number) => `${n} ${n === 1 ? 'goal' : 'goals'}`, assists: (n: number) => `${n} ${n === 1 ? 'assist' : 'assists'}`, rating: 'Rating' },
} as const;

function Badge({ r }: { r: number }) {
  return (
    <span className="inline-flex min-w-11 justify-center rounded-md bg-primary px-2 py-1 font-display text-sm font-bold text-primary-foreground tabular-nums">
      {r.toFixed(1)}
    </span>
  );
}

export function ManOfTheMatch({ p, note, locale }: { p: RatedPlayer; note: string; locale: RouteLocale }) {
  const t = L[locale];
  const extras = [
    p.minutes ? `${p.minutes} ${t.mins}` : null,
    p.goals > 0 ? t.goals(p.goals) : null,
    p.assists > 0 ? t.assists(p.assists) : null,
  ].filter(Boolean);
  return (
    <Card className="flex items-center gap-4 p-4 sm:p-5">
      {p.photo ? (
        <Image src={p.photo} alt={p.name} width={64} height={64} unoptimized className="h-16 w-16 shrink-0 rounded-full bg-surface-2 object-cover" />
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="text-lg font-extrabold">
          <PlayerLink id={p.id} name={p.name} locale={locale} />
        </p>
        <p className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
          <Logo src={p.teamLogo} size={16} />
          <span className="truncate">{p.teamName}</span>
        </p>
        {extras.length ? <p className="mt-1 text-xs font-semibold text-muted-foreground">{extras.join(' · ')}</p> : null}
        <p className="mt-2 text-[11px] font-semibold text-muted-foreground">{note}</p>
      </div>
      <div className="flex shrink-0 flex-col items-center gap-1">
        <Badge r={p.rating} />
        <span className="text-[10px] font-bold tracking-wide text-muted-foreground uppercase">{t.rating}</span>
      </div>
    </Card>
  );
}

export function PlayerRatings({ players, locale }: { players: RatedPlayer[]; locale: RouteLocale }) {
  if (players.length === 0) return null;
  const t = L[locale];
  return (
    <Card>
      <ol className="divide-y divide-border">
        {players.map((p, i) => (
          <li key={p.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
            <span className="w-5 shrink-0 text-right font-display font-bold text-muted-foreground tabular-nums">{i + 1}</span>
            <Logo src={p.teamLogo} size={18} />
            <span className="min-w-0 flex-1 truncate font-semibold">
              <PlayerLink id={p.id} name={p.name} locale={locale} />
            </span>
            <span className="hidden shrink-0 text-xs font-semibold text-muted-foreground sm:inline">
              {p.minutes ? `${p.minutes} ${t.mins}` : ''}
            </span>
            <Badge r={p.rating} />
          </li>
        ))}
      </ol>
    </Card>
  );
}
