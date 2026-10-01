import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { searchPlayers, searchTeams } from '@/lib/api-football';
import { COMPETITIONS, competitionName } from '@/lib/competitions';
import { competitionPath, playerPath, sectionPath, teamPath, type RouteLocale } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import { slugify } from '@/lib/slug';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { DisplayHeading } from '@/components/revamp/ui';

// Dynamic on purpose (reads searchParams) and always noindex: result pages for
// arbitrary queries are thin, infinite and not worth a crawler's budget.

const STR = {
  es: { title: 'Buscar equipos, jugadores y ligas', h1: 'Buscar', ph: 'Equipo, jugador o liga', go: 'Buscar', short: 'Escribe al menos 3 letras para buscar.', none: 'No encontramos resultados para', comps: 'Ligas y torneos', teams: 'Equipos', players: 'Jugadores', desc: 'Busca equipos, jugadores y competiciones en Golify.' },
  pt: { title: 'Buscar times, jogadores e ligas', h1: 'Buscar', ph: 'Time, jogador ou liga', go: 'Buscar', short: 'Digite pelo menos 3 letras para buscar.', none: 'Não encontramos resultados para', comps: 'Ligas e torneios', teams: 'Times', players: 'Jogadores', desc: 'Busque times, jogadores e competições no Golify.' },
  en: { title: 'Search teams, players and leagues', h1: 'Search', ph: 'Team, player or league', go: 'Search', short: 'Type at least 3 letters to search.', none: 'No results for', comps: 'Leagues and cups', teams: 'Teams', players: 'Players', desc: 'Search teams, players and competitions on Golify.' },
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const l = locale as RouteLocale;
  return pageMetadata({
    locale: l,
    path: (x) => sectionPath('search', x),
    title: (STR[l] ?? STR.es).title,
    description: (STR[l] ?? STR.es).desc,
    noindex: true,
  });
}

function List({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-lg font-bold tracking-wide uppercase">{title}</h2>
      <ul className="mt-3 divide-y divide-border rounded-2xl border border-border bg-surface">{children}</ul>
    </section>
  );
}

const ROW = 'flex items-center gap-3 p-3.5 font-bold text-foreground transition-colors hover:bg-surface-2';

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const l = (locale in STR ? locale : 'es') as RouteLocale;
  const t = STR[l];
  const raw = Array.isArray(sp.q) ? sp.q[0] : sp.q;
  const q = (raw ?? '').trim().slice(0, 60);
  const ready = q.length >= 3;

  const needle = slugify(q);
  const comps = ready
    ? COMPETITIONS.filter(
        (c) =>
          slugify(competitionName(c, l)).includes(needle) ||
          slugify(c.name).includes(needle) ||
          c.slug.includes(needle),
      )
    : [];
  // Both calls are cached for a day by the fetchers; a failure just empties
  // that list instead of breaking the page.
  const [teams, players] = ready
    ? await Promise.all([searchTeams(q).catch(() => []), searchPlayers(q).catch(() => [])])
    : [[], []];
  const topTeams = teams.slice(0, 10);
  const topPlayers = players.slice(0, 10);
  const empty = ready && !comps.length && !topTeams.length && !topPlayers.length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />
      <main className="mx-auto max-w-2xl px-5 pt-2 pb-16 sm:px-8">
        <DisplayHeading as="h1">{t.h1}</DisplayHeading>
        <form action={sectionPath('search', l)} method="get" role="search" className="mt-5 flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={q}
            minLength={3}
            placeholder={t.ph}
            aria-label={t.ph}
            className="min-w-0 flex-1 rounded-full border border-border bg-surface px-4 py-3 font-semibold focus:border-primary focus:outline-none"
          />
          <button type="submit" className="rounded-full bg-primary px-5 py-3 font-bold text-primary-foreground">
            {t.go}
          </button>
        </form>

        {!ready ? <p className="mt-6 font-semibold text-muted-foreground">{t.short}</p> : null}
        {empty ? (
          <p className="mt-6 font-semibold text-muted-foreground">
            {t.none} “{q}”.
          </p>
        ) : null}

        {comps.length ? (
          <List title={t.comps}>
            {comps.map((c) => (
              <li key={c.id}>
                <Link href={competitionPath(l, c.id) ?? sectionPath('leagues', l)} className={ROW}>
                  {competitionName(c, l)}
                </Link>
              </li>
            ))}
          </List>
        ) : null}

        {topTeams.length ? (
          <List title={t.teams}>
            {topTeams.map((x) => (
              <li key={x.team.id}>
                <Link href={teamPath(l, x.team)} className={ROW}>
                  <Image src={x.team.logo} alt="" width={28} height={28} unoptimized className="h-7 w-7 object-contain" />
                  <span className="min-w-0 flex-1 truncate">{x.team.name}</span>
                  <span className="text-xs font-semibold text-muted-foreground">{x.team.country}</span>
                </Link>
              </li>
            ))}
          </List>
        ) : null}

        {topPlayers.length ? (
          <List title={t.players}>
            {topPlayers.map(({ player }) => (
              <li key={player.id}>
                <Link href={playerPath(l, player)} className={ROW}>
                  <Image src={player.photo} alt="" width={28} height={28} unoptimized className="h-7 w-7 rounded-full object-cover" />
                  <span className="min-w-0 flex-1 truncate">{player.name}</span>
                  <span className="text-xs font-semibold text-muted-foreground">{player.nationality}</span>
                </Link>
              </li>
            ))}
          </List>
        ) : null}
      </main>
      <SiteFooter locale={l} />
    </div>
  );
}
