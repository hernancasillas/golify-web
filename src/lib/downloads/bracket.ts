// Knockout bracket from a season's fixture list (no extra API calls).
//
// Two modes, and the page says which one it is showing:
//   real        — the knockout draw exists: ties come from the provider's
//                 fixtures, later rounds are blank slots to fill in.
//   projection  — the regular season is still running: "si el torneo
//                 terminara hoy", the current top of the table paired by
//                 position (1.º vs último clasificado…). The number of places
//                 is read from the league's last knockout stage in the data,
//                 never assumed.

import { fixturePhase, type Fixture, type StandingRow, type TeamRef } from '@/lib/api-football';
import { parseRound, type Phase } from '@/lib/competitions';

/** Main knockout stages in order (lower-case API stage names). */
export const MAIN_STAGES = [
  'knockout round play-offs',
  'round of 32',
  'round of 16',
  'quarter-finals',
  'semi-finals',
  'final',
] as const;

const PLAY_IN_STAGES = ['play-in semi-finals', 'play-in final'];

const TIES_PER_STAGE: Record<string, number> = {
  'knockout round play-offs': 8,
  'round of 32': 16,
  'round of 16': 8,
  'quarter-finals': 4,
  'semi-finals': 2,
  final: 1,
};

export interface Tie {
  home: TeamRef | null;
  away: TeamRef | null;
  legs: Fixture[];
  /** Goals over all legs, when every leg is finished. */
  aggregate: { home: number; away: number } | null;
  winnerId: number | null;
}

export interface KoRound {
  /** Lower-case API stage ("quarter-finals"). */
  stage: string;
  /** API round string of the first fixture, for labels ("Apertura - Quarter-finals"). */
  round: string | null;
  ties: Tie[];
  /** Ties the stage has in total (blank ones included). */
  slots: number;
}

export interface Bracket {
  mode: 'real' | 'projection';
  rounds: KoRound[];
  playIn: KoRound | null;
  /** Projection only: seeds shown, in table order. */
  seeds: StandingRow[];
  /** Projection only: the previous knockout stage of this league had a play-in. */
  previousHadPlayIn: boolean;
}

function stageOf(f: Fixture): string {
  return parseRound(f.league.round).stage.toLowerCase();
}

function inPhase(f: Fixture, phase: Phase | null): boolean {
  return phase === null || parseRound(f.league.round).phase === phase;
}

function buildTies(fixtures: Fixture[], later: Fixture[]): Tie[] {
  const byPair = new Map<string, Fixture[]>();
  for (const f of fixtures) {
    const key = [f.teams.home.id, f.teams.away.id].sort((a, b) => a - b).join('-');
    const list = byPair.get(key) ?? [];
    list.push(f);
    byPair.set(key, list);
  }
  const laterTeams = new Set(later.flatMap((f) => [f.teams.home.id, f.teams.away.id]));
  const ties: Tie[] = [];
  for (const legs of byPair.values()) {
    legs.sort((a, b) => a.fixture.date.localeCompare(b.fixture.date));
    const first = legs[0];
    const home = first.teams.home;
    const away = first.teams.away;
    const done = legs.every((l) => fixturePhase(l) === 'finished');
    let aggregate: Tie['aggregate'] = null;
    if (done) {
      aggregate = { home: 0, away: 0 };
      for (const l of legs) {
        const h = l.goals.home ?? 0;
        const a = l.goals.away ?? 0;
        if (l.teams.home.id === home.id) {
          aggregate.home += h;
          aggregate.away += a;
        } else {
          aggregate.home += a;
          aggregate.away += h;
        }
      }
    }
    let winnerId: number | null = null;
    if (laterTeams.has(home.id) && !laterTeams.has(away.id)) winnerId = home.id;
    else if (laterTeams.has(away.id) && !laterTeams.has(home.id)) winnerId = away.id;
    else if (done && aggregate) {
      if (aggregate.home !== aggregate.away) winnerId = aggregate.home > aggregate.away ? home.id : away.id;
      else {
        // Level on aggregate: the provider flags the winner of the deciding leg
        // (penalties, away goals or table position, whatever the rule was).
        const last = legs[legs.length - 1];
        if (last.teams.home.winner) winnerId = last.teams.home.id;
        else if (last.teams.away.winner) winnerId = last.teams.away.id;
      }
    }
    ties.push({ home: { id: home.id, name: home.name, logo: home.logo }, away: { id: away.id, name: away.name, logo: away.logo }, legs, aggregate, winnerId });
  }
  return ties.sort((a, b) => a.legs[0].fixture.date.localeCompare(b.legs[0].fixture.date));
}

