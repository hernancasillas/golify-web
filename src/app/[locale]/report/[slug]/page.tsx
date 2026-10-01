import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { InstallCTA } from '@/components/InstallCTA';
import { AdSlot } from '@/components/ads/AdSlot';
import { IndexShell } from '@/components/editorial/IndexShell';
import { JsonLd } from '@/components/JsonLd';
import { competitionById, competitionName } from '@/lib/competitions';
import { reportPath } from '@/lib/editorial/content';
import { asLocale } from '@/lib/editorial/locale';
import { buildMonthReport, isReportMonth, MIN_PICKS, currentMonth, type PredictedMatch } from '@/lib/editorial/report';
import { STR as G } from '@/lib/editorial/strings';
import { ORGANIZATION_REF, absolute, pageMetadata } from '@/lib/seo';
import { DEFAULT_OG_IMAGE } from '@/lib/site';
import { matchPath, sectionPath, type RouteLocale } from '@/lib/routes';

// Generated from real data, on demand, cached for a day (plan B2.4).
export const revalidate = 86400;
export async function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ locale: string; slug: string }> };

const STR = {
  es: {
    title: 'Informe Golify de',
    desc: (m: string, n: number, h: string) => `Lo que predijo la comunidad de Golify en ${m}: ${n.toLocaleString('es-MX')} pronósticos, ${h} de aciertos, sorpresas y partidos más pronosticados.`,
    descThin: (m: string) => `Informe Golify de ${m}: pronósticos de la comunidad en las ligas que cubrimos.`,
    thin: 'Todavía no hay suficientes pronósticos de la comunidad para este mes. Publicaremos los números cuando se alcance el mínimo de datos.',
    picks: 'pronósticos',
    matches: 'partidos con datos',
    hit: 'de los pronósticos acertó el resultado',
    fav: 'de los partidos los ganó el favorito de la comunidad',
    upsets: 'Las mayores sorpresas',
    upsetsLead: 'Partidos donde al menos 6 de cada 10 pronósticos iban por un resultado y no se dio.',
    none: 'Sin partidos que cumplan el criterio este mes.',
    most: 'Los partidos más pronosticados',
    predictable: 'La liga más predecible',
    predictableText: (n: string, p: number, k: number) => `${n}: la comunidad acertó el ${p}% de los pronósticos en ${k} partidos.`,
    method: 'Metodología',
    methodText: (min: number) =>
      `Contamos los pronósticos de quiniela hechos en la app Golify para partidos terminados en el mes en las competiciones que cubrimos. Solo entran partidos con al menos 20 pronósticos, y el informe se publica en buscadores cuando el mes suma ${min.toLocaleString('es-MX')} pronósticos. Un acierto es un pronóstico de 1X2 que coincide con el resultado final del partido. Los resultados vienen de API-Football.`,
    ongoing: 'Mes en curso: las cifras se actualizan a diario.',
    cta: 'Haz tu pronóstico en la app',
    open: 'Abrir Golify',
    idx: 'Informes',
    pct: 'pronosticó',
  },
  pt: {
    title: 'Relatório Golify de',
    desc: (m: string, n: number, h: string) => `O que a comunidade do Golify previu em ${m}: ${n.toLocaleString('pt-BR')} palpites, ${h} de acertos, zebras e jogos mais palpitados.`,
    descThin: (m: string) => `Relatório Golify de ${m}: palpites da comunidade nas ligas que cobrimos.`,
    thin: 'Ainda não há palpites suficientes da comunidade neste mês. Publicaremos os números quando atingirmos o mínimo de dados.',
    picks: 'palpites',
    matches: 'jogos com dados',
    hit: 'dos palpites acertaram o resultado',
    fav: 'dos jogos foram vencidos pelo favorito da comunidade',
    upsets: 'As maiores zebras',
    upsetsLead: 'Jogos em que pelo menos 6 de cada 10 palpites iam por um resultado e ele não veio.',
    none: 'Nenhum jogo cumpre o critério neste mês.',
    most: 'Os jogos mais palpitados',
    predictable: 'A liga mais previsível',
    predictableText: (n: string, p: number, k: number) => `${n}: a comunidade acertou ${p}% dos palpites em ${k} jogos.`,
    method: 'Metodologia',
    methodText: (min: number) =>
      `Contamos os palpites de bolão feitos no app Golify para jogos encerrados no mês nas competições que cobrimos. Só entram jogos com pelo menos 20 palpites, e o relatório vai aos buscadores quando o mês soma ${min.toLocaleString('pt-BR')} palpites. Um acerto é um palpite 1X2 que coincide com o resultado final do jogo. Os resultados vêm da API-Football.`,
    ongoing: 'Mês em andamento: os números são atualizados diariamente.',
    cta: 'Faça seu palpite no app',
    open: 'Abrir Golify',
    idx: 'Relatórios',
    pct: 'palpitou',
  },
  en: {
    title: 'Golify Report for',
    desc: (m: string, n: number, h: string) => `What the Golify community predicted in ${m}: ${n.toLocaleString('en-US')} predictions, ${h} hit rate, upsets and the most predicted matches.`,
    descThin: (m: string) => `Golify Report for ${m}: community predictions across the leagues we cover.`,
    thin: 'There are not enough community predictions for this month yet. We will publish the numbers once the minimum amount of data is reached.',
    picks: 'predictions',
    matches: 'matches with data',
    hit: 'of predictions called the result',
    fav: 'of matches were won by the community favourite',
    upsets: 'Biggest upsets',
    upsetsLead: 'Matches where at least 6 in 10 predictions backed one result and it did not happen.',
    none: 'No matches meet the criteria this month.',
    most: 'Most predicted matches',
    predictable: 'Most predictable league',
    predictableText: (n: string, p: number, k: number) => `${n}: the community called ${p}% of predictions across ${k} matches.`,
    method: 'Methodology',
    methodText: (min: number) =>
      `We count the pool predictions made in the Golify app for matches finished in the month in the competitions we cover. Only matches with at least 20 predictions are included, and the report is offered to search engines once the month reaches ${min.toLocaleString('en-US')} predictions. A hit is a 1X2 prediction that matches the final result. Results come from API-Football.`,
    ongoing: 'Month in progress: figures update daily.',
    cta: 'Make your prediction in the app',
    open: 'Open Golify',
    idx: 'Reports',
    pct: 'picked',
  },
} as const;

