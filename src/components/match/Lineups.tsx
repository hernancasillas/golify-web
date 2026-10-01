import type { Lineup } from '@/lib/api-football';
import type { RouteLocale } from '@/lib/routes';
import { PlayerLink } from './PlayerLink';
import { Card, Logo } from './ui';

const L = {
  es: { xi: 'Titulares', subs: 'Suplentes', coach: 'DT', pos: { G: 'POR', D: 'DEF', M: 'MED', F: 'DEL' } },
  pt: { xi: 'Titulares', subs: 'Reservas', coach: 'Técnico', pos: { G: 'GOL', D: 'DEF', M: 'MEI', F: 'ATA' } },
  en: { xi: 'Starting XI', subs: 'Substitutes', coach: 'Coach', pos: { G: 'GK', D: 'DEF', M: 'MID', F: 'FWD' } },
} as const;

function Row({ p, locale, pos }: { p: Lineup['startXI'][number]; locale: RouteLocale; pos: string }) {
  return (
    <li className="flex items-center gap-3 py-1.5 text-sm">
      <span className="w-6 shrink-0 text-right font-display font-bold tabular-nums text-muted-foreground">{p.player.number ?? ''}</span>
      <PlayerLink id={p.player.id} name={p.player.name} locale={locale} className="min-w-0 flex-1 truncate font-semibold hover:underline" />
      <span className="shrink-0 text-[11px] font-bold tracking-wide text-muted-foreground">{pos}</span>
    </li>
  );
}

/** Confirmed lineups, as published by the provider (never a probable XI). */
export function Lineups({ lineups, locale }: { lineups: Lineup[]; locale: RouteLocale }) {
  const shown = lineups.filter((l) => l.startXI.length > 0);
  if (shown.length === 0) return null;
  const t = L[locale];
  const posOf = (p: string | null) => (p ? (t.pos as Record<string, string>)[p] ?? p : '');

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {shown.map((l) => (
        <Card key={l.team.id} className="p-4">
          <div className="flex items-center gap-2.5 border-b border-border pb-3">
            <Logo src={l.team.logo} size={24} />
            <span className="min-w-0 flex-1 truncate font-extrabold">{l.team.name}</span>
            {l.formation ? <span className="font-display text-sm font-bold tabular-nums text-primary">{l.formation}</span> : null}
          </div>
          <p className="mt-3 text-xs font-bold tracking-wide text-muted-foreground uppercase">{t.xi}</p>
          <ul className="mt-1">
            {l.startXI.map((p) => (
              <Row key={p.player.id || p.player.name} p={p} locale={locale} pos={posOf(p.player.pos)} />
            ))}
          </ul>
          {l.substitutes.length > 0 ? (
            <>
              <p className="mt-3 text-xs font-bold tracking-wide text-muted-foreground uppercase">{t.subs}</p>
              <ul className="mt-1">
                {l.substitutes.map((p) => (
                  <Row key={p.player.id || p.player.name} p={p} locale={locale} pos={posOf(p.player.pos)} />
                ))}
              </ul>
            </>
          ) : null}
          {l.coach?.name ? (
            <p className="mt-3 border-t border-border pt-3 text-sm font-semibold">
              <span className="text-muted-foreground">{t.coach}: </span>
              {l.coach.name}
            </p>
          ) : null}
        </Card>
      ))}
    </div>
  );
}
