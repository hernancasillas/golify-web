import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { fcPath, homePath, playerPath, sectionPath, type RouteLocale } from '@/lib/routes';
import { idFromSlug, withId } from '@/lib/slug';
import { pageMetadata } from '@/lib/seo';
import { Breadcrumbs } from '@/components/blocks/Breadcrumbs';
import { FaqSection } from '@/components/blocks/FaqSection';
import { AdSlot } from '@/components/ads/AdSlot';
import { AppCard, Card, Kicker, LinkList, PageShell, SectionTitle, TwoColumn } from '@/components/watch/ui';
import { asLocale, fill, plural } from '@/components/watch/i18n';
import {
  fcDisplayName,
  findRealPlayer,
  getFcGame,
  getFcPlayer,
  getMemberships,
  getSlugSiblings,
  getTeammates,
  type FcMembership,
  type FcPlayerRow,
} from '@/components/watch/data/fc';
import { eurCompact, nationalityLabel, positionCode, positionList, positionName } from '@/components/watch/data/fc-labels';
import { listJoin } from '@/components/watch/data/watch';

// EA FC rating page (plan A4 "EA FC /es/fc/{jugador}"): the card from our
// own Supabase catalog plus a link to the real footballer's page, but only
// when the match is unambiguous (see findRealPlayer).
//
// EA ships several cards of one footballer (icons, heroes) under separate
// ids that share a slug. The best-rated card is the one indexed; the others
// render normally but say noindex and point to it, so the index gets one
// page per footballer instead of near-duplicates.
//
// The catalog has no per-attribute ratings (pace, shooting…), so the page
// shows none rather than inventing them.

export async function generateStaticParams() {
  return [];
}
export const revalidate = 86400;

type Params = { locale: string; slug: string };