function monthName(m: string, locale: RouteLocale) {
  const loc = { es: 'es-MX', pt: 'pt-BR', en: 'en-US' }[locale];
  return new Date(`${m}-01T00:00:00Z`).toLocaleDateString(loc, { month: 'long', year: 'numeric', timeZone: 'UTC' });
}
const pct = (n: number) => `${Math.round(n * 100)}%`;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: lp, slug } = await params;
  const locale = asLocale(lp);
  if (!isReportMonth(slug)) return {};
  const t = STR[locale];
  const r = await buildMonthReport(slug);
  const m = monthName(slug, locale);
  return pageMetadata({
    locale,
    path: (l) => reportPath(l, slug),
    title: `${t.title} ${m}`,
    description: r.indexable && r.hitRate != null ? t.desc(m, r.totalPicks, pct(r.hitRate)) : t.descThin(m),
    noindex: !r.indexable,
  });
}

function MatchRow({ m, locale, extra }: { m: PredictedMatch; locale: RouteLocale; extra: string }) {
  return (
    <li className="flex items-center justify-between gap-3 p-4">
      <Link
        href={matchPath(locale, { fixture: { id: m.fixtureId }, teams: { home: { name: m.home }, away: { name: m.away } } })}
        className="font-bold hover:text-primary"
      >
        {m.home} {m.goalsHome}-{m.goalsAway} {m.away}
      </Link>
      <span className="shrink-0 text-sm font-bold text-muted-foreground">{extra}</span>
    </li>
  );
}

