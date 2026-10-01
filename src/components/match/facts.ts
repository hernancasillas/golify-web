// Facts derived from the fixture data by rules — the "texto condicional" of
// plan A4. Every sentence here is computed from a real field and is only
// produced when that field exists; there is no sentence that reads the same
// on two different matches unless the matches really are the same.

import type { Fixture, FixtureDetail, FixtureEvent, StandingRow } from '@/lib/api-football';
import type { RouteLocale } from '@/lib/routes';
import { minuteText } from './status';

// ---- Names ------------------------------------------------------------------

/** Player id → display name. Event names are sometimes full names from a
 *  different feed ("Owen González") while the player pages are keyed on the
 *  short form the lineups use ("O. González"); links must use the latter so
 *  they land on the canonical slug with no redirect. */
export function playerNames(f: FixtureDetail): Map<number, string> {
  const m = new Map<number, string>();
  for (const l of f.lineups) {
    for (const p of [...l.startXI, ...l.substitutes]) if (p.player.id && p.player.name) m.set(p.player.id, p.player.name);
  }
  for (const t of f.players) for (const p of t.players) if (p.player.id && p.player.name) m.set(p.player.id, p.player.name);
  return m;
}

export function nameOf(names: Map<number, string>, id: number | null, fallback: string | null): string {
  return (id != null ? names.get(id) : undefined) ?? fallback ?? '';
}

// ---- Events -------------------------------------------------------------------

export function eventSortKey(e: FixtureEvent): number {
  return e.time.elapsed * 100 + (e.time.extra ?? 0);
}

export function eventMinute(e: FixtureEvent): string {
  return minuteText(e.time.elapsed, e.time.extra);
}

export function sortedEvents(f: FixtureDetail): FixtureEvent[] {
  return [...f.events].sort((a, b) => eventSortKey(a) - eventSortKey(b));
}

export type GoalKind = 'normal' | 'penalty' | 'own';

export interface GoalItem {
  event: FixtureEvent;
  kind: GoalKind;
  /** Team the goal counts for, when the tally could be reconciled. */
  forTeam: number | null;
  /** Running score after this goal, when the tally could be reconciled. */
  score: { home: number; away: number } | null;
}

function isShootout(e: FixtureEvent): boolean {
  // Shoot-out kicks come as goal events after 120'; comments say so.
  return /penalty shootout/i.test(e.comments ?? '');
}

/** Goals in match order. The provider's `team` on an own goal is not
 *  documented one way or the other, so both readings are tried and the one
 *  that reproduces the final score wins; if neither does, no running score
 *  is shown (and no comeback claim is made from it). */
export function goalsOf(f: FixtureDetail): GoalItem[] {
  const evs = sortedEvents(f).filter(
    (e) => e.type === 'Goal' && e.detail !== 'Missed Penalty' && !isShootout(e),
  );
  const kinds = evs.map<GoalKind>((e) => (e.detail === 'Own Goal' ? 'own' : e.detail === 'Penalty' ? 'penalty' : 'normal'));
  const home = f.teams.home.id;
  const away = f.teams.away.id;
  const fh = f.goals.home;
  const fa = f.goals.away;

  const tally = (ownForEventTeam: boolean) => {
    let h = 0;
    let a = 0;
    const out: { forTeam: number; score: { home: number; away: number } }[] = [];
    evs.forEach((e, i) => {
      const other = e.team.id === home ? away : home;
      const forTeam = kinds[i] === 'own' && !ownForEventTeam ? other : e.team.id;
      if (forTeam === home) h++;
      else a++;
      out.push({ forTeam, score: { home: h, away: a } });
    });
    return h === fh && a === fa ? out : null;
  };

  const hasOwn = kinds.includes('own');
  const resolved = tally(true) ?? (hasOwn ? tally(false) : null);
  return evs.map((event, i) => ({
    event,
    kind: kinds[i],
    forTeam: resolved?.[i].forTeam ?? null,
    score: resolved?.[i].score ?? null,
  }));
}

export function redCards(f: FixtureDetail): FixtureEvent[] {
  return sortedEvents(f).filter((e) => e.type === 'Card' && /red|second yellow/i.test(e.detail));
}

export function missedPenalties(f: FixtureDetail): FixtureEvent[] {
  return sortedEvents(f).filter((e) => e.type === 'Goal' && e.detail === 'Missed Penalty' && !isShootout(e));
}

// ---- Stats ----------------------------------------------------------------

