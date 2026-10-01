// Row models of the tabular downloads. The page's HTML table, the PDF, the CSV
// and the XLSX are all drawn from these rows, so they always agree.

import { fixturePhase, type Fixture } from '@/lib/api-football';
import { competitionById, roundLabel } from '@/lib/competitions';
import type { RouteLocale } from '@/lib/routes';
import { dateCell, kickoffCell, printZones, type PrintZone } from './zones';
import type { Download } from './resolve';

export interface MatchRow {
  fixture: Fixture;
  date: string;
  /** One time per print zone, same order as `zones`. */
  times: string[];
  home: string;
  away: string;
  venue: string;
  /** "2-1" when finished, else "". */
  result: string;
  /** Calendar only: competition + round, and whether the team plays at home. */
  context?: string;
  side?: 'home' | 'away';
}

export interface MatchTable {
  zones: PrintZone[];
  rows: MatchRow[];
}

function result(f: Fixture): string {
  return fixturePhase(f) === 'finished' && f.goals.home != null && f.goals.away != null ? `${f.goals.home}-${f.goals.away}` : '';
}

function row(f: Fixture, zones: PrintZone[], l: RouteLocale): MatchRow {
  return {
    fixture: f,
    date: dateCell(f.fixture.date, zones[0], l),
    times: zones.map((z) => kickoffCell(f.fixture.date, f.fixture.status.short, z, l)),
    home: f.teams.home.name,
    away: f.teams.away.name,
    venue: [f.fixture.venue.name, f.fixture.venue.city].filter(Boolean).join(', '),
    result: result(f),
  };
}

export function matchTable(d: Download, l: RouteLocale): MatchTable | null {
  if (d.kind === 'quiniela') {
    const zones = printZones(l, d.q.season.competition.market);
    return { zones, rows: d.q.fixtures.map((f) => row(f, zones, l)) };
  }
  if (d.kind === 'calendar') {
    const zones = printZones(l, d.cal.competition.market);
    return {
      zones,
      rows: d.cal.fixtures.map((f) => {
        const c = competitionById(f.league.id);
        return {
          ...row(f, zones, l),
          context: `${c ? c.name : f.league.name} · ${roundLabel(f.league.round, l, c)}`,
          side: f.teams.home.id === d.cal.team.id ? 'home' : 'away',
        };
      }),
    };
  }
  return null;
}

/** Upcoming fixtures of a league season for the poster (next 2 rounds at most). */
export function posterFixtures(d: Extract<Download, { kind: 'poster' }>): Fixture[] {
  const s = d.season;
  const rounds = [s.currentRound, s.nextRound].filter((n): n is number => n != null);
  const fx = rounds.flatMap((n) => s.rounds.get(n) ?? []);
  if (fx.length) return fx;
  return s.phaseFixtures.filter((f) => fixturePhase(f) === 'scheduled').slice(0, 20);
}

export const COLS = {
  es: { date: 'Fecha', home: 'Local', away: 'Visitante', venue: 'Estadio', pick: 'Tu pronóstico', score: 'Marcador', result: 'Resultado', comp: 'Torneo', rival: 'Rival', side: 'Local/Visita', homeSide: 'Local', awaySide: 'Visita', name: 'Nombre', points: 'Puntos', draw: 'E' },
  pt: { date: 'Data', home: 'Mandante', away: 'Visitante', venue: 'Estádio', pick: 'Seu palpite', score: 'Placar', result: 'Resultado', comp: 'Torneio', rival: 'Adversário', side: 'Casa/Fora', homeSide: 'Casa', awaySide: 'Fora', name: 'Nome', points: 'Pontos', draw: 'E' },
  en: { date: 'Date', home: 'Home', away: 'Away', venue: 'Stadium', pick: 'Your pick', score: 'Score', result: 'Result', comp: 'Competition', rival: 'Opponent', side: 'Home/Away', homeSide: 'Home', awaySide: 'Away', name: 'Name', points: 'Points', draw: 'D' },
} as const;

/** Sticker sections in album order (country as stored in the catalogue). */
export function stickerSections<T extends { country: string; number: number }>(stickers: T[]): [string, T[]][] {
  const by = new Map<string, T[]>();
  for (const s of stickers) {
    const list = by.get(s.country) ?? [];
    list.push(s);
    by.set(s.country, list);
  }
  for (const list of by.values()) list.sort((a, b) => a.number - b.number);
  return [...by.entries()];
}

const STAGE: Record<string, Record<RouteLocale, string>> = {
  'knockout round play-offs': { es: 'Playoffs', pt: 'Playoffs', en: 'Play-offs' },
  'round of 32': { es: 'Dieciseisavos', pt: '16 avos', en: 'Round of 32' },
  'round of 16': { es: 'Octavos', pt: 'Oitavas', en: 'Round of 16' },
  'quarter-finals': { es: 'Cuartos', pt: 'Quartas', en: 'Quarter-finals' },
  'semi-finals': { es: 'Semifinales', pt: 'Semifinais', en: 'Semi-finals' },
  final: { es: 'Final', pt: 'Final', en: 'Final' },
};

export function stageName(stage: string, l: RouteLocale): string {
  return STAGE[stage]?.[l] ?? stage;
}
