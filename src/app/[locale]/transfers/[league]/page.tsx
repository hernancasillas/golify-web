import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { COMPETITIONS, competitionBySlug, competitionName, type Competition } from '@/lib/competitions';
import {
  competitionPath,
  homePath,
  playerPath,
  sectionPath,
  teamPath,
  transfersPath,
  type RouteLocale,
} from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import { intlLocale } from '@/lib/timezones';
import { Breadcrumbs } from '@/components/blocks/Breadcrumbs';
import { FaqSection } from '@/components/blocks/FaqSection';
import { AdSlot } from '@/components/ads/AdSlot';
import { AppCard, Card, Kicker, LinkList, PageShell, SectionTitle, TwoColumn } from '@/components/watch/ui';
import { TransferTable, type TransferRowView } from '@/components/watch/TransferTable';
import { asLocale, fill } from '@/components/watch/i18n';
import {
  INDEX_THRESHOLD,
  WINDOW_MONTHS,
  getLeagueWindow,
  hasTransfersPage,
  transferKind,
  transferTypeLabel,
  type LeagueWindow,
  type TransferRow,
} from '@/components/watch/data/transfers';

// "Fichajes {liga}": the league's transfer window, built from API-Football's
// per-club transfer lists (one cached daily call per club — the page's whole
// budget). Only confirmed moves the provider records: no rumours, no fees we
// cannot cite. Indexable with at least INDEX_THRESHOLD moves in the window
// (plan §5: "siempre en ventana de pases").

export async function generateStaticParams() {
  return [];
}
export const revalidate = 43200;

// A Premier League window runs to ~900 moves; rendering them all made a
// 1.5 MB page. The table shows the most recent ones; counts, balance and
// FAQ are computed over the whole window.
const TABLE_MAX = 100;

type Params = { locale: string; league: string };

