import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { competitionName } from '@/lib/competitions';
import { playerPath, teamPath } from '@/lib/routes';
import { absolute, pageMetadata } from '@/lib/seo';
import { FixturesView } from '../../_components/FixturesView';
import { SquadView } from '../../_components/SquadView';
import { StatsView } from '../../_components/StatsView';
import { loadTeam, mainSeasonLabel, teamRef, type TeamCore } from '../../_lib/data';
import { loadFixturesData, loadSquadData, loadStatsData } from '../../_lib/sections';
import { loadShell, parseSub, resolveTeam, sportsTeamNode, TeamFrame, type TeamSub } from '../../_lib/shell';
import { asLocale, teamStrings, fill } from '../../_lib/strings';

// Team sub-pages (plan A4 "Equipo · subpáginas"): /plantilla, /calendario,
// /estadisticas and their pt/en spellings. One route serves the three so the
// canonical-redirect logic (bare id, renamed club, a sub-segment spelled in
// another locale's word) lives in one place.
//
// Each page indexes only when its own data is complete (non-empty squad with
// season stats, a published calendar, league statistics with games played);
// below that it still renders what there is, under noindex.
//
// ISR: first request renders, then at most every 6 hours. Squad lists and
// season summaries do not move faster than that; the calendar's results are
// one click away on the main team page (hourly) and on every match page.
export const revalidate = 21600;

export async function generateStaticParams() {
  return [];
}

type Params = { locale: string; slug: string; section: string };


function leagueFor(core: TeamCore, locale: ReturnType<typeof asLocale>): string {
  const m = core.main;
  if (!m) return '';
  return m.competition ? competitionName(m.competition, locale) : m.name;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale: raw, slug, section } = await params;
  const locale = asLocale(raw);
  const sub = parseSub(section, locale);
  if (!sub) return {};
  const core = await loadTeam(slug);
  if (!core) return {};
  const L = teamStrings(locale);
  const t = core.info.team;
  const team = t.name;
  const season = mainSeasonLabel(core);
  const path = (l: ReturnType<typeof asLocale>) => teamPath(l, teamRef(core), sub.key);
  const base = {
    locale,
    path,
    images: t.logo ? [{ url: t.logo, width: 150, height: 150, alt: t.name }] : undefined,
    appRoute: `team/${t.id}`,
  };

  if (sub.key === 'squad') {
    const d = await loadSquadData(core);
    return pageMetadata({
      ...base,
      title: fill(L.squadMetaTitle, { team, season }),
      description: fill(L.squadMetaDesc, { team, season, n: String(d.squad.length) }),
      noindex: !d.indexable,
    });
  }
  if (sub.key === 'fixtures') {
    const d = await loadFixturesData(core);
    const comps = [...new Map(d.fixtures.map((f) => [f.league.id, f.league.name])).values()];
    return pageMetadata({
      ...base,
      title: fill(L.fixturesMetaTitle, { team, season }),
      description: fill(L.fixturesMetaDesc, {
        team,
        season,
        n: String(d.fixtures.length),
        comps: comps.slice(0, 3).join(', ') || leagueFor(core, locale),
      }),
      noindex: !d.indexable,
    });
  }
  const d = await loadStatsData(core);
  return pageMetadata({
    ...base,
    title: fill(L.statsMetaTitle, { team, season }),
    description: fill(L.statsMetaDesc, {
      team,
      season,
      league: leagueFor(core, locale),
      gf: String(d.stats?.goals.for.total.total ?? 0),
      ga: String(d.stats?.goals.against.total.total ?? 0),
    }),
    noindex: !d.indexable,
  });
}

export default async function TeamSubPage({ params }: { params: Promise<Params> }) {
  const { locale: raw, slug, section } = await params;
  const locale = asLocale(raw);
  const sub = parseSub(section, locale);
  if (!sub) notFound();
  const core = await resolveTeam(slug, locale, sub);
  const s = await loadShell(core, locale);
  const L = s.L;
  const team = s.team.name;
  const season = s.seasonText ?? '';
  const key: TeamSub = sub.key;

  if (key === 'squad') {
    const data = await loadSquadData(core);
    // The squad page carries the roster as SportsTeam.athlete, each with the
    // player URL the table links to.
    const athletes = data.squad.map((p) => ({ name: p.name, url: absolute(playerPath(locale, p)) }));
    return (
      <TeamFrame s={s} active="squad" title={fill(L.squadH1, { team, season })} jsonLd={[sportsTeamNode(s, athletes)]}>
        <SquadView s={s} data={data} />
      </TeamFrame>
    );
  }

  if (key === 'fixtures') {
    const data = await loadFixturesData(core);
    return (
      <TeamFrame s={s} active="fixtures" title={fill(L.fixturesH1, { team, season })} jsonLd={[sportsTeamNode(s)]}>
        <FixturesView s={s} data={data} />
      </TeamFrame>
    );
  }

  const data = await loadStatsData(core);
  return (
    <TeamFrame s={s} active="stats" title={fill(L.statsH1, { team, season })} jsonLd={[sportsTeamNode(s)]}>
      <StatsView s={s} data={data} />
    </TeamFrame>
  );
}

