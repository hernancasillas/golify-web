// Data + indexing threshold of each team sub-page (plan A4 "Equipo ·
// subpáginas": indexable only with complete season data). Called from both
// generateMetadata and the page; Next dedupes the fetches within a render.
//
// Each sub-page's primary list is loaded strictly: a provider failure throws
// (ISR keeps the previous copy) instead of publishing an empty squad or an
// empty calendar under noindex.

import { localizeFixtures } from '@/lib/nations';
import { getTeamPlayers, type Fixture, type PlayerWithStats, type SquadPlayer } from '@/lib/api-football';
import { loadSeasonFixtures, loadSquad, loadTeamStats, type TeamCore, type TeamSeasonStats } from './data';

export interface SquadData {
  squad: SquadPlayer[];
  players: PlayerWithStats[];
  /** For the formation card (most used shape in the main league). */
  stats: TeamSeasonStats | null;
  indexable: boolean;
}

export async function loadSquadData(core: TeamCore): Promise<SquadData> {
  const id = core.info.team.id;
  const main = core.main;
  const [squad, players, stats] = await Promise.all([
    loadSquad(id, true),
    core.season ? getTeamPlayers(id, core.season) : Promise.resolve([] as PlayerWithStats[]),
    main ? loadTeamStats(id, main.id, main.year) : Promise.resolve(null),
  ]);
  // Without season stats the table would be a list of zeros that are not
  // true zeros: the page renders the squad without those columns, noindex.
  return { squad, players, stats, indexable: core.playsCovered && squad.length > 0 && players.length > 0 };
}

export interface FixturesData {
  fixtures: Fixture[];
  indexable: boolean;
}

export async function loadFixturesData(core: TeamCore): Promise<FixturesData> {
  const fixtures = localizeFixtures(core.season ? await loadSeasonFixtures(core.info.team.id, core.season, true) : [], core.locale);
  return { fixtures, indexable: core.playsCovered && fixtures.length > 0 };
}

export interface StatsData {
  stats: TeamSeasonStats | null;
  players: PlayerWithStats[];
  indexable: boolean;
}

export async function loadStatsData(core: TeamCore): Promise<StatsData> {
  const id = core.info.team.id;
  const main = core.main;
  if (!main) return { stats: null, players: [], indexable: false };
  const [stats, players] = await Promise.all([
    loadTeamStats(id, main.id, main.year, true),
    getTeamPlayers(id, main.year),
  ]);
  const played = stats?.fixtures.played.total ?? 0;
  return { stats, players, indexable: core.playsCovered && !!main.competition && played > 0 };
}