const STR = {
  es: {
    home: 'Inicio',
    section: 'Fichajes',
    kicker: 'Mercado de pases · desde el {since}',
    h1: 'Fichajes {league} {year}: altas y bajas',
    lead: 'Todos los movimientos registrados de los clubes de {league} en los últimos {months} meses, club por club.',
    moves: 'movimientos',
    ins: 'altas',
    outs: 'bajas',
    summary: 'Desde el {since}, los clubes de {league} registran {n} movimientos: {a} altas y {b} bajas.',
    summaryLoans: '{loans} de ellos son préstamos.',
    summaryInternal: '{internal} fueron entre clubes de la propia liga, así que cuentan como alta y como baja.',
    shown: 'Mostrando los {shown} movimientos más recientes de {n}.',
    summaryLeader: '{club} es el club más activo, con {in} altas y {out} bajas.',
    summaryLatest: 'El más reciente: {player}, de {from} a {to} ({date}).',
    empty: 'No hay movimientos registrados de clubes de {league} en los últimos {months} meses.',
    tabAll: 'Todos',
    tabIn: 'Altas',
    tabOut: 'Bajas',
    allClubs: 'Todos los clubes',
    clubFilter: 'Filtrar por club',
    date: 'Fecha',
    player: 'Jugador',
    from: 'De',
    to: 'A',
    type: 'Tipo',
    note: 'Solo movimientos registrados por nuestro proveedor de datos; no publicamos rumores. El tipo y el monto se muestran tal como los reporta la fuente.',
    balance: 'Balance por club',
    balanceAside: 'altas · bajas',
    priciest: 'Los más caros',
    faq: 'Preguntas frecuentes',
    qCount: '¿Cuántos fichajes lleva {league} en los últimos {months} meses?',
    qLeader: '¿Qué club de {league} ha hecho más altas?',
    aLeader: '{club}, con {n} altas desde el {since}.',
    qPriciest: '¿Cuál es el fichaje más caro de {league}?',
    aPriciest: '{player}, de {from} a {to}, por {fee} ({date}), según el monto reportado.',
    qLatest: '¿Cuál es el último fichaje de {league}?',
    aLatest: '{player}, de {from} a {to}, el {date} ({type}).',
    otherLeagues: 'Fichajes de otras ligas',
    more: 'Más de {league}',
    competition: '{league}: tabla y calendario',
    allTransfers: 'Todos los fichajes',
    appKicker: 'App Golify',
    appTitle: 'Sigue a tu club',
    appBody: 'Marcador en vivo, alineaciones y alerta de gol de tu equipo en la app Golify.',
    ios: 'Descárgala en App Store',
    android: 'Disponible en Google Play',
    metaTitle: 'Fichajes {league} {year}: altas y bajas',
    metaDesc: 'Fichajes de {league}: {n} movimientos en los últimos {months} meses, {a} altas y {b} bajas, club por club con fecha y tipo.',
    metaDescEmpty: 'Fichajes de {league}: altas y bajas de cada club en los últimos {months} meses, con fecha y tipo de movimiento.',
  },
  pt: {
    home: 'Início',
    section: 'Transferências',
    kicker: 'Mercado da bola · desde {since}',
    h1: 'Transferências {league} {year}: contratações e saídas',
    lead: 'Todas as movimentações registradas dos clubes de {league} nos últimos {months} meses, clube por clube.',
    moves: 'movimentações',
    ins: 'contratações',
    outs: 'saídas',
    summary: 'Desde {since}, os clubes de {league} registram {n} movimentações: {a} contratações e {b} saídas.',
    summaryLoans: '{loans} delas são empréstimos.',
    summaryInternal: '{internal} foram entre clubes da própria liga, então contam como entrada e como saída.',
    shown: 'Mostrando as {shown} movimentações mais recentes de {n}.',
    summaryLeader: '{club} é o clube mais ativo, com {in} contratações e {out} saídas.',
    summaryLatest: 'A mais recente: {player}, que trocou {from} por {to} ({date}).',
    empty: 'Não há movimentações registradas de clubes de {league} nos últimos {months} meses.',
    tabAll: 'Todas',
    tabIn: 'Contratações',
    tabOut: 'Saídas',
    allClubs: 'Todos os clubes',
    clubFilter: 'Filtrar por clube',
    date: 'Data',
    player: 'Jogador',
    from: 'De',
    to: 'Para',
    type: 'Tipo',
    note: 'Só movimentações registradas pelo nosso provedor de dados; não publicamos boatos. O tipo e o valor aparecem como a fonte informa.',
    balance: 'Balanço por clube',
    balanceAside: 'entradas · saídas',
    priciest: 'As mais caras',
    faq: 'Perguntas frequentes',
    qCount: 'Quantas transferências {league} teve nos últimos {months} meses?',
    qLeader: 'Qual clube de {league} mais contratou?',
    aLeader: '{club}, com {n} contratações desde {since}.',
    qPriciest: 'Qual é a contratação mais cara de {league}?',
    aPriciest: '{player} ({from} → {to}): {fee}, em {date}, segundo o valor informado.',
    qLatest: 'Qual é a última transferência de {league}?',
    aLatest: '{player}, que trocou {from} por {to} em {date} ({type}).',
    otherLeagues: 'Transferências de outras ligas',
    more: 'Mais de {league}',
    competition: '{league}: tabela e jogos',
    allTransfers: 'Todas as transferências',
    appKicker: 'App Golify',
    appTitle: 'Acompanhe seu time',
    appBody: 'Placar ao vivo, escalações e alerta de gol do seu time no app Golify.',
    ios: 'Baixe na App Store',
    android: 'Disponível no Google Play',
    metaTitle: 'Transferências {league} {year}: contratações e saídas',
    metaDesc: 'Transferências de {league}: {n} movimentações nos últimos {months} meses, {a} contratações e {b} saídas, clube por clube.',
    metaDescEmpty: 'Transferências de {league}: contratações e saídas de cada clube nos últimos {months} meses, com data e tipo.',
  },
  en: {
    home: 'Home',
    section: 'Transfers',
    kicker: 'Transfer window · since {since}',
    h1: '{league} transfers {year}: ins and outs',
    lead: 'Every recorded move by {league} clubs over the last {months} months, club by club.',
    moves: 'moves',
    ins: 'arrivals',
    outs: 'departures',
    summary: 'Since {since}, {league} clubs have recorded {n} moves: {a} arrivals and {b} departures.',
    summaryLoans: '{loans} of them are loans.',
    summaryInternal: '{internal} were between two clubs of the league, so they count as both an arrival and a departure.',
    shown: 'Showing the {shown} most recent of {n} moves.',
    summaryLeader: '{club} is the busiest club, with {in} arrivals and {out} departures.',
    summaryLatest: 'The latest: {player}, from {from} to {to} ({date}).',
    empty: 'No moves by {league} clubs recorded in the last {months} months.',
    tabAll: 'All',
    tabIn: 'Arrivals',
    tabOut: 'Departures',
    allClubs: 'All clubs',
    clubFilter: 'Filter by club',
    date: 'Date',
    player: 'Player',
    from: 'From',
    to: 'To',
    type: 'Type',
    note: 'Only moves recorded by our data provider; we do not publish rumours. Type and fee are shown as the source reports them.',
    balance: 'Club balance',
    balanceAside: 'in · out',
    priciest: 'Biggest fees',
    faq: 'FAQ',
    qCount: 'How many transfers have {league} clubs made in the last {months} months?',
    qLeader: 'Which {league} club has signed the most players?',
    aLeader: '{club}, with {n} arrivals since {since}.',
    qPriciest: 'What is the most expensive {league} transfer?',
    aPriciest: '{player}, from {from} to {to}, for {fee} ({date}), as reported.',
    qLatest: 'What is the latest {league} transfer?',
    aLatest: '{player}, from {from} to {to}, on {date} ({type}).',
    otherLeagues: 'Transfers in other leagues',
    more: 'More {league}',
    competition: '{league}: table and fixtures',
    allTransfers: 'All transfers',
    appKicker: 'Golify app',
    appTitle: 'Follow your club',
    appBody: 'Live score, lineups and goal alerts for your team in the Golify app.',
    ios: 'Download on the App Store',
    android: 'Get it on Google Play',
    metaTitle: '{league} transfers {year}: ins and outs',
    metaDesc: '{league} transfers: {n} moves in the last {months} months, {a} arrivals and {b} departures, club by club with date and type.',
    metaDescEmpty: '{league} transfers: arrivals and departures for every club over the last {months} months, with date and type.',
  },
} as const;

