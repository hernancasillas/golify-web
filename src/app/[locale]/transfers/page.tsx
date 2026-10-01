import type { Metadata } from 'next';
import Link from 'next/link';
import { COMPETITIONS, competitionName } from '@/lib/competitions';
import { homePath, sectionPath, transfersPath } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import { Breadcrumbs } from '@/components/blocks/Breadcrumbs';
import { AppCard, Card, Kicker, PageShell, SectionTitle, TwoColumn } from '@/components/watch/ui';
import { asLocale, fill } from '@/components/watch/i18n';
import { WINDOW_MONTHS, hasTransfersPage } from '@/components/watch/data/transfers';

// "Fichajes" hub: one link per covered league with a transfers page. No API
// calls here — each league page carries its own (cached) window.

export const revalidate = 86400;

type Params = { locale: string };

const STR = {
  es: {
    home: 'Inicio',
    section: 'Fichajes',
    kicker: 'Mercado de pases',
    h1: 'Fichajes de fútbol: altas y bajas por liga',
    lead: 'Los movimientos registrados de cada club en los últimos {months} meses, liga por liga: quién llegó, quién se fue, préstamos y montos cuando la fuente los reporta.',
    leagues: 'Ligas',
    cta: 'Ver fichajes',
    appKicker: 'App Golify',
    appTitle: 'Sigue a tu club',
    appBody: 'Marcador en vivo, alineaciones y alerta de gol de tu equipo en la app Golify.',
    ios: 'Descárgala en App Store',
    android: 'Disponible en Google Play',
    metaTitle: 'Fichajes de fútbol {year}: altas y bajas por liga',
    metaDesc: 'Fichajes de Liga MX, Brasileirão, Liga Profesional, MLS, Premier League, LaLiga y más: altas y bajas de cada club en los últimos {months} meses.',
  },
  pt: {
    home: 'Início',
    section: 'Transferências',
    kicker: 'Mercado da bola',
    h1: 'Transferências do futebol: contratações e saídas por liga',
    lead: 'As movimentações registradas de cada clube nos últimos {months} meses, liga por liga: quem chegou, quem saiu, empréstimos e valores quando a fonte informa.',
    leagues: 'Ligas',
    cta: 'Ver transferências',
    appKicker: 'App Golify',
    appTitle: 'Acompanhe seu time',
    appBody: 'Placar ao vivo, escalações e alerta de gol do seu time no app Golify.',
    ios: 'Baixe na App Store',
    android: 'Disponível no Google Play',
    metaTitle: 'Transferências do futebol {year}: contratações e saídas',
    metaDesc: 'Transferências do Brasileirão, Liga MX, Liga Profesional, MLS, Premier League, LaLiga e mais: contratações e saídas nos últimos {months} meses.',
  },
  en: {
    home: 'Home',
    section: 'Transfers',
    kicker: 'Transfer window',
    h1: 'Football transfers: ins and outs by league',
    lead: 'Every recorded move by each club over the last {months} months, league by league: who arrived, who left, loans and fees when the source reports them.',
    leagues: 'Leagues',
    cta: 'See transfers',
    appKicker: 'Golify app',
    appTitle: 'Follow your club',
    appBody: 'Live score, lineups and goal alerts for your team in the Golify app.',
    ios: 'Download on the App Store',
    android: 'Get it on Google Play',
    metaTitle: 'Football transfers {year}: ins and outs by league',
    metaDesc: 'Liga MX, Brasileirão, MLS, Premier League, LaLiga transfers and more: every club’s arrivals and departures over the last {months} months.',
  },
} as const;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const locale = asLocale((await params).locale);
  const t = STR[locale];
  const vars = { year: new Date().getUTCFullYear(), months: WINDOW_MONTHS };
  return pageMetadata({
    locale,
    path: (l) => sectionPath('transfers', l),
    title: fill(t.metaTitle, vars),
    description: fill(t.metaDesc, vars),
  });
}

export default async function TransfersIndex({ params }: { params: Promise<Params> }) {
  const locale = asLocale((await params).locale);
  const t = STR[locale];
  const path = sectionPath('transfers', locale);
  const leagues = COMPETITIONS.filter(hasTransfersPage);
  const vars = { months: WINDOW_MONTHS };

  const main = (
    <>
      <section>
        <Kicker>{t.kicker}</Kicker>
        <h1 className="mt-2 font-display text-3xl leading-tight font-bold tracking-wide uppercase sm:text-4xl">{t.h1}</h1>
        <p className="mt-2 max-w-2xl font-semibold text-muted-foreground">{fill(t.lead, vars)}</p>
      </section>
      <section className="mt-8">
        <SectionTitle>{t.leagues}</SectionTitle>
        <Card className="divide-y divide-border">
          {leagues.map((c) => (
            <Link
              key={c.id}
              href={transfersPath(locale, c.id)!}
              className="flex items-center justify-between gap-3 px-4 py-3.5 font-bold hover:text-primary"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="w-11 shrink-0 rounded-md bg-surface-2 px-1.5 py-0.5 text-center text-[11px] font-extrabold text-muted-foreground">
                  {c.code}
                </span>
                <span className="truncate">{competitionName(c, locale)}</span>
              </span>
              <span className="shrink-0 text-xs font-bold text-primary">{t.cta} ›</span>
            </Link>
          ))}
        </Card>
      </section>
    </>
  );

  const aside = (
    <AppCard
      title={t.appTitle}
      body={t.appBody}
      medium="fichajes"
      campaign="index"
      labels={{ kicker: t.appKicker, ios: t.ios, android: t.android }}
    />
  );

  return (
    <PageShell locale={locale}>
      <Breadcrumbs crumbs={[{ name: t.home, path: homePath(locale) }, { name: t.section }]} currentPath={path} />
      <TwoColumn main={main} aside={aside} />
    </PageShell>
  );
}
