// Chrome shared by every competition page (table headers, tab names, CTA
// copy). Page-specific copy — titles, descriptions, FAQ, the rule-based
// sentences — lives in each page's own STR object.

import type { RouteLocale } from '@/lib/routes';

export const UI = {
  es: {
    home: 'Inicio',
    leagues: 'Ligas',
    tabs: { overview: 'Resumen', table: 'Tabla', fixtures: 'Calendario', scorers: 'Goleadores', assists: 'Asistencias', cards: 'Tarjetas' },
    team: 'Equipo',
    player: 'Jugador',
    p: 'PJ',
    w: 'G',
    d: 'E',
    l: 'P',
    gf: 'GF',
    ga: 'GC',
    gd: 'Dif',
    pts: 'Pts',
    form: 'Últimos 5',
    formHint: 'El más reciente, a la derecha.',
    formLetters: { W: 'G', D: 'E', L: 'P' },
    formWords: { W: 'Ganó', D: 'Empató', L: 'Perdió' },
    general: 'General',
    homeT: 'Local',
    awayT: 'Visitante',
    goals: 'Goles',
    assists: 'Asist.',
    yellow: 'Amarillas',
    red: 'Rojas',
    apps: 'PJ',
    pens: 'Pen.',
    minutes: 'Min.',
    seeAll: 'Ver todos',
    seeTable: 'Ver tabla completa',
    finished: 'Final',
    live: 'En vivo',
    tbd: 'Por definir',
    postponed: 'Aplazado',
    vs: 'vs',
    computed: 'Tabla calculada con los resultados de los partidos terminados (orden: puntos, diferencia de goles y goles a favor). Puede no reflejar todos los criterios de desempate del reglamento.',
    groupWord: 'Grupo',
    timesIn: 'Horarios en hora de {zone}',
    notStreaming: 'Golify no transmite partidos: te damos horarios, resultados y el minuto a minuto.',
    appKicker: 'App Golify',
    appTitle: 'Juega la quiniela con tus amigos',
    appBody: 'Pronostica cada jornada, arma tu grupo y presume en el chat cuando aciertes.',
    appCta: 'Descarga la app',
    poolCta: 'Llena la quiniela de la {round}',
    download: 'Quiniela para imprimir',
    whereToWatch: 'Dónde ver',
    transfers: 'Fichajes',
    pool: 'Quiniela',
    ad: 'Publicidad',
  },
  pt: {
    home: 'Início',
    leagues: 'Ligas',
    tabs: { overview: 'Resumo', table: 'Tabela', fixtures: 'Calendário', scorers: 'Artilheiros', assists: 'Assistências', cards: 'Cartões' },
    team: 'Time',
    player: 'Jogador',
    p: 'J',
    w: 'V',
    d: 'E',
    l: 'D',
    gf: 'GP',
    ga: 'GC',
    gd: 'SG',
    pts: 'Pts',
    form: 'Últimos 5',
    formHint: 'O mais recente, à direita.',
    formLetters: { W: 'V', D: 'E', L: 'D' },
    formWords: { W: 'Venceu', D: 'Empatou', L: 'Perdeu' },
    general: 'Geral',
    homeT: 'Mandante',
    awayT: 'Visitante',
    goals: 'Gols',
    assists: 'Assist.',
    yellow: 'Amarelos',
    red: 'Vermelhos',
    apps: 'J',
    pens: 'Pên.',
    minutes: 'Min.',
    seeAll: 'Ver todos',
    seeTable: 'Ver tabela completa',
    finished: 'Encerrado',
    live: 'Ao vivo',
    tbd: 'A definir',
    postponed: 'Adiado',
    vs: 'x',
    computed: 'Tabela calculada com os resultados dos jogos encerrados (ordem: pontos, saldo de gols e gols pró). Pode não refletir todos os critérios de desempate do regulamento.',
    groupWord: 'Grupo',
    timesIn: 'Horários no fuso de {zone}',
    notStreaming: 'O Golify não transmite jogos: a gente entrega horários, resultados e o minuto a minuto.',
    appKicker: 'App Golify',
    appTitle: 'Jogue o bolão com os amigos',
    appBody: 'Dê seu palpite em cada rodada, monte seu grupo e tire onda no chat quando acertar.',
    appCta: 'Baixe o app',
    poolCta: 'Faça o bolão da {round}',
    download: 'Bolão para imprimir',
    whereToWatch: 'Onde assistir',
    transfers: 'Transferências',
    pool: 'Bolão',
    ad: 'Publicidade',
  },
  en: {
    home: 'Home',
    leagues: 'Leagues',
    tabs: { overview: 'Overview', table: 'Table', fixtures: 'Fixtures', scorers: 'Top scorers', assists: 'Assists', cards: 'Cards' },
    team: 'Team',
    player: 'Player',
    p: 'P',
    w: 'W',
    d: 'D',
    l: 'L',
    gf: 'GF',
    ga: 'GA',
    gd: 'GD',
    pts: 'Pts',
    form: 'Last 5',
    formHint: 'Most recent on the right.',
    formLetters: { W: 'W', D: 'D', L: 'L' },
    formWords: { W: 'Won', D: 'Drew', L: 'Lost' },
    general: 'Overall',
    homeT: 'Home',
    awayT: 'Away',
    goals: 'Goals',
    assists: 'Ast.',
    yellow: 'Yellow',
    red: 'Red',
    apps: 'Apps',
    pens: 'Pen.',
    minutes: 'Min.',
    seeAll: 'See all',
    seeTable: 'See full table',
    finished: 'FT',
    live: 'Live',
    tbd: 'TBD',
    postponed: 'Postponed',
    vs: 'vs',
    computed: 'Table calculated from the results of finished matches (order: points, goal difference, goals scored). It may not reflect every tiebreaker in the rules.',
    groupWord: 'Group',
    timesIn: 'Times shown in {zone} time',
    notStreaming: 'Golify does not stream matches: we give you kickoff times, results and the minute-by-minute.',
    appKicker: 'Golify app',
    appTitle: 'Play the pool with your friends',
    appBody: 'Call every matchday, build your group and show off in the chat when you nail it.',
    appCta: 'Get the app',
    poolCta: 'Fill in the {round} pool',
    download: 'Printable pool sheet',
    whereToWatch: 'Where to watch',
    transfers: 'Transfers',
    pool: 'Pool',
    ad: 'Advertisement',
  },
} as const;

