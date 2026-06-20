import type {
    APIFootballFixture,
    APIFootballStanding,
} from "@/lib/api-football.types";

const LIVE_STATUSES = new Set(["1H", "2H", "HT", "ET", "BT", "LIVE"]);
const FINISHED_STATUSES = new Set(["FT", "AET", "PEN"]);

export function isMatchLive(fixture: APIFootballFixture): boolean {
  return LIVE_STATUSES.has(fixture.fixture.status.short);
}

function isMatchFinished(fixture: APIFootballFixture): boolean {
  return FINISHED_STATUSES.has(fixture.fixture.status.short);
}

/** Drop duplicate fixtures (cache merges can repeat the same id). */
function uniqueByFixtureId(
  fixtures: APIFootballFixture[],
): APIFootballFixture[] {
  const seen = new Set<number>();
  const out: APIFootballFixture[] = [];
  for (const f of fixtures) {
    const id = f.fixture.id;
    if (id && seen.has(id)) continue;
    if (id) seen.add(id);
    out.push(f);
  }
  return out;
}

interface Tally {
  played: number;
  win: number;
  draw: number;
  lose: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

/**
 * Tally finished fixtures played *between* the teams in this table only
 * (intra-group / intra-league), so unrelated fixtures never leak in.
 */
function tallyFinished(
  teamIds: Set<number>,
  fixtures: APIFootballFixture[],
): Map<number, Tally> {
  const tally = new Map<number, Tally>();
  for (const id of teamIds) {
    tally.set(id, {
      played: 0,
      win: 0,
      draw: 0,
      lose: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
    });
  }

  for (const fx of fixtures) {
    if (!isMatchFinished(fx)) continue;
    const homeId = fx.teams.home.id;
    const awayId = fx.teams.away.id;
    if (!teamIds.has(homeId) || !teamIds.has(awayId)) continue;

    const homeGoals = fx.goals.home ?? 0;
    const awayGoals = fx.goals.away ?? 0;
    const home = tally.get(homeId)!;
    const away = tally.get(awayId)!;

    home.played += 1;
    away.played += 1;
    home.goalsFor += homeGoals;
    home.goalsAgainst += awayGoals;
    away.goalsFor += awayGoals;
    away.goalsAgainst += homeGoals;

    if (homeGoals > awayGoals) {
      home.win += 1;
      home.points += 3;
      away.lose += 1;
    } else if (homeGoals < awayGoals) {
      away.win += 1;
      away.points += 3;
      home.lose += 1;
    } else {
      home.draw += 1;
      away.draw += 1;
      home.points += 1;
      away.points += 1;
    }
  }

  return tally;
}

/**
 * Reconcile already-finished results the API standings haven't counted yet.
 *
 * API-Football recomputes its `/standings` table a few minutes after a match
 * goes FT, so a just-finished game is missing from the table while the matches
 * list (fresh `/fixtures`) already shows it as Finished. When the finished
 * fixtures we hold cover MORE games than the API table reflects (strictly ahead
 * for ≥1 team, behind for none), we rebuild every row's W/D/L/pts/GD/GF from
 * those finished fixtures. Otherwise we trust the API rows untouched — so
 * callers with partial fixture data (or none) fall back safely.
 *
 * Mutates the given rows in place; returns true when reconciliation was applied.
 */
function reconcileFinished(
  rows: LiveStandingRow[],
  fixtures: APIFootballFixture[],
): boolean {
  if (rows.length === 0) return false;
  const teamIds = new Set(rows.map((r) => r.team.id));
  const tally = tallyFinished(teamIds, fixtures);

  let strictlyAhead = false;
  for (const row of rows) {
    const t = tally.get(row.team.id);
    if (!t) return false;
    if (t.played < (row.all?.played ?? 0)) return false; // behind → trust API
    if (t.played > (row.all?.played ?? 0)) strictlyAhead = true;
  }
  if (!strictlyAhead) return false;

  for (const row of rows) {
    const t = tally.get(row.team.id)!;
    row.points = t.points;
    row.goalsDiff = t.goalsFor - t.goalsAgainst;
    row.all = {
      ...row.all,
      played: t.played,
      win: t.win,
      draw: t.draw,
      lose: t.lose,
      goals: { for: t.goalsFor, against: t.goalsAgainst },
    };
  }
  return true;
}

export interface LiveStandingRow extends APIFootballStanding {
  originalRank: number;
  liveScore?: string;
  liveResult?: "win" | "draw" | "loss";
}

/**
 * Apply a single live fixture's score to a row, mutating it in place.
 */
function applyFixtureToRow(
  row: LiveStandingRow,
  fixture: APIFootballFixture,
): void {
  const homeId = fixture.teams.home.id;
  const awayId = fixture.teams.away.id;
  const homeGoals = fixture.goals.home ?? 0;
  const awayGoals = fixture.goals.away ?? 0;
  const scoreLabel = `${homeGoals}-${awayGoals}`;

  const isHome = row.team.id === homeId;
  const isAway = row.team.id === awayId;
  if (!isHome && !isAway) return;

  const teamGoals = isHome ? homeGoals : awayGoals;
  const oppGoals = isHome ? awayGoals : homeGoals;
  const result: "win" | "draw" | "loss" =
    teamGoals > oppGoals ? "win" : teamGoals < oppGoals ? "loss" : "draw";

  row.liveScore = scoreLabel;
  row.liveResult = result;

  const extra = result === "win" ? 3 : result === "draw" ? 1 : 0;
  row.points += extra;
  row.goalsDiff += teamGoals - oppGoals;
  row.all = {
    ...row.all,
    played: row.all.played + 1,
    win: row.all.win + (result === "win" ? 1 : 0),
    draw: row.all.draw + (result === "draw" ? 1 : 0),
    lose: row.all.lose + (result === "loss" ? 1 : 0),
    goals: {
      for: row.all.goals.for + teamGoals,
      against: row.all.goals.against + oppGoals,
    },
  };
}

/**
 * Simulate updated standings by projecting one or more live fixtures
 * into the table: adds points, updates goal diff, and re-sorts.
 * Returns rows with originalRank so callers can show position change arrows.
 */
export function simulateLiveStandings(
  standings: APIFootballStanding[],
  fixtures: APIFootballFixture | APIFootballFixture[],
): LiveStandingRow[] {
  const fixtureArr = uniqueByFixtureId(
    Array.isArray(fixtures) ? fixtures : [fixtures],
  );
  const liveFixtures = fixtureArr.filter(isMatchLive);

  const simulated: LiveStandingRow[] = standings.map((s) => ({
    ...s,
    originalRank: s.rank,
    all: { ...s.all, goals: { ...s.all.goals } },
  }));

  // First fold in any finished results the API standings haven't caught up to,
  // then project live (in-progress) fixtures on top of that base.
  const reconciled = reconcileFinished(simulated, fixtureArr);

  if (liveFixtures.length === 0 && !reconciled) return simulated;

  // Apply each live fixture to matching rows
  for (const fx of liveFixtures) {
    for (const row of simulated) {
      applyFixtureToRow(row, fx);
    }
  }

  // Re-sort by points → goal diff → goals for
  simulated.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalsDiff !== a.goalsDiff) return b.goalsDiff - a.goalsDiff;
    return b.all.goals.for - a.all.goals.for;
  });

  // Update ranks
  simulated.forEach((row, i) => {
    row.rank = i + 1;
  });

  return simulated;
}

export function liveResultColor(result: "win" | "draw" | "loss"): string {
  switch (result) {
    case "win":
      return "#2ecc40";
    case "loss":
      return "#e74c3c";
    case "draw":
      return "#f1c40f";
  }
}
