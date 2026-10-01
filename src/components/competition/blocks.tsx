// Composite blocks used by more than one competition template.

import Link from 'next/link';
import type { Fixture } from '@/lib/api-football';
import type { Competition } from '@/lib/competitions';
import { competitionPath, poolPath, transfersPath, whereToWatchPath, type RouteLocale } from '@/lib/routes';
import { absolute, type JsonLdNode } from '@/lib/seo';
import { cn } from '@/lib/utils';
import { roundName, type RoundGroup, type SeasonCtx } from './data';
import { fmt, ui } from './i18n';
import { LinkList, SectionTitle } from './ui';

const NAV = {
  es: { title: 'Jornadas', stages: 'Fases' },
  pt: { title: 'Rodadas', stages: 'Fases' },
  en: { title: 'Matchdays', stages: 'Stages' },
} as const;

/** Every round of the season: numbered ones link to their round page,
 *  stages (cuartos, final…) to their block on the calendar page. */
export function RoundNav({
  ctx,
  locale,
  active,
}: {
  ctx: SeasonCtx;
  locale: RouteLocale;
  active?: number | null;
}) {
  const t = NAV[locale];
  const numbered = ctx.rounds.filter((r) => r.number != null);
  const stages = ctx.rounds.filter((r) => r.number == null);
  if (numbered.length === 0 && stages.length === 0) return null;
  const calendar = competitionPath(locale, ctx.comp.id, ctx.slug, 'fixtures')!;
  return (
    <nav aria-label={numbered.length > 0 ? t.title : t.stages} className="mt-10">
      <SectionTitle>{numbered.length > 0 ? t.title : t.stages}</SectionTitle>
      {numbered.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {numbered.map((r) => (
            <li key={r.raw}>
              <Link
                href={competitionPath(locale, ctx.comp.id, ctx.slug, { round: r.number! })!}
                aria-current={active === r.number ? 'page' : undefined}
                aria-label={roundName(r, locale, ctx.comp)}
                className={cn(
                  'flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-sm font-bold tabular-nums transition-colors',
                  active === r.number
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-surface text-foreground hover:border-primary/50',
                )}
              >
                {r.number}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      {stages.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {stages.map((r) => (
            <li key={r.raw}>
              <Link
                href={`${calendar}#${r.anchor}`}
                className="block rounded-lg border border-border bg-surface px-3 py-2 text-sm font-bold hover:border-primary/50"
              >
                {roundName(r, locale, ctx.comp)}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </nav>
  );
}

const MORE = {
  es: { title: 'Más de {name}', watch: 'Dónde ver {name}', transfers: 'Fichajes de {name}', pool: 'Quiniela de {name}', hub: 'Todo sobre {name}' },
  pt: { title: 'Mais do {name}', watch: 'Onde assistir {name}', transfers: 'Transferências do {name}', pool: 'Bolão do {name}', hub: 'Tudo sobre o {name}' },
  en: { title: 'More {name}', watch: 'Where to watch {name}', transfers: '{name} transfers', pool: '{name} pool', hub: 'All about {name}' },
} as const;

export function MoreLinks({ ctx, locale, name }: { ctx: SeasonCtx; locale: RouteLocale; name: string }) {
  const t = MORE[locale];
  const links = [
    { href: competitionPath(locale, ctx.comp.id), label: fmt(t.hub, { name }) },
    { href: whereToWatchPath(locale, ctx.comp.id), label: fmt(t.watch, { name }) },
    { href: transfersPath(locale, ctx.comp.id), label: fmt(t.transfers, { name }) },
    ctx.isCurrent ? { href: poolPath(locale, ctx.comp.id), label: fmt(t.pool, { name }) } : null,
  ].filter((l): l is { href: string; label: string } => !!l && !!l.href);
  return <LinkList title={fmt(t.title, { name })} links={links} />;
}

/** SportsEvent for a season/tournament. Dates come from the phase's own
 *  fixtures for split leagues (the API season spans both tournaments), from
 *  the provider's season dates otherwise. */
export function seasonEventNode(
  ctx: SeasonCtx,
  locale: RouteLocale,
  name: string,
  path: string,
  teams: { name: string; url: string }[],
): JsonLdNode {
  const first = ctx.fixtures[0]?.fixture.date;
  const last = ctx.fixtures.at(-1)?.fixture.date;
  const split = !!ctx.ref.phase;
  const country = ctx.info.country.name;
  return {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    '@id': `${absolute(path)}#season`,
    name,
    sport: 'Soccer',
    startDate: split ? first?.slice(0, 10) : ctx.meta.start,
    endDate: split ? last?.slice(0, 10) : ctx.meta.end,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location:
      country && country !== 'World'
        ? { '@type': 'Place', name: country, address: { '@type': 'PostalAddress', addressCountry: ctx.info.country.code ?? country } }
        : { '@type': 'Place', name: ctx.info.league.name },
    organizer: { '@type': 'SportsOrganization', name: ctx.info.league.name, url: absolute(competitionPath(locale, ctx.comp.id)!) },
    image: ctx.info.league.logo,
    url: absolute(path),
    ...(teams.length > 0 ? { competitor: teams.map((t) => ({ '@type': 'SportsTeam', name: t.name, url: t.url })) } : {}),
  };
}

export function teamsOf(fixtures: Fixture[]): { id: number; name: string; logo: string }[] {
  const m = new Map<number, { id: number; name: string; logo: string }>();
  for (const f of fixtures) {
    for (const s of ['home', 'away'] as const) {
      const t = f.teams[s];
      if (!m.has(t.id)) m.set(t.id, { id: t.id, name: t.name, logo: t.logo });
    }
  }
  return [...m.values()];
}

export function roundText(r: RoundGroup | null, locale: RouteLocale, comp: Competition): string {
  return r ? roundName(r, locale, comp) : ui(locale).tabs.fixtures;
}
