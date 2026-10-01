// Match status wording, shared by the server scoreboard and the client-side
// live poller. Pure and client-safe: no server imports, so the live layer
// can re-render the same label the crawler read in the HTML.

export type MatchLocale = 'es' | 'pt' | 'en';

// Kept in step with LIVE_STATUSES / FINISHED_STATUSES in api-football.ts
// (that module is server-only by convention, so it is not imported here).
const LIVE = ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE', 'INT'];
const FINISHED = ['FT', 'AET', 'PEN'];

export function isLiveShort(short: string): boolean {
  return LIVE.includes(short);
}

export function isFinishedShort(short: string): boolean {
  return FINISHED.includes(short);
}

const WORDS: Record<MatchLocale, Record<string, string>> = {
  es: {
    NS: 'Por jugarse',
    TBD: 'Horario por confirmar',
    HT: 'Medio tiempo',
    BT: 'Descanso antes de la prórroga',
    P: 'Penales',
    INT: 'Interrumpido',
    SUSP: 'Suspendido',
    PST: 'Aplazado',
    CANC: 'Cancelado',
    ABD: 'Suspendido',
    AWD: 'Resultado administrativo',
    WO: 'Ganado por no presentación',
    FT: 'Final',
    AET: 'Final tras prórroga',
    PEN: 'Final en penales',
    live: 'En vivo',
    extra: 'Prórroga',
  },
  pt: {
    NS: 'A disputar',
    TBD: 'Horário a confirmar',
    HT: 'Intervalo',
    BT: 'Intervalo antes da prorrogação',
    P: 'Pênaltis',
    INT: 'Interrompido',
    SUSP: 'Suspenso',
    PST: 'Adiado',
    CANC: 'Cancelado',
    ABD: 'Suspenso',
    AWD: 'Resultado administrativo',
    WO: 'Vitória por W.O.',
    FT: 'Encerrado',
    AET: 'Encerrado após prorrogação',
    PEN: 'Encerrado nos pênaltis',
    live: 'Ao vivo',
    extra: 'Prorrogação',
  },
  en: {
    NS: 'Not started',
    TBD: 'Time to be confirmed',
    HT: 'Half-time',
    BT: 'Break before extra time',
    P: 'Penalties',
    INT: 'Interrupted',
    SUSP: 'Suspended',
    PST: 'Postponed',
    CANC: 'Cancelled',
    ABD: 'Abandoned',
    AWD: 'Awarded',
    WO: 'Walkover',
    FT: 'Full time',
    AET: 'Full time after extra time',
    PEN: 'Full time (penalties)',
    live: 'Live',
    extra: 'Extra time',
  },
};

/** "45+2'" from the provider's elapsed/extra pair. */
export function minuteText(elapsed: number | null | undefined, extra?: number | null): string {
  if (elapsed == null) return '';
  return extra ? `${elapsed}+${extra}'` : `${elapsed}'`;
}

/** What the scoreboard prints under the score. */
export function statusText(
  s: { short: string; elapsed: number | null; extra?: number | null },
  locale: MatchLocale,
): string {
  const w = WORDS[locale];
  if (s.short === '1H' || s.short === '2H' || s.short === 'LIVE') {
    return minuteText(s.elapsed, s.extra) || w.live;
  }
  if (s.short === 'ET') {
    const m = minuteText(s.elapsed, s.extra);
    return m ? `${w.extra} · ${m}` : w.extra;
  }
  return w[s.short] ?? s.short;
}

export function liveWord(locale: MatchLocale): string {
  return WORDS[locale].live;
}