export function statValue(f: FixtureDetail, teamId: number, type: string): number | null {
  const s = f.statistics.find((x) => x.team.id === teamId)?.statistics.find((x) => x.type === type);
  if (!s || s.value == null) return null;
  const n = typeof s.value === 'number' ? s.value : parseFloat(String(s.value).replace('%', ''));
  return Number.isFinite(n) ? n : null;
}

export interface RatedPlayer {
  id: number;
  name: string;
  photo: string;
  teamId: number;
  teamName: string;
  teamLogo: string;
  rating: number;
  minutes: number | null;
  position: string | null;
  goals: number;
  assists: number;
}

export function ratedPlayers(f: FixtureDetail, names: Map<number, string>): RatedPlayer[] {
  const out: RatedPlayer[] = [];
  for (const t of f.players) {
    for (const p of t.players) {
      const s = p.statistics[0];
      const r = s?.games.rating ? parseFloat(s.games.rating) : NaN;
      if (!Number.isFinite(r) || !s.games.minutes) continue;
      out.push({
        id: p.player.id,
        name: names.get(p.player.id) ?? p.player.name,
        photo: p.player.photo,
        teamId: t.team.id,
        teamName: t.team.name,
        teamLogo: t.team.logo,
        rating: r,
        minutes: s.games.minutes,
        position: s.games.position,
        goals: s.goals.total ?? 0,
        assists: s.goals.assists ?? 0,
      });
    }
  }
  return out.sort((a, b) => b.rating - a.rating || (b.minutes ?? 0) - (a.minutes ?? 0));
}

// ---- Result helpers -----------------------------------------------------------

export type Outcome = 'W' | 'D' | 'L';

export function outcomeFor(x: Fixture, teamId: number): Outcome | null {
  const { home, away } = x.goals;
  if (home == null || away == null) return null;
  const mine = x.teams.home.id === teamId ? home : away;
  const theirs = x.teams.home.id === teamId ? away : home;
  return mine > theirs ? 'W' : mine < theirs ? 'L' : 'D';
}

export function formCounts(list: Fixture[], teamId: number) {
  let w = 0, d = 0, l = 0, gf = 0, ga = 0;
  for (const x of list) {
    const o = outcomeFor(x, teamId);
    if (!o) continue;
    if (o === 'W') w++;
    else if (o === 'D') d++;
    else l++;
    const home = x.teams.home.id === teamId;
    gf += (home ? x.goals.home : x.goals.away) ?? 0;
    ga += (home ? x.goals.away : x.goals.home) ?? 0;
  }
  return { w, d, l, gf, ga, n: w + d + l };
}

/** Length of the run at the head of a newest-first list. */
function streak(list: Fixture[], teamId: number, test: (o: Outcome) => boolean): number {
  let k = 0;
  for (const x of list) {
    const o = outcomeFor(x, teamId);
    if (!o || !test(o)) break;
    k++;
  }
  return k;
}

// ---- Localized sentence builders ---------------------------------------------

type Loc = RouteLocale;

const pct = (n: number, l: Loc) => (l === 'es' ? `${n} %` : `${n}%`);

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

function ordinal(n: number, l: Loc): string {
  if (l === 'es') return `${n}.º`;
  if (l === 'pt') return `${n}º`;
  const s = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th';
  return `${n}${s}`;
}

function listJoin(items: string[], l: Loc): string {
  if (items.length <= 1) return items.join('');
  const and = l === 'en' ? 'and' : 'e';
  const conj = l === 'es' ? 'y' : and;
  return `${items.slice(0, -1).join(', ')} ${conj} ${items.at(-1)}`;
}

const KIND_MARK: Record<Loc, Record<GoalKind, string>> = {
  es: { normal: '', penalty: ' pen.', own: ' en contra' },
  pt: { normal: '', penalty: ' pên.', own: ' contra' },
  en: { normal: '', penalty: ' pen', own: ' og' },
};

export function goalLabel(g: GoalItem, l: Loc): string {
  return `${eventMinute(g.event)}${KIND_MARK[l][g.kind]}`;
}

export interface Ctx {
  locale: Loc;
  home: string;
  away: string;
  /** "Liga MX · Jornada 10" */
  where: string;
  names: Map<number, string>;
}

/** "Goles de Toluca: Paulinho (12', 67')." — one sentence per team that
 *  scored, only when the running tally reconciles with the final score (so
 *  every goal is credited to the right side). Also answers the FAQ. */