export type UiStrings = (typeof UI)[RouteLocale];

export function ui(locale: RouteLocale): UiStrings {
  return UI[locale];
}

export function asLocale(v: string): RouteLocale {
  return v === 'pt' || v === 'en' ? v : 'es';
}

// Portuguese templates are written for a masculine competition ("do
// Brasileirão"); almost every other one is feminine in Portuguese ("da Liga
// MX", "a Premier League", "na Copa Libertadores"), so the article in front
// of {name} is switched here instead of in dozens of templates. Spanish and
// English templates never put do/no/o right before {name}.
const MASCULINE_PT = /^(Brasileirão|Championship)/;
const FEMININE: Record<string, string> = { do: 'da', no: 'na', o: 'a', Do: 'Da', No: 'Na', O: 'A' };

export function fmt(template: string, values: Record<string, string | number>): string {
  let tpl = template;
  if (typeof values.name === 'string' && !MASCULINE_PT.test(values.name)) {
    tpl = tpl.replace(/(^|[^\p{L}])(do|no|o|Do|No|O) \{name\}/gu, (_, pre: string, a: string) => `${pre}${FEMININE[a]} {name}`);
  }
  return tpl.replace(/\{(\w+)\}/g, (_, k: string) => String(values[k] ?? ''));
}

/** "Group A" → "Grupo A" */
export function groupLabel(name: string, locale: RouteLocale): string {
  const m = /^group\s+(.+)$/i.exec(name.trim());
  if (m) return `${UI[locale].groupWord} ${m[1]}`;
  if (/^western conference$/i.test(name)) return locale === 'en' ? 'Western Conference' : locale === 'pt' ? 'Conferência Oeste' : 'Conferencia Oeste';
  if (/^eastern conference$/i.test(name)) return locale === 'en' ? 'Eastern Conference' : locale === 'pt' ? 'Conferência Leste' : 'Conferencia Este';
  return name;
}

const NF: Record<RouteLocale, string> = { es: 'es-MX', pt: 'pt-BR', en: 'en-US' };
export function num(n: number, locale: RouteLocale): string {
  return n.toLocaleString(NF[locale]);
}

const NUMBER_WORDS: Record<RouteLocale, string[]> = {
  es: ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez'],
  pt: ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez'],
  en: ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'],
};

/** Small counts read better in words ("dos más que…"). */
export function countWord(n: number, locale: RouteLocale): string {
  return n >= 0 && n <= 10 ? NUMBER_WORDS[locale][n] : String(n);
}

/** "a, b y c" / "a, b e c" / "a, b and c". */
export function joinList(items: string[], locale: RouteLocale): string {
  if (items.length <= 1) return items[0] ?? '';
  const and = locale === 'es' ? ' y ' : locale === 'pt' ? ' e ' : ' and ';
  return `${items.slice(0, -1).join(', ')}${and}${items[items.length - 1]}`;
}
