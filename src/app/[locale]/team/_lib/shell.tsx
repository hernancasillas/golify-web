// What the four team pages share: resolving the request to a team (with the
// one canonical redirect), the hero data (coach, league position), the
// breadcrumb trail, the SportsTeam node and the page frame.

import type { ReactNode } from 'react';
import { notFound, permanentRedirect } from 'next/navigation';
import { getStandings, type Coach, type StandingRow, type StandingsGroup } from '@/lib/api-football';
import { competitionName, seasonLabel, type Phase } from '@/lib/competitions';
import {
  competitionPath,
  homePath,
  stadiumPath,
  subsection,
  subsectionFromSegment,
  teamPath,
  type RouteLocale,
  type SubsectionKey,
} from '@/lib/routes';
import { absolute, type Crumb, type JsonLdNode } from '@/lib/seo';
import { withUtm } from '@/lib/analytics';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { LocalTimeScript } from '@/components/LocalTime';
import { Breadcrumbs } from '@/components/blocks/Breadcrumbs';
import { JsonLd } from '@/components/JsonLd';
import { TeamHeader, type TeamTab } from '@/components/team/TeamHeader';
import { canonicalSlug, countryName, findStanding, loadCoach, loadTeam, mainSeasonLabel, teamRef, type TeamCore } from './data';
import { installLink } from '@/lib/site';
import { teamStrings, type TeamStrings, fill } from './strings';

export type TeamSub = 'squad' | 'fixtures' | 'stats';
export const TEAM_SUBS: readonly SubsectionKey[] = ['squad', 'fixtures', 'stats'];

/** Parse the sub-page segment. A spelling from another locale (…/squad on
 *  /es/) is answered by the caller with a redirect to this locale's word. */
export function parseSub(segment: string, locale: RouteLocale): { key: TeamSub; canonical: boolean } | null {
  const hit = subsectionFromSegment(segment, TEAM_SUBS);
  if (!hit) return null;
  const key = hit.key as TeamSub;
  // "calendario" is both the es and the pt word: check against this locale,
  // not against the locale the lookup happened to match first.
  return { key, canonical: subsection(key, locale) === segment };
}

/** Load the team for a page and enforce its canonical URL in one hop
 *  (bare legacy id, renamed club, wrong-locale sub-segment). */
export async function resolveTeam(slug: string, locale: RouteLocale, sub?: { key: TeamSub; canonical: boolean }): Promise<TeamCore> {
  const core = await loadTeam(slug);
  if (!core) notFound();
  if (slug !== canonicalSlug(core) || (sub && !sub.canonical)) {
    permanentRedirect(teamPath(locale, teamRef(core), sub?.key));
  }
  return core;
}

export interface TeamShell {
  core: TeamCore;
  locale: RouteLocale;
  L: TeamStrings;
  team: { id: number; name: string; logo: string };
  coach: { coach: Coach; since: string | null } | null;
  groups: StandingsGroup[];
  standing: { group: StandingsGroup; row: StandingRow } | null;
  /** Localized main-competition name, when there is one. */
  compName: string | null;
  /** Competition hub URL (covered competitions only). */
  compHub: string | null;
  /** "2026", "2026/27" — for titles. */
  seasonText: string | null;
  /** Split leagues: the tournament being played, read from the table. */
  phase: Phase | null;
  /** "Liga MX · Apertura 2026" */
  eyebrow: string | null;
}

/** Hero data. Coach and table are secondary: if either call fails the hero
 *  just shows fewer facts. */
export async function loadShell(core: TeamCore, locale: RouteLocale): Promise<TeamShell> {
  const L = teamStrings(locale);
  const t = core.info.team;
  const main = core.main;
  const [coach, groups] = await Promise.all([
    loadCoach(t.id),
    main ? getStandings(main.id, main.year) : Promise.resolve([] as StandingsGroup[]),
  ]);
  const standing = findStanding(groups, t.id);
  const comp = main?.competition ?? null;
  const phaseMatch = /\b(apertura|clausura)\b/i.exec(standing?.group.name ?? '');
  const phase = comp?.format === 'split' && phaseMatch ? (phaseMatch[1].toLowerCase() as Phase) : null;
  const compName = main ? (comp ? competitionName(comp, locale) : main.name) : null;
  const seasonText = main ? mainSeasonLabel(core) : null;
  const eyebrowSeason = main && comp ? seasonLabel(comp, { apiSeason: main.year, phase }, locale) : seasonText;
  return {
    core,
    locale,
    L,
    team: { id: t.id, name: t.name, logo: t.logo },
    coach,
    groups,
    standing,
    compName,
    compHub: main ? competitionPath(locale, main.id) : null,
    seasonText,
    phase,
    eyebrow: compName ? [compName, eyebrowSeason].filter(Boolean).join(' · ') : null,
  };
}