export function scorerSentences(f: FixtureDetail, c: Ctx, goals: GoalItem[] = goalsOf(f)): string[] {
  const l = c.locale;
  if (goals.length === 0 || !goals.every((g) => g.score)) return [];
  const out: string[] = [];
  for (const [teamId, teamName] of [
    [f.teams.home.id, c.home],
    [f.teams.away.id, c.away],
  ] as const) {
    const mine = goals.filter((g) => g.forTeam === teamId);
    if (mine.length === 0) continue;
    const byPlayer = new Map<string, string[]>();
    for (const g of mine) {
      const who = nameOf(c.names, g.event.player.id, g.event.player.name);
      byPlayer.set(who, [...(byPlayer.get(who) ?? []), goalLabel(g, l)]);
    }
    const parts = [...byPlayer].map(([who, mins]) => `${who} (${mins.join(', ')})`);
    out.push(
      {
        es: `Goles de ${teamName}: ${listJoin(parts, l)}.`,
        // "do/da" depends on the club's gender in Portuguese; the colon
        // form reads naturally for every club.
        pt: `${teamName}: gols de ${listJoin(parts, l)}.`,
        en: `${teamName} goals: ${listJoin(parts, l)}.`,
      }[l],
    );
  }
  return out;
}

/** Post-match summary paragraph(s), rule-generated from the data. */
export function summarySentences(f: FixtureDetail, c: Ctx): string[] {
  const l = c.locale;
  const h = f.goals.home;
  const a = f.goals.away;
  if (h == null || a == null) return [];
  const out: string[] = [];
  const homeId = f.teams.home.id;
  const aet = f.fixture.status.short === 'AET' || f.fixture.status.short === 'PEN';
  const pen = f.score?.penalty;
  const hasPens = pen?.home != null && pen?.away != null;

  // 1. Result.
  if (h !== a) {
    const homeWon = h > a;
    const W = homeWon ? c.home : c.away;
    const L = homeWon ? c.away : c.home;
    const ws = Math.max(h, a);
    const ls = Math.min(h, a);
    const extra = aet ? { es: ' tras la prórroga', pt: ' na prorrogação', en: ' after extra time' }[l] : '';
    out.push(
      {
        es: `${W} venció ${ws}-${ls} a ${L}${extra} (${c.where}).`,
        pt: `${W} venceu ${L} por ${ws} a ${ls}${extra} (${c.where}).`,
        en: `${W} beat ${L} ${ws}-${ls}${extra} (${c.where}).`,
      }[l],
    );
  } else if (hasPens) {
    const W = pen!.home! > pen!.away! ? c.home : c.away;
    const p = `${Math.max(pen!.home!, pen!.away!)}-${Math.min(pen!.home!, pen!.away!)}`;
    out.push(
      {
        es: `${c.home} y ${c.away} empataron ${h}-${a} y ${W} se impuso ${p} en los penales (${c.where}).`,
        pt: `${c.home} e ${c.away} empataram por ${h} a ${a} e ${W} venceu nos pênaltis por ${p} (${c.where}).`,
        en: `${c.home} and ${c.away} drew ${h}-${a} and ${W} won ${p} on penalties (${c.where}).`,
      }[l],
    );
  } else {
    out.push(
      {
        es: `${c.home} y ${c.away} empataron ${h}-${a} (${c.where}).`,
        pt: `${c.home} e ${c.away} empataram por ${h} a ${a} (${c.where}).`,
        en: `${c.home} and ${c.away} drew ${h}-${a} (${c.where}).`,
      }[l],
    );
  }

  // 2. Comeback, from the reconciled running score; else the half-time score.
  const goals = goalsOf(f);
  const reconciled = goals.length > 0 && goals.every((g) => g.score);
  let comeback = false;
  if (reconciled && h !== a) {
    const winnerHome = h > a;
    let worst = 0;
    let at = { w: 0, o: 0 };
    for (const g of goals) {
      const w = winnerHome ? g.score!.home : g.score!.away;
      const o = winnerHome ? g.score!.away : g.score!.home;
      if (o - w > worst) {
        worst = o - w;
        at = { w, o };
      }
    }
    if (worst > 0) {
      comeback = true;
      const W = winnerHome ? c.home : c.away;
      out.push(
        {
          es: `${W} le dio la vuelta: llegó a ir perdiendo ${at.w}-${at.o}.`,
          pt: `${W} virou o jogo: chegou a estar perdendo por ${at.w} a ${at.o}.`,
          en: `${W} came from behind: they were ${at.w}-${at.o} down at one point.`,
        }[l],
      );
    }
  }
  const ht = f.score?.halftime;
  if (!comeback && ht?.home != null && ht?.away != null && (ht.home !== h || ht.away !== a)) {
    out.push(
      {
        es: `Al medio tiempo el marcador era ${ht.home}-${ht.away}.`,
        pt: `No intervalo, o placar era ${ht.home} a ${ht.away}.`,
        en: `It was ${ht.home}-${ht.away} at half-time.`,
      }[l],
    );
  }

  // 3. Scorers per team (only when the tally says who each goal counts for).
  if (reconciled) out.push(...scorerSentences(f, c, goals));

  // 4. Braces and hat-tricks (own goals do not count).
  const byScorer = new Map<number, { name: string; n: number }>();
  for (const g of goals) {
    if (g.kind === 'own' || g.event.player.id == null) continue;
    const id = g.event.player.id;
    const prev = byScorer.get(id);
    byScorer.set(id, { name: nameOf(c.names, id, g.event.player.name), n: (prev?.n ?? 0) + 1 });
  }
  for (const { name, n } of byScorer.values()) {
    if (n === 2) out.push({ es: `${name} hizo doblete.`, pt: `${name} marcou duas vezes.`, en: `${name} scored twice.` }[l]);
    else if (n === 3) out.push({ es: `${name} firmó un triplete.`, pt: `${name} fez um hat-trick.`, en: `${name} scored a hat-trick.` }[l]);
    else if (n > 3) out.push({ es: `${name} marcó ${n} goles.`, pt: `${name} marcou ${n} gols.`, en: `${name} scored ${n} goals.` }[l]);
  }

  // 5. Red cards and missed penalties.
  for (const e of redCards(f)) {
    const who = nameOf(c.names, e.player.id, e.player.name);
    const m = eventMinute(e);
    out.push(
      {
        es: `${who} (${e.team.name}) fue expulsado (${m}).`,
        pt: `${who} (${e.team.name}) foi expulso (${m}).`,
        en: `${who} (${e.team.name}) was sent off (${m}).`,
      }[l],
    );
  }
  for (const e of missedPenalties(f)) {
    const who = nameOf(c.names, e.player.id, e.player.name);
    const m = eventMinute(e);
    out.push({ es: `${who} falló un penal (${m}).`, pt: `${who} perdeu um pênalti (${m}).`, en: `${who} missed a penalty (${m}).` }[l]);
  }

  // 6. Possession vs shots.
  const ph = statValue(f, homeId, 'Ball Possession');
  const pa = statValue(f, f.teams.away.id, 'Ball Possession');
  const sh = statValue(f, homeId, 'Total Shots');
  const sa = statValue(f, f.teams.away.id, 'Total Shots');
  if (ph != null && pa != null && ph !== pa) {
    const A = ph > pa ? c.home : c.away;
    const p = Math.max(ph, pa);
    if (sh != null && sa != null && sh !== sa) {
      const B = sh > sa ? c.home : c.away;
      const s1 = Math.max(sh, sa);
      const s2 = Math.min(sh, sa);
      out.push(
        A === B
          ? {
              es: `${A} dominó la posesión (${pct(p, l)}) y los tiros (${s1} contra ${s2}).`,
              pt: `${A} dominou a posse (${pct(p, l)}) e as finalizações (${s1} a ${s2}).`,
              en: `${A} dominated possession (${pct(p, l)}) and shots (${s1} to ${s2}).`,
            }[l]
          : {
              es: `${A} tuvo más la pelota (${pct(p, l)}), pero ${B} remató más: ${s1} tiros contra ${s2}.`,
              pt: `${A} teve mais a bola (${pct(p, l)}), mas ${B} finalizou mais: ${s1} a ${s2}.`,
              en: `${A} had more of the ball (${pct(p, l)}), but ${B} took more shots: ${s1} to ${s2}.`,
            }[l],
      );
    } else {
      out.push(
        {
          es: `${A} tuvo la pelota el ${pct(p, l)} del tiempo.`,
          pt: `${A} ficou com a bola ${pct(p, l)} do tempo.`,
          en: `${A} had ${pct(p, l)} of possession.`,
        }[l],
      );
    }
  }

  // 7. Clean sheets (a 0-0 already says it).
  if (!(h === 0 && a === 0)) {
    for (const [conceded, team] of [
      [a, c.home],
      [h, c.away],
    ] as const) {
      if (conceded === 0) {
        out.push({ es: `${team} mantuvo su portería en cero.`, pt: `${team} não sofreu gols.`, en: `${team} kept a clean sheet.` }[l]);
      }
    }
  }
  return out;
}

