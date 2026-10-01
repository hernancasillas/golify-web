import type { Metadata } from 'next';
import Link from 'next/link';
import { fcPath, homePath, sectionPath } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import { Breadcrumbs } from '@/components/blocks/Breadcrumbs';
import { AppCard, Kicker, PageShell, SectionTitle, TwoColumn } from '@/components/watch/ui';
import { asLocale, fill } from '@/components/watch/i18n';
import { fcDisplayName, getFcGame, getTopPlayers } from '@/components/watch/data/fc';
import { nationalityLabel, positionCode } from '@/components/watch/data/fc-labels';

// EA FC hub: the 100 best-rated footballers of the current game (one card
// per footballer), each linking to its rating page. Two Supabase queries.

export const revalidate = 86400;

const TOP_N = 100;

type Params = { locale: string };

const STR = {
  es: {
    home: 'Inicio',
    kicker: 'Ratings {game}',
    h1: 'Los mejores jugadores de {game}',
    lead: 'Las {n} medias más altas de {game}, de la base de datos del juego. Cada jugador enlaza a su ficha: posiciones, potencial, club, valor y salario.',
    table: 'Top {n}',
    player: 'Jugador',
    pos: 'Pos.',
    nat: 'Nacionalidad',
    ovr: 'Media',
    disclaimer: 'Golify no está afiliado a EA Sports ni a Electronic Arts. EA Sports FC es marca de Electronic Arts.',
    appKicker: 'App Golify',
    appTitle: 'Arma tu once',
    appBody: 'Explora el catálogo completo de {game} en la app Golify.',
    ios: 'Descárgala en App Store',
    android: 'Disponible en Google Play',
    metaTitle: 'Ratings {game}: los {n} mejores jugadores',
    metaDesc: 'Las {n} medias más altas de {game}: {top}. Posición, nacionalidad y ficha completa de cada jugador.',
  },
  pt: {
    home: 'Início',
    kicker: 'Ratings {game}',
    h1: 'Os melhores jogadores do {game}',
    lead: 'Os {n} maiores overalls do {game}, do banco de dados do jogo. Cada jogador leva à sua ficha: posições, potencial, clube, valor e salário.',
    table: 'Top {n}',
    player: 'Jogador',
    pos: 'Pos.',
    nat: 'Nacionalidade',
    ovr: 'Overall',
    disclaimer: 'O Golify não é afiliado à EA Sports nem à Electronic Arts. EA Sports FC é marca da Electronic Arts.',
    appKicker: 'App Golify',
    appTitle: 'Monte seu time',
    appBody: 'Explore o catálogo completo do {game} no app Golify.',
    ios: 'Baixe na App Store',
    android: 'Disponível no Google Play',
    metaTitle: 'Ratings {game}: os {n} melhores jogadores',
    metaDesc: 'Os {n} maiores overalls do {game}: {top}. Posição, nacionalidade e ficha completa de cada jogador.',
  },
  en: {
    home: 'Home',
    kicker: '{game} ratings',
    h1: 'The best players in {game}',
    lead: 'The {n} highest overall ratings in {game}, from the game’s database. Every player links to a full profile: positions, potential, club, value and wage.',
    table: 'Top {n}',
    player: 'Player',
    pos: 'Pos.',
    nat: 'Nationality',
    ovr: 'OVR',
    disclaimer: 'Golify is not affiliated with EA Sports or Electronic Arts. EA Sports FC is a trademark of Electronic Arts.',
    appKicker: 'Golify app',
    appTitle: 'Build your XI',
    appBody: 'Browse the full {game} catalogue in the Golify app.',
    ios: 'Download on the App Store',
    android: 'Get it on Google Play',
    metaTitle: '{game} ratings: the top {n} players',
    metaDesc: 'The {n} highest {game} ratings: {top}. Position, nationality and a full profile for every player.',
  },
} as const;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const locale = asLocale((await params).locale);
  const t = STR[locale];
  const [game, top] = await Promise.all([getFcGame(), getTopPlayers(TOP_N)]);
  const vars = {
    game: game.short,
    n: top.length,
    top: top
      .slice(0, 3)
      .map((p) => `${fcDisplayName(p)} (${p.overall_rating ?? '—'})`)
      .join(', '),
  };
  return pageMetadata({
    locale,
    path: (l) => sectionPath('fc', l),
    title: fill(t.metaTitle, vars),
    description: fill(t.metaDesc, vars),
    noindex: top.length === 0,
  });
}

export default async function FcIndex({ params }: { params: Promise<Params> }) {
  const locale = asLocale((await params).locale);
  const t = STR[locale];
  const [game, top] = await Promise.all([getFcGame(), getTopPlayers(TOP_N)]);
  const vars = { game: game.short, n: top.length };
  const path = sectionPath('fc', locale);

  const main = (
    <>
      <section>
        <Kicker>{fill(t.kicker, vars)}</Kicker>
        <h1 className="mt-2 font-display text-3xl leading-tight font-bold tracking-wide uppercase sm:text-4xl">{fill(t.h1, vars)}</h1>
        <p className="mt-2 max-w-2xl font-semibold text-muted-foreground">{fill(t.lead, vars)}</p>
      </section>
      <section className="mt-8">
        <SectionTitle>{fill(t.table, vars)}</SectionTitle>
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full min-w-[22rem] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-bold tracking-wide text-muted-foreground uppercase">
                <th className="px-3 py-2.5">#</th>
                <th className="px-3 py-2.5">{t.player}</th>
                <th className="px-3 py-2.5">{t.pos}</th>
                <th className="hidden px-3 py-2.5 sm:table-cell">{t.nat}</th>
                <th className="px-3 py-2.5 text-right">{t.ovr}</th>
              </tr>
            </thead>
            <tbody>
              {top.map((p, i) => (
                <tr key={p.player_id} className="border-b border-border/60 last:border-0">
                  <td className="px-3 py-2.5 font-bold text-muted-foreground tabular-nums">{i + 1}</td>
                  <td className="px-3 py-2.5">
                    <Link href={fcPath(locale, p)} className="font-bold hover:text-primary">
                      {fcDisplayName(p)}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 font-semibold">{positionCode(p.primary_position ?? p.positions?.[0]) ?? '—'}</td>
                  <td className="hidden px-3 py-2.5 font-semibold text-muted-foreground sm:table-cell">
                    {nationalityLabel(p.nationality_name, locale) ?? '—'}
                  </td>
                  <td className="px-3 py-2.5 text-right font-display text-base font-bold tabular-nums">{p.overall_rating ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-6 text-xs font-semibold text-muted-foreground">{t.disclaimer}</p>
      </section>
    </>
  );

  const aside = (
    <AppCard
      title={t.appTitle}
      body={fill(t.appBody, vars)}
      medium="fc"
      campaign="index"
      labels={{ kicker: t.appKicker, ios: t.ios, android: t.android }}
    />
  );

  return (
    <PageShell locale={locale}>
      <Breadcrumbs crumbs={[{ name: t.home, path: homePath(locale) }, { name: game.short }]} currentPath={path} />
      <TwoColumn main={main} aside={aside} />
    </PageShell>
  );
}