const STR = {
  es: {
    home: 'Inicio',
    kicker: 'Rating {game}',
    overall: 'Media',
    potential: 'Potencial',
    age: 'Edad',
    years: '{n} años',
    positions: 'Posiciones',
    nationality: 'Nacionalidad',
    club: 'Club',
    national: 'Selección',
    number: 'Dorsal',
    contract: 'Contrato hasta',
    loaned: 'Préstamo',
    yes: 'Sí',
    value: 'Valor en el juego',
    wage: 'Salario semanal en el juego',
    card: 'Ficha en {game}',
    summary: '{name} tiene {overall} de media en {game}.',
    summaryPos: 'Juega de {pos}.',
    summaryClub: 'En el juego está en {club}.',
    best: 'Tiene la mejor media de {club} en {game}.',
    bestTie: 'Comparte la mejor media de {club} en {game}.',
    growth: 'Su potencial es {p}: puede subir {d} {points}.',
    ceiling: 'Su potencial ({p}) es igual a su media actual.',
    real: 'Estadísticas reales',
    realLink: 'Ver partidos, goles y temporadas de {name}',
    variant: 'Esta es una de las cartas de {name} en {game}. La de mejor media es:',
    teammates: 'Compañeros en {club}',
    faq: 'Preguntas frecuentes',
    qOverall: '¿Qué media tiene {name} en {game}?',
    aOverall: '{name} tiene {overall} de media en {game}, con un potencial de {potential}.',
    aOverallNoPot: '{name} tiene {overall} de media en {game}.',
    qPos: '¿En qué posición juega {name} en {game}?',
    aPos: '{name} juega de {list} en {game}.',
    qClub: '¿En qué equipo juega {name} en {game}?',
    aClub: 'En {game}, {name} juega en {club}.',
    qValue: '¿Cuánto vale {name} en {game}?',
    aValue: 'En el modo carrera de {game}, {name} tiene un valor de {value}.',
    disclaimer:
      'Golify no está afiliado a EA Sports ni a Electronic Arts. EA Sports FC es marca de Electronic Arts; los ratings provienen de la base de datos del juego.',
    top: 'Mejores ratings de {game}',
    more: 'Más de {game}',
    point: 'punto',
    points: 'puntos',
    appKicker: 'App Golify',
    appTitle: 'Arma tu once',
    appBody: 'Explora el catálogo completo de {game} y sigue a los cracks en la vida real, en vivo, en la app Golify.',
    ios: 'Descárgala en App Store',
    android: 'Disponible en Google Play',
    metaTitle: '{name}: rating {game}, media y cartas',
    metaDesc: '{name} en {game}: {overall} de media{pos}{club}. Potencial, edad, nacionalidad, valor y salario en el juego.',
  },
  pt: {
    home: 'Início',
    kicker: 'Rating {game}',
    overall: 'Overall',
    potential: 'Potencial',
    age: 'Idade',
    years: '{n} anos',
    positions: 'Posições',
    nationality: 'Nacionalidade',
    club: 'Clube',
    national: 'Seleção',
    number: 'Camisa',
    contract: 'Contrato até',
    loaned: 'Empréstimo',
    yes: 'Sim',
    value: 'Valor no jogo',
    wage: 'Salário semanal no jogo',
    card: 'Ficha no {game}',
    summary: '{name} tem {overall} de overall no {game}.',
    summaryPos: 'Joga como {pos}.',
    summaryClub: 'Clube no jogo: {club}.',
    best: 'Tem o maior overall do elenco no {game} ({club}).',
    bestTie: 'Divide o maior overall do elenco no {game} ({club}).',
    growth: 'Seu potencial é {p}: pode subir {d} {points}.',
    ceiling: 'Seu potencial ({p}) é igual ao overall atual.',
    real: 'Estatísticas reais',
    realLink: 'Ver jogos, gols e temporadas de {name}',
    variant: 'Esta é uma das cartas de {name} no {game}. A de maior overall é:',
    teammates: 'Companheiros de time ({club})',
    faq: 'Perguntas frequentes',
    qOverall: 'Qual é o overall de {name} no {game}?',
    aOverall: '{name} tem {overall} de overall no {game}, com potencial de {potential}.',
    aOverallNoPot: '{name} tem {overall} de overall no {game}.',
    qPos: 'Em que posição {name} joga no {game}?',
    aPos: '{name} joga como {list} no {game}.',
    qClub: 'Em que time {name} joga no {game}?',
    aClub: 'No {game}, o clube de {name} é {club}.',
    qValue: 'Quanto vale {name} no {game}?',
    aValue: 'No modo carreira do {game}, {name} vale {value}.',
    disclaimer:
      'O Golify não é afiliado à EA Sports nem à Electronic Arts. EA Sports FC é marca da Electronic Arts; os ratings vêm do banco de dados do jogo.',
    top: 'Melhores ratings do {game}',
    more: 'Mais do {game}',
    point: 'ponto',
    points: 'pontos',
    appKicker: 'App Golify',
    appTitle: 'Monte seu time',
    appBody: 'Explore o catálogo completo do {game} e acompanhe os craques na vida real, ao vivo, no app Golify.',
    ios: 'Baixe na App Store',
    android: 'Disponível no Google Play',
    metaTitle: '{name}: rating {game}, overall e cartas',
    metaDesc: '{name} no {game}: {overall} de overall{pos}{club}. Potencial, idade, nacionalidade, valor e salário no jogo.',
  },
  en: {
    home: 'Home',
    kicker: '{game} rating',
    overall: 'Overall',
    potential: 'Potential',
    age: 'Age',
    years: '{n}',
    positions: 'Positions',
    nationality: 'Nationality',
    club: 'Club',
    national: 'National team',
    number: 'Shirt number',
    contract: 'Contract until',
    loaned: 'On loan',
    yes: 'Yes',
    value: 'In-game value',
    wage: 'In-game weekly wage',
    card: '{game} profile',
    summary: '{name} is rated {overall} overall in {game}.',
    summaryPos: 'Plays as {pos}.',
    summaryClub: 'Club in the game: {club}.',
    best: 'Highest-rated {club} player in {game}.',
    bestTie: 'Joint highest rating at {club} in {game}.',
    growth: 'Potential {p}: room to grow by {d} {points}.',
    ceiling: 'Potential ({p}) already matches the current overall.',
    real: 'Real-life stats',
    realLink: 'See {name}’s matches, goals and seasons',
    variant: 'This is one of {name}’s cards in {game}. The highest-rated one is:',
    teammates: '{club} teammates',
    faq: 'FAQ',
    qOverall: 'What is {name}’s rating in {game}?',
    aOverall: '{name} is rated {overall} overall in {game}, with {potential} potential.',
    aOverallNoPot: '{name} is rated {overall} overall in {game}.',
    qPos: 'What position does {name} play in {game}?',
    aPos: '{name} plays {list} in {game}.',
    qClub: 'What team is {name} on in {game}?',
    aClub: 'In {game}, {name} plays for {club}.',
    qValue: 'How much is {name} worth in {game}?',
    aValue: 'In {game} career mode, {name} is valued at {value}.',
    disclaimer:
      'Golify is not affiliated with EA Sports or Electronic Arts. EA Sports FC is a trademark of Electronic Arts; ratings come from the game’s database.',
    top: 'Top {game} ratings',
    more: 'More {game}',
    point: 'point',
    points: 'points',
    appKicker: 'Golify app',
    appTitle: 'Build your XI',
    appBody: 'Browse the full {game} catalogue and follow the stars in real life, live, in the Golify app.',
    ios: 'Download on the App Store',
    android: 'Get it on Google Play',
    metaTitle: '{name}: {game} rating, overall and cards',
    metaDesc: '{name} in {game}: {overall} overall{pos}{club}. Potential, age, nationality, in-game value and wage.',
  },
} as const;