export default async function ReportPage({ params }: Props) {
  const { locale: lp, slug } = await params;
  const locale = asLocale(lp);
  if (!isReportMonth(slug)) notFound();
  const t = STR[locale];
  const g = G[locale];
  const r = await buildMonthReport(slug);
  const m = monthName(slug, locale);
  const path = reportPath(locale, slug);
  const enough = r.indexable && r.hitRate != null && r.favouriteRate != null;
  const league = r.mostPredictable ? competitionById(r.mostPredictable.leagueId) : null;
  const sideLabel = (x: PredictedMatch) => `${x.favouritePct}% ${t.pct}`;

  return (
    <IndexShell
      locale={locale}
      path={path}
      crumbs={[
        { name: g.home, path: `/${locale}` },
        { name: g.report, path: sectionPath('report', locale) },
        { name: m },
      ]}
      title={`${t.title} ${m}`}
    >
      {enough ? (
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: `${t.title} ${m}`,
            description: t.desc(m, r.totalPicks, pct(r.hitRate!)),
            datePublished: `${slug}-01`,
            dateModified: new Date().toISOString().slice(0, 10),
            author: { '@type': 'Organization', name: 'Golify' },
            publisher: ORGANIZATION_REF,
            mainEntityOfPage: absolute(path),
            inLanguage: locale === 'pt' ? 'pt-BR' : locale,
            image: [DEFAULT_OG_IMAGE],
          }}
        />
      ) : null}
      {slug === currentMonth() ? <p className="mb-4 text-sm font-bold text-muted-foreground">{t.ongoing}</p> : null}

      {!enough ? (
        <p className="rounded-2xl border border-border bg-surface p-5 font-semibold text-muted-foreground">{t.thin}</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              [r.totalPicks.toLocaleString(locale === 'en' ? 'en-US' : locale === 'pt' ? 'pt-BR' : 'es-MX'), `${t.picks} · ${r.matchesWithData} ${t.matches}`],
              [pct(r.hitRate!), t.hit],
              [pct(r.favouriteRate!), t.fav],
            ].map(([n, l]) => (
              <div key={l} className="rounded-2xl border border-border bg-surface p-5">
                <p className="font-display text-4xl font-bold text-primary">{n}</p>
                <p className="mt-1 text-sm font-semibold text-muted-foreground">{l}</p>
              </div>
            ))}
          </div>
          {/* After the first content block (headline numbers). */}
          <AdSlot id="report-after-stats" format="in-article" indexable />

          <h2 className="mt-10 font-display text-xl font-bold tracking-wide uppercase">{t.upsets}</h2>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">{t.upsetsLead}</p>
          {r.upsets.length ? (
            <ul className="mt-3 divide-y divide-border rounded-2xl border border-border bg-surface">
              {r.upsets.map((x) => <MatchRow key={x.fixtureId} m={x} locale={locale} extra={sideLabel(x)} />)}
            </ul>
          ) : (
            <p className="mt-3 font-semibold text-muted-foreground">{t.none}</p>
          )}

          <h2 className="mt-10 font-display text-xl font-bold tracking-wide uppercase">{t.most}</h2>
          <ul className="mt-3 divide-y divide-border rounded-2xl border border-border bg-surface">
            {r.mostPredicted.map((x) => <MatchRow key={x.fixtureId} m={x} locale={locale} extra={`${x.picks} ${t.picks}`} />)}
          </ul>

          {league && r.mostPredictable ? (
            <>
              <h2 className="mt-10 font-display text-xl font-bold tracking-wide uppercase">{t.predictable}</h2>
              <p className="mt-3 font-semibold">
                {t.predictableText(competitionName(league, locale), Math.round(r.mostPredictable.hitRate * 100), r.mostPredictable.matches)}
              </p>
            </>
          ) : null}
        </>
      )}

      <h2 className="mt-10 font-display text-xl font-bold tracking-wide uppercase">{t.method}</h2>
      <p className="mt-3 font-semibold text-muted-foreground">{t.methodText(MIN_PICKS)}</p>

      <section className="mt-10 rounded-3xl border border-border bg-band p-6">
        <h2 className="font-display text-xl font-bold tracking-wide uppercase">{t.cta}</h2>
        <div className="mt-4">
          <InstallCTA labels={{ open: t.open, ios: g.ios, android: g.android }} />
        </div>
      </section>
    </IndexShell>
  );
}