/** "Así llegan" — pre-match context from standings, form and head-to-head. */
export function previewSentences(
  f: FixtureDetail,
  c: Ctx,
  data: { rows: { home?: StandingRow; away?: StandingRow }; formHome: Fixture[]; formAway: Fixture[]; h2h: Fixture[] },
): string[] {
  const l = c.locale;
  const out: string[] = [];
  const { home: rh, away: ra } = data.rows;

  if (rh && ra) {
    const gap = Math.abs(rh.points - ra.points);
    out.push(
      {
        es: `${c.home} llega ${ordinal(rh.rank, l)} con ${plural(rh.points, 'punto', 'puntos')} y ${c.away} ${ordinal(ra.rank, l)} con ${plural(ra.points, 'punto', 'puntos')}.`,
        pt: `${c.home} chega em ${ordinal(rh.rank, l)} com ${plural(rh.points, 'ponto', 'pontos')} e ${c.away} em ${ordinal(ra.rank, l)} com ${plural(ra.points, 'ponto', 'pontos')}.`,
        en: `${c.home} come in ${ordinal(rh.rank, l)} on ${plural(rh.points, 'point', 'points')}; ${c.away} sit ${ordinal(ra.rank, l)} on ${plural(ra.points, 'point', 'points')}.`,
      }[l],
    );
    if (gap === 0) {
      out.push({ es: 'Están empatados en puntos.', pt: 'Estão empatados em pontos.', en: 'They are level on points.' }[l]);
    }
  }

  for (const [list, teamId, name] of [
    [data.formHome, f.teams.home.id, c.home],
    [data.formAway, f.teams.away.id, c.away],
  ] as const) {
    const k = formCounts(list, teamId);
    if (k.n === 0) continue;
    const wins = streak(list, teamId, (o) => o === 'W');
    const winless = streak(list, teamId, (o) => o !== 'W');
    const unbeaten = streak(list, teamId, (o) => o !== 'L');
    if (wins >= 3) {
      out.push({ es: `${name} viene de ${wins} victorias seguidas.`, pt: `${name} vem de ${wins} vitórias seguidas.`, en: `${name} have won ${wins} in a row.` }[l]);
    } else if (winless >= 3) {
      out.push({ es: `${name} no gana desde hace ${winless} partidos.`, pt: `${name} não vence há ${winless} jogos.`, en: `${name} are without a win in ${winless} games.` }[l]);
    } else if (unbeaten >= 4) {
      out.push({ es: `${name} suma ${unbeaten} partidos sin perder.`, pt: `${name} está há ${unbeaten} jogos sem perder.`, en: `${name} are unbeaten in ${unbeaten}.` }[l]);
    }
    out.push(
      {
        es: `En sus últimos ${k.n} partidos, ${name} suma ${plural(k.w, 'victoria', 'victorias')}, ${plural(k.d, 'empate', 'empates')} y ${plural(k.l, 'derrota', 'derrotas')} (${k.gf} goles a favor, ${k.ga} en contra).`,
        pt: `Nos últimos ${k.n} jogos, ${name} soma ${plural(k.w, 'vitória', 'vitórias')}, ${plural(k.d, 'empate', 'empates')} e ${plural(k.l, 'derrota', 'derrotas')} (${k.gf} gols marcados, ${k.ga} sofridos).`,
        en: `In their last ${k.n} games, ${name} have ${plural(k.w, 'win', 'wins')}, ${plural(k.d, 'draw', 'draws')} and ${plural(k.l, 'loss', 'losses')} (${k.gf} scored, ${k.ga} conceded).`,
      }[l],
    );
  }

  if (data.h2h.length > 0) {
    const k = formCounts(data.h2h, f.teams.home.id);
    out.push(
      {
        es: `${k.n === 1 ? 'En el único enfrentamiento reciente' : `En los últimos ${k.n} enfrentamientos`}, ${c.home} ganó ${k.w}, ${c.away} ${k.l} y ${k.d === 1 ? 'hubo 1 empate' : `hubo ${k.d} empates`}.`,
        pt: `${k.n === 1 ? 'No único confronto recente' : `Nos últimos ${k.n} confrontos`}, ${c.home} venceu ${k.w}, ${c.away} ${k.l} e ${plural(k.d, 'empate', 'empates')}.`,
        en: `In the last ${plural(k.n, 'meeting', 'meetings')}, ${c.home} won ${k.w}, ${c.away} ${k.l}, with ${plural(k.d, 'draw', 'draws')}.`,
      }[l],
    );
  }
  return out;
}