export function crumbs(s: TeamShell, sub?: TeamSub): Crumb[] {
  const out: Crumb[] = [{ name: s.L.home, path: homePath(s.locale) }];
  if (s.compName && s.compHub) out.push({ name: s.compName, path: s.compHub });
  out.push({ name: s.team.name, path: sub ? teamPath(s.locale, s.team) : undefined });
  if (sub) out.push({ name: s.L.tabs[sub] });
  return out;
}

export function heroFacts(s: TeamShell): { label: string; value: ReactNode }[] {
  const { info } = s.core;
  const facts: { label: string; value: ReactNode }[] = [];
  if (info.venue.name) facts.push({ label: s.L.facts.stadium, value: info.venue.name });
  if (s.coach) facts.push({ label: s.L.facts.coach, value: s.coach.coach.name });
  if (info.team.founded) facts.push({ label: s.L.facts.founded, value: info.team.founded });
  if (s.standing) {
    facts.push({
      label: s.L.facts.position,
      value: fill(s.L.positionValue, { rank: String(s.standing.row.rank), pts: String(s.standing.row.points) }),
    });
  } else if (info.team.country) {
    facts.push({ label: s.L.facts.country, value: countryName(info.team.country, s.locale) });
  }
  return facts;
}

/** schema.org SportsTeam for the page (`athletes` on the squad page). */
export function sportsTeamNode(s: TeamShell, athletes?: { name: string; url: string }[]): JsonLdNode {
  const { info, current } = s.core;
  const url = absolute(teamPath(s.locale, s.team));
  const v = info.venue;
  const members = current
    .filter((c) => c.competition)
    .map((c) => {
      const hub = competitionPath(s.locale, c.id);
      return {
        '@type': 'SportsOrganization',
        name: c.competition ? competitionName(c.competition, s.locale) : c.name,
        ...(hub ? { url: absolute(hub) } : {}),
      };
    });
  return {
    '@context': 'https://schema.org',
    '@type': 'SportsTeam',
    '@id': `${url}#team`,
    name: info.team.name,
    ...(info.team.code ? { alternateName: info.team.code } : {}),
    sport: 'Soccer',
    url,
    logo: info.team.logo,
    ...(info.team.founded ? { foundingDate: String(info.team.founded) } : {}),
    ...(v.name
      ? {
          location: {
            '@type': 'StadiumOrArena',
            name: v.name,
            ...(v.id ? { url: absolute(stadiumPath(s.locale, { id: v.id, name: v.name })) } : {}),
            ...(v.capacity ? { maximumAttendeeCapacity: v.capacity } : {}),
            address: {
              '@type': 'PostalAddress',
              ...(v.address ? { streetAddress: v.address } : {}),
              ...(v.city ? { addressLocality: v.city } : {}),
              addressCountry: info.team.country,
            },
          },
        }
      : {}),
    ...(s.coach ? { coach: { '@type': 'Person', name: s.coach.coach.name } } : {}),
    ...(members.length ? { memberOf: members } : {}),
    ...(athletes?.length ? { athlete: athletes.map((a) => ({ '@type': 'Person', name: a.name, url: a.url })) } : {}),
  };
}

/** Nav + breadcrumbs + hero + tabs + footer around a page's content. */
export function TeamFrame({
  s,
  active,
  title,
  jsonLd,
  children,
}: {
  s: TeamShell;
  active: TeamTab;
  title: string;
  jsonLd: JsonLdNode[];
  children: ReactNode;
}) {
  const sub = active === 'overview' ? undefined : active;
  const currentPath = teamPath(s.locale, s.team, sub);
  const follow = withUtm(installLink(`team/${s.team.id}`, 'web_team'), 'team', `${s.team.id}`);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd data={jsonLd} />
      <LocalTimeScript locale={s.locale} />
      <SiteNav />
      <main className="mx-auto max-w-6xl px-4 pt-4 pb-16 sm:px-8">
        <Breadcrumbs crumbs={crumbs(s, sub)} currentPath={currentPath} />
        <TeamHeader
          locale={s.locale}
          team={s.team}
          eyebrow={s.eyebrow}
          title={title}
          facts={heroFacts(s)}
          follow={{ label: fill(s.L.follow, { team: s.team.name }), href: follow, campaign: String(s.team.id) }}
          tabs={(['overview', 'fixtures', 'squad', 'stats'] as const).map((key) => ({ key, label: s.L.tabs[key] }))}
          active={active}
          navLabel={s.L.sectionsNav}
        />
        <div className="mt-6">{children}</div>
      </main>
      <SiteFooter locale={s.locale} />
    </div>
  );
}
