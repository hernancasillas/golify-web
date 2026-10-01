import type { FixtureEvent } from '@/lib/api-football';
import type { RouteLocale } from '@/lib/routes';
import { minuteText } from './status';
import { PlayerLink } from './PlayerLink';
import { Card, Logo } from './ui';

const L = {
  es: {
    goal: 'Gol',
    penalty: 'Gol de penal',
    own: 'Autogol',
    missed: 'Penal fallado',
    yellow: 'Tarjeta amarilla',
    red: 'Tarjeta roja',
    second: 'Segunda amarilla',
    in: 'Entra',
    out: 'Sale',
    assist: 'Asistencia',
    var: {
      'Goal cancelled': 'Gol anulado',
      'Goal Disallowed': 'Gol anulado',
      'Penalty confirmed': 'Penal confirmado',
      'Penalty cancelled': 'Penal anulado',
      'Card upgrade': 'Tarjeta cambiada',
      'Goal confirmed': 'Gol confirmado',
    } as Record<string, string>,
  },
  pt: {
    goal: 'Gol',
    penalty: 'Gol de pênalti',
    own: 'Gol contra',
    missed: 'Pênalti perdido',
    yellow: 'Cartão amarelo',
    red: 'Cartão vermelho',
    second: 'Segundo amarelo',
    in: 'Entra',
    out: 'Sai',
    assist: 'Assistência',
    var: {
      'Goal cancelled': 'Gol anulado',
      'Goal Disallowed': 'Gol anulado',
      'Penalty confirmed': 'Pênalti confirmado',
      'Penalty cancelled': 'Pênalti anulado',
      'Card upgrade': 'Cartão alterado',
      'Goal confirmed': 'Gol confirmado',
    } as Record<string, string>,
  },
  en: {
    goal: 'Goal',
    penalty: 'Penalty goal',
    own: 'Own goal',
    missed: 'Missed penalty',
    yellow: 'Yellow card',
    red: 'Red card',
    second: 'Second yellow',
    in: 'On',
    out: 'Off',
    assist: 'Assist',
    var: {} as Record<string, string>,
  },
} as const;

function Glyph({ e }: { e: FixtureEvent }) {
  if (e.type === 'Goal') {
    const missed = e.detail === 'Missed Penalty';
    return (
      <span
        aria-hidden
        className={`flex h-6 w-6 items-center justify-center rounded-full ${missed ? 'border border-border' : 'bg-primary'}`}
      >
        <span className={`h-2 w-2 rounded-full ${missed ? 'bg-muted-foreground' : 'bg-primary-foreground'}`} />
      </span>
    );
  }
  if (e.type === 'Card') {
    const red = /red|second/i.test(e.detail);
    return (
      <span aria-hidden className="flex h-6 w-6 items-center justify-center">
        <span className={`h-4 w-3 rounded-[2px] ${red ? 'bg-destructive' : 'bg-gold'}`} />
      </span>
    );
  }
  if (e.type === 'subst') {
    return (
      <span aria-hidden className="flex h-6 w-6 items-center justify-center text-muted-foreground">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 4v14M3 14l4 4 4-4M17 20V6M13 10l4-4 4 4" />
        </svg>
      </span>
    );
  }
  return (
    <span aria-hidden className="flex h-6 w-6 items-center justify-center rounded bg-surface-2 text-[9px] font-extrabold text-muted-foreground">
      VAR
    </span>
  );
}

function describe(e: FixtureEvent, l: RouteLocale) {
  const t = L[l];
  if (e.type === 'Goal') {
    if (e.detail === 'Own Goal') return t.own;
    if (e.detail === 'Penalty') return t.penalty;
    if (e.detail === 'Missed Penalty') return t.missed;
    return t.goal;
  }
  if (e.type === 'Card') {
    if (/second/i.test(e.detail)) return t.second;
    return /red/i.test(e.detail) ? t.red : t.yellow;
  }
  if (e.type === 'Var') return `VAR · ${t.var[e.detail] ?? e.detail}`;
  return '';
}

/** Minute-by-minute list of every event the provider reported. */
export function EventsTimeline({
  events,
  names,
  locale,
}: {
  events: FixtureEvent[];
  names: Map<number, string>;
  locale: RouteLocale;
}) {
  if (events.length === 0) return null;
  const t = L[locale];
  const nm = (id: number | null, fallback: string | null) => (id != null ? names.get(id) : undefined) ?? fallback ?? '';

  return (
    <Card>
      <ol className="divide-y divide-border">
        {events.map((e, i) => (
          <li key={`${e.time.elapsed}-${e.time.extra}-${e.type}-${e.player.id}-${i}`} className="flex items-start gap-3 px-4 py-3">
            <span className="w-12 shrink-0 pt-0.5 text-right font-display text-sm font-bold tabular-nums text-muted-foreground">
              {minuteText(e.time.elapsed, e.time.extra)}
            </span>
            <Glyph e={e} />
            <div className="min-w-0 flex-1 text-sm">
              {e.type === 'subst' ? (
                <p className="font-semibold">
                  <span className="text-muted-foreground">{t.in}: </span>
                  <PlayerLink id={e.assist.id} name={nm(e.assist.id, e.assist.name)} locale={locale} className="font-bold hover:underline" />
                  <span className="text-muted-foreground"> · {t.out}: </span>
                  <PlayerLink id={e.player.id} name={nm(e.player.id, e.player.name)} locale={locale} className="hover:underline" />
                </p>
              ) : (
                <>
                  <p className="font-bold">
                    <PlayerLink id={e.player.id} name={nm(e.player.id, e.player.name)} locale={locale} />
                  </p>
                  <p className="text-xs font-semibold text-muted-foreground">
                    {describe(e, locale)}
                    {e.type === 'Goal' && e.assist.name ? (
                      <>
                        {' · '}
                        {t.assist}:{' '}
                        <PlayerLink id={e.assist.id} name={nm(e.assist.id, e.assist.name)} locale={locale} />
                      </>
                    ) : null}
                  </p>
                </>
              )}
            </div>
            <span className="flex shrink-0 items-center gap-1.5 pt-0.5 text-xs font-semibold text-muted-foreground">
              <Logo src={e.team.logo} size={18} />
              <span className="hidden sm:inline">{e.team.name}</span>
            </span>
          </li>
        ))}
      </ol>
    </Card>
  );
}