/** Knockout stages present in a phase's fixtures. */
export function knockoutStagesIn(fixtures: Fixture[], phase: Phase | null): string[] {
  const present = new Set(fixtures.filter((f) => inPhase(f, phase)).map(stageOf));
  return MAIN_STAGES.filter((s) => present.has(s));
}

export function hasPlayIn(fixtures: Fixture[], phase: Phase | null): boolean {
  return fixtures.some((f) => inPhase(f, phase) && PLAY_IN_STAGES.includes(stageOf(f)));
}

/** The real bracket of a phase, or null when no knockout fixture exists yet. */
export function realBracket(fixtures: Fixture[], phase: Phase | null): Bracket | null {
  const phaseFx = fixtures.filter((f) => inPhase(f, phase));
  const present = knockoutStagesIn(phaseFx, null);
  if (present.length === 0) return null;
  const startIdx = MAIN_STAGES.indexOf(present[0] as (typeof MAIN_STAGES)[number]);
  const stages = MAIN_STAGES.slice(startIdx);
  const byStage = new Map<string, Fixture[]>();
  for (const f of phaseFx) {
    const s = stageOf(f);
    if (!(stages as readonly string[]).includes(s) && !PLAY_IN_STAGES.includes(s)) continue;
    const list = byStage.get(s) ?? [];
    list.push(f);
    byStage.set(s, list);
  }

  const rounds: KoRound[] = stages.map((stage, i) => {
    const fx = byStage.get(stage) ?? [];
    const later = stages.slice(i + 1).flatMap((s) => byStage.get(s) ?? []);
    const ties = buildTies(fx, later);
    return { stage, round: fx[0]?.league.round ?? null, ties, slots: Math.max(TIES_PER_STAGE[stage] ?? ties.length, ties.length) };
  });

  // Order each stage by where its winners go next, so the columns read as a
  // tree wherever the draw is already known.
  for (let i = rounds.length - 2; i >= 0; i--) {
    const next = rounds[i + 1].ties;
    if (next.length === 0) continue;
    const pos = (t: Tie) => {
      const idx = next.findIndex((n) =>
        [n.home?.id, n.away?.id].some((id) => id != null && (id === t.home?.id || id === t.away?.id)),
      );
      return idx < 0 ? Number.MAX_SAFE_INTEGER : idx;
    };
    rounds[i].ties.sort((a, b) => pos(a) - pos(b) || a.legs[0].fixture.date.localeCompare(b.legs[0].fixture.date));
  }

  const playInFx = PLAY_IN_STAGES.flatMap((s) => byStage.get(s) ?? []);
  const playIn: KoRound | null = playInFx.length
    ? { stage: 'play-in', round: playInFx[0].league.round, ties: buildTies(playInFx, phaseFx.filter((f) => stageOf(f) === present[0])), slots: 0 }
    : null;
  if (playIn) playIn.slots = playIn.ties.length;

  return { mode: 'real', rounds, playIn, seeds: [], previousHadPlayIn: false };
}

/** "If the season ended today": top of a single table, paired by position. */
export function projectedBracket(
  table: StandingRow[],
  firstStage: string,
  previousHadPlayIn: boolean,
): Bracket | null {
  const ties0 = TIES_PER_STAGE[firstStage];
  if (!ties0 || firstStage === 'knockout round play-offs') return null;
  const places = ties0 * 2;
  if (table.length < places) return null;
  const seeds = [...table].sort((a, b) => a.rank - b.rank).slice(0, places);
  const first: Tie[] = [];
  for (let i = 0; i < ties0; i++) {
    const hi = seeds[i];
    const lo = seeds[places - 1 - i];
    first.push({ home: hi.team, away: lo.team, legs: [], aggregate: null, winnerId: null });
  }
  const startIdx = MAIN_STAGES.indexOf(firstStage as (typeof MAIN_STAGES)[number]);
  const rounds: KoRound[] = MAIN_STAGES.slice(startIdx).map((stage, i) => ({
    stage,
    round: null,
    ties: i === 0 ? first : [],
    slots: TIES_PER_STAGE[stage],
  }));
  return { mode: 'projection', rounds, playIn: null, seeds, previousHadPlayIn };
}