async function load(param: string) {
  const id = idFromSlug(param);
  if (!id) notFound();
  // Errors throw (Next keeps the last good copy); a missing row is a 404.
  const p = await getFcPlayer(id);
  if (!p) notFound();
  return p;
}

function canonicalParam(p: FcPlayerRow): string {
  return withId(p.slug, p.player_id);
}

function clubOf(m: FcMembership[]): FcMembership | null {
  return m.find((x) => x.kind === 'club') ?? null;
}

function nationalOf(m: FcMembership[]): FcMembership | null {
  return m.find((x) => x.kind === 'national') ?? null;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  const locale = asLocale(raw);
  const p = await load(slug);
  const [game, siblings, memberships] = await Promise.all([getFcGame(), getSlugSiblings(p.slug), getMemberships(p.player_id)]);
  const t = STR[locale];
  const name = fcDisplayName(p);
  const club = clubOf(memberships);
  const pos = positionName(p.primary_position ?? p.positions?.[0], locale);
  const canonical = siblings[0]?.player_id ?? p.player_id;
  return pageMetadata({
    locale,
    path: (l) => fcPath(l, p),
    title: fill(t.metaTitle, { name, game: game.short }),
    description: fill(t.metaDesc, {
      name,
      game: game.short,
      overall: p.overall_rating ?? '—',
      pos: pos ? `, ${pos}` : '',
      club: club ? `, ${club.team.name}` : '',
    }),
    noindex: p.overall_rating == null || canonical !== p.player_id,
    images: p.headshot_url ? [{ url: p.headshot_url, alt: name }] : undefined,
    type: 'profile',
  });
}