function resolve(p: Params): { c: Competition; locale: RouteLocale } {
  const c = competitionBySlug(p.league);
  if (!c || !hasTransfersPage(c)) notFound();
  return { c, locale: asLocale(p.locale) };
}

function dateLabel(ymd: string, locale: RouteLocale, withYear = false): string {
  return new Date(`${ymd}T12:00:00Z`).toLocaleDateString(intlLocale(locale), {
    day: 'numeric',
    month: 'short',
    ...(withYear ? { year: 'numeric' } : {}),
    timeZone: 'UTC',
  });
}

function longDate(ymd: string, locale: RouteLocale): string {
  return new Date(`${ymd}T12:00:00Z`).toLocaleDateString(intlLocale(locale), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function stats(w: LeagueWindow) {
  const ins = w.rows.filter((r) => r.to.inLeague).length;
  const outs = w.rows.filter((r) => r.from.inLeague).length;
  const loans = w.rows.filter((r) => transferKind(r.type) === 'loan').length;
  const leader = w.balance[0] && (w.balance.length === 1 || w.balance[0].in + w.balance[0].out > w.balance[1].in + w.balance[1].out) ? w.balance[0] : null;
  const byIn = [...w.balance].sort((a, b) => b.in - a.in);
  const topSigner = byIn[0] && byIn[0].in > 0 && (byIn.length === 1 || byIn[0].in > byIn[1].in) ? byIn[0] : null;
  const priciest = w.rows.filter((r) => r.feeEur != null).sort((a, b) => b.feeEur! - a.feeEur!).slice(0, 5);
  return { ins, outs, loans, leader, topSigner, priciest };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { c, locale } = resolve(await params);
  const t = STR[locale];
  const w = await getLeagueWindow(c);
  const s = stats(w);
  const league = competitionName(c, locale);
  const vars = { league, year: new Date().getUTCFullYear(), months: WINDOW_MONTHS, n: w.rows.length, a: s.ins, b: s.outs };
  return pageMetadata({
    locale,
    path: (l) => transfersPath(l, c.id)!,
    title: fill(t.metaTitle, vars),
    description: fill(w.rows.length > 0 ? t.metaDesc : t.metaDescEmpty, vars),
    noindex: w.rows.length < INDEX_THRESHOLD,
  });
}

export default async function TransfersLeaguePage({ params }: { params: Promise<Params> }) {
  const { c, locale } = resolve(await params);
  const t = STR[locale];
  const league = competitionName(c, locale);
  const path = transfersPath(locale, c.id)!;

  // Strict inside: one failed club list throws and Next keeps the last good
  // copy, rather than publishing a window with that club's moves missing.
  const w = await getLeagueWindow(c);
  const s = stats(w);
  const indexable = w.rows.length >= INDEX_THRESHOLD;
  const since = longDate(w.since, locale);
  const vars = { league, months: WINDOW_MONTHS, year: new Date().getUTCFullYear(), since };

  const view = (r: TransferRow): TransferRowView => ({
    key: r.key,
    date: dateLabel(r.date, locale),
    iso: r.date,
    player: { name: r.player.name, href: playerPath(locale, r.player) },
    from: { ...r.from, href: teamPath(locale, r.from) },
    to: { ...r.to, href: teamPath(locale, r.to) },
    type: transferTypeLabel(r.type, locale),
  });

  const latest = w.rows[0];
  const summary = w.rows.length
    ? [
        fill(t.summary, { ...vars, n: w.rows.length, a: s.ins, b: s.outs }),
        s.loans > 0 ? fill(t.summaryLoans, { loans: s.loans }) : '',
        w.internal > 0 ? fill(t.summaryInternal, { internal: w.internal }) : '',
        s.leader ? fill(t.summaryLeader, { club: s.leader.team.name, in: s.leader.in, out: s.leader.out }) : '',
        latest
          ? fill(t.summaryLatest, { player: latest.player.name, from: latest.from.name, to: latest.to.name, date: longDate(latest.date, locale) })
          : '',
      ]
        .filter(Boolean)
        .join(' ')
    : fill(t.empty, vars);

  const faq: [string, string][] = [];
  if (w.rows.length > 0) {
    faq.push([fill(t.qCount, vars), fill(t.summary, { ...vars, n: w.rows.length, a: s.ins, b: s.outs })]);
    if (s.topSigner) faq.push([fill(t.qLeader, vars), fill(t.aLeader, { ...vars, club: s.topSigner.team.name, n: s.topSigner.in })]);
    const top = s.priciest[0];
    if (top) {
      faq.push([
        fill(t.qPriciest, vars),
        fill(t.aPriciest, { player: top.player.name, from: top.from.name, to: top.to.name, fee: transferTypeLabel(top.type, locale), date: longDate(top.date, locale) }),
      ]);
    }
    if (latest) {
      faq.push([
        fill(t.qLatest, vars),
        fill(t.aLatest, { player: latest.player.name, from: latest.from.name, to: latest.to.name, date: longDate(latest.date, locale), type: transferTypeLabel(latest.type, locale) }),
      ]);
    }
  }

  const shown = w.rows.slice(0, TABLE_MAX);
  // Only clubs that appear in the rows shown, so no filter choice is empty.
  const present = new Set(shown.flatMap((r) => [r.from.inLeague ? r.from.id : 0, r.to.inLeague ? r.to.id : 0]));
  const clubs = w.teams
    .filter((x) => present.has(x.team.id))
    .map((x) => ({ id: x.team.id, name: x.team.name }))
    .sort((a, b) => a.name.localeCompare(b.name, intlLocale(locale)));

  const crumbs = [
    { name: t.home, path: homePath(locale) },
    { name: t.section, path: sectionPath('transfers', locale) },
    { name: league },
  ];

  const main = (
    <>
      <section>
        <Kicker>{fill(t.kicker, vars)}</Kicker>
        <h1 className="mt-2 font-display text-3xl leading-tight font-bold tracking-wide uppercase sm:text-4xl">{fill(t.h1, vars)}</h1>
        <p className="mt-2 max-w-2xl font-semibold text-muted-foreground">{fill(t.lead, vars)}</p>
        {w.rows.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-2 text-sm font-bold">
            <li className="rounded-full border border-border bg-surface px-3 py-1.5">
              <span className="font-display text-base tabular-nums">{w.rows.length}</span> {t.moves}
            </li>
            <li className="rounded-full border border-border bg-surface px-3 py-1.5">
              <span className="font-display text-base text-primary tabular-nums">{s.ins}</span> {t.ins}
            </li>
            <li className="rounded-full border border-border bg-surface px-3 py-1.5">
              <span className="font-display text-base tabular-nums">{s.outs}</span> {t.outs}
            </li>
          </ul>
        ) : null}
        <p className="mt-4 max-w-2xl leading-relaxed font-semibold">{summary}</p>
      </section>

      {w.rows.length > 0 ? (
        <section className="mt-8">
          <TransferTable
            id={`transfers-${c.slug}`}
            rows={shown.map(view)}
            clubs={clubs}
            labels={{
              all: t.tabAll,
              in: t.tabIn,
              out: t.tabOut,
              allClubs: t.allClubs,
              clubFilter: t.clubFilter,
              date: t.date,
              player: t.player,
              from: t.from,
              to: t.to,
              type: t.type,
            }}
          />
          <p className="mt-3 text-xs font-semibold text-muted-foreground">
            {w.rows.length > TABLE_MAX ? `${fill(t.shown, { shown: TABLE_MAX, n: w.rows.length })} ` : ''}
            {t.note}
          </p>
        </section>
      ) : null}

      <AdSlot id="transfers-after-table" format="leaderboard" indexable={indexable} />

      <FaqSection title={t.faq} entries={faq} pagePath={path} />
    </>
  );

  const others = COMPETITIONS.filter((x) => x.id !== c.id && hasTransfersPage(x)).map((x) => ({
    href: transfersPath(locale, x.id)!,
    label: competitionName(x, locale),
  }));
  const compHref = competitionPath(locale, c.id);

  const aside = (
    <>
      {w.balance.length > 0 ? (
        <section>
          <SectionTitle aside={t.balanceAside}>{t.balance}</SectionTitle>
          <Card className="divide-y divide-border">
            {w.balance.slice(0, 12).map((b) => (
              <Link
                key={b.team.id}
                href={teamPath(locale, b.team)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold hover:text-primary"
              >
                <Image src={b.team.logo} alt="" width={20} height={20} unoptimized className="h-5 w-5 shrink-0 object-contain" />
                <span className="min-w-0 flex-1 truncate">{b.team.name}</span>
                <span className="text-primary tabular-nums">+{b.in}</span>
                <span className="text-muted-foreground tabular-nums">−{b.out}</span>
              </Link>
            ))}
          </Card>
        </section>
      ) : null}
      {s.priciest.length > 0 ? (
        <section>
          <SectionTitle>{t.priciest}</SectionTitle>
          <Card className="divide-y divide-border">
            {s.priciest.map((r, i) => (
              <div key={r.key} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <span className="w-4 font-display font-bold text-muted-foreground">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <Link href={playerPath(locale, r.player)} className="block truncate font-bold hover:text-primary">
                    {r.player.name}
                  </Link>
                  <span className="block truncate text-xs font-semibold text-muted-foreground">
                    {r.from.name} → {r.to.name}
                  </span>
                </span>
                <span className="font-bold whitespace-nowrap">{transferTypeLabel(r.type, locale)}</span>
              </div>
            ))}
          </Card>
        </section>
      ) : null}
      <AppCard
        title={t.appTitle}
        body={t.appBody}
        medium="fichajes"
        campaign={c.slug}
        labels={{ kicker: t.appKicker, ios: t.ios, android: t.android }}
      />
      <LinkList
        title={fill(t.more, vars)}
        links={[
          ...(compHref ? [{ href: compHref, label: fill(t.competition, vars) }] : []),
          { href: sectionPath('transfers', locale), label: t.allTransfers },
        ]}
      />
      <LinkList title={t.otherLeagues} links={others} />
    </>
  );

  return (
    <PageShell locale={locale}>
      <Breadcrumbs crumbs={crumbs} currentPath={path} />
      <TwoColumn main={main} aside={aside} />
    </PageShell>
  );
}