export default async function FcPlayerPage({ params }: { params: Promise<Params> }) {
  const { locale: raw, slug } = await params;
  const locale: RouteLocale = asLocale(raw);
  const p = await load(slug);
  // Bare id, old name or a mistyped slug: one hop to the canonical URL.
  if (slug !== canonicalParam(p)) permanentRedirect(fcPath(locale, p));

  const [game, siblings, memberships] = await Promise.all([getFcGame(), getSlugSiblings(p.slug), getMemberships(p.player_id)]);
  const t = STR[locale];
  const name = fcDisplayName(p);
  const club = clubOf(memberships);
  const national = nationalOf(memberships);
  const canonicalId = siblings[0]?.player_id ?? p.player_id;
  const isCanonical = canonicalId === p.player_id;
  const indexable = p.overall_rating != null && isCanonical;

  const [teammates, real, best] = await Promise.all([
    club ? getTeammates(club.team.team_id, p.player_id, 8) : Promise.resolve([]),
    // Historic custom XIs (icons) have no current-day counterpart to match.
    club || national ? findRealPlayer(p) : Promise.resolve(null),
    isCanonical ? Promise.resolve(null) : getFcPlayer(canonicalId),
  ]);

  const g = game.short;
  const posIds = positionList(p.positions);
  const posNames = [...new Set(posIds.map((id) => positionName(id, locale)).filter((x): x is string => !!x))];
  const primary = positionName(p.primary_position ?? posIds[0], locale);
  const vars = { name, game: g };

  const summary: string[] = [];
  if (p.overall_rating != null) summary.push(fill(t.summary, { ...vars, overall: p.overall_rating }));
  if (primary) summary.push(fill(t.summaryPos, { pos: primary.toLowerCase() }));
  if (club) {
    summary.push(fill(t.summaryClub, { club: club.team.name }));
    const topMate = teammates[0]?.overall_rating ?? null;
    if (p.overall_rating != null && teammates.length > 0 && topMate != null) {
      if (p.overall_rating > topMate) summary.push(fill(t.best, { ...vars, club: club.team.name }));
      else if (p.overall_rating === topMate) summary.push(fill(t.bestTie, { ...vars, club: club.team.name }));
    }
  }
  if (p.potential != null && p.overall_rating != null) {
    summary.push(
      p.potential > p.overall_rating
        ? fill(t.growth, {
            p: p.potential,
            d: p.potential - p.overall_rating,
            points: plural(p.potential - p.overall_rating, t.point, t.points),
          })
        : fill(t.ceiling, { p: p.potential }),
    );
  }

  const value = eurCompact(p.value_eur, locale);
  const wage = eurCompact(p.wage_eur, locale);
  const nat = nationalityLabel(p.nationality_name, locale);
  const contractYear = club?.contract_end ? club.contract_end.slice(0, 4) : null;

  const facts: [string, string][] = [];
  if (p.potential != null) facts.push([t.potential, String(p.potential)]);
  if (p.age != null) facts.push([t.age, fill(t.years, { n: p.age })]);
  if (posIds.length > 0) facts.push([t.positions, posIds.map((id) => positionCode(id)).join(' · ')]);
  if (nat) facts.push([t.nationality, nat]);
  if (club) facts.push([t.club, club.team.name]);
  // EA names national sides after the country, in English: translate it.
  if (national) facts.push([t.national, nationalityLabel(national.team.name, locale) ?? national.team.name]);
  if (club?.jersey_number) facts.push([t.number, String(club.jersey_number)]);
  if (contractYear) facts.push([t.contract, contractYear]);
  if (club?.is_loaned) facts.push([t.loaned, t.yes]);
  if (value) facts.push([t.value, value]);
  if (wage) facts.push([t.wage, wage]);

  const faq: [string, string][] = [];
  if (p.overall_rating != null) {
    faq.push([
      fill(t.qOverall, vars),
      p.potential != null
        ? fill(t.aOverall, { ...vars, overall: p.overall_rating, potential: p.potential })
        : fill(t.aOverallNoPot, { ...vars, overall: p.overall_rating }),
    ]);
  }
  if (posNames.length > 0) faq.push([fill(t.qPos, vars), fill(t.aPos, { ...vars, list: listJoin(posNames.map((x) => x.toLowerCase()), locale) })]);
  if (club) faq.push([fill(t.qClub, vars), fill(t.aClub, { ...vars, club: club.team.name })]);
  if (value) faq.push([fill(t.qValue, vars), fill(t.aValue, { ...vars, value })]);

  const path = fcPath(locale, p);
  const crumbs = [
    { name: t.home, path: homePath(locale) },
    { name: g, path: sectionPath('fc', locale) },
    { name },
  ];
  const code = positionCode(p.primary_position ?? posIds[0]);

  const main = (
    <>
      <section>
        <Kicker>{fill(t.kicker, vars)}</Kicker>
        <Card className="mt-3 overflow-hidden">
          <div className="flex flex-col gap-5 bg-band p-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-24 w-20 shrink-0 flex-col items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <span className="font-display text-4xl leading-none font-bold tabular-nums">{p.overall_rating ?? '—'}</span>
                {code ? <span className="mt-1 text-xs font-extrabold tracking-wide">{code}</span> : null}
              </div>
              {p.headshot_url ? (
                <Image
                  src={p.headshot_url}
                  alt={name}
                  width={96}
                  height={96}
                  unoptimized
                  className="h-24 w-24 shrink-0 rounded-xl bg-surface-2 object-cover"
                />
              ) : null}
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-3xl leading-tight font-bold tracking-wide uppercase sm:text-4xl">{name}</h1>
              <p className="mt-1 font-semibold text-muted-foreground">
                {[club?.team.name, nat].filter(Boolean).join(' · ')}
              </p>
            </div>
          </div>
          {facts.length > 0 ? (
            <dl className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-y-0">
              {facts.map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-3 px-5 py-3 sm:border-b sm:border-border">
                  <dt className="text-sm font-semibold text-muted-foreground">{k}</dt>
                  <dd className="text-right font-bold">{v}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </Card>
        {summary.length > 0 ? <p className="mt-5 max-w-2xl leading-relaxed font-semibold">{summary.join(' ')}</p> : null}

        {best ? (
          <div className="mt-5 rounded-2xl border border-border bg-surface-2 p-4 text-sm font-semibold">
            {fill(t.variant, vars)}{' '}
            <Link href={fcPath(locale, best)} className="font-bold text-primary underline">
              {fcDisplayName(best)} ({best.overall_rating ?? '—'})
            </Link>
          </div>
        ) : null}

        {real ? (
          <section className="mt-6">
            <SectionTitle>{t.real}</SectionTitle>
            <Link
              href={playerPath(locale, real)}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-3.5 font-bold hover:border-primary/60 hover:text-primary"
            >
              <span>{fill(t.realLink, { name: real.name })}</span>
              <span aria-hidden="true">›</span>
            </Link>
          </section>
        ) : null}
      </section>

      <AdSlot id="fc-after-card" format="leaderboard" indexable={indexable} />

      {club && teammates.length > 0 ? (
        <section className="mt-8">
          <SectionTitle>{fill(t.teammates, { club: club.team.name })}</SectionTitle>
          <Card className="divide-y divide-border">
            {teammates.map((m) => (
              <Link key={m.player_id} href={fcPath(locale, m)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold hover:text-primary">
                <span className="w-8 shrink-0 rounded-md bg-primary/15 py-0.5 text-center font-display text-primary tabular-nums">
                  {m.overall_rating ?? '—'}
                </span>
                <span className="min-w-0 flex-1 truncate">{fcDisplayName(m)}</span>
                <span className="text-xs font-semibold text-muted-foreground">{positionCode(m.primary_position ?? m.positions?.[0])}</span>
              </Link>
            ))}
          </Card>
        </section>
      ) : null}

      <FaqSection title={t.faq} entries={faq} pagePath={path} />

      <p className="mt-8 text-xs leading-relaxed font-semibold text-muted-foreground">{t.disclaimer}</p>
    </>
  );

  const aside = (
    <>
      <AppCard
        title={t.appTitle}
        body={fill(t.appBody, vars)}
        medium="fc"
        campaign={canonicalParam(p)}
        labels={{ kicker: t.appKicker, ios: t.ios, android: t.android }}
      />
      <LinkList title={fill(t.more, vars)} links={[{ href: sectionPath('fc', locale), label: fill(t.top, vars) }]} />
    </>
  );

  return (
    <PageShell locale={locale}>
      <Breadcrumbs crumbs={crumbs} currentPath={path} />
      <TwoColumn main={main} aside={aside} />
    </PageShell>
  );
}
