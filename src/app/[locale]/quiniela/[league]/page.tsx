import type { Metadata } from 'next';
import { localizeFixtures } from '@/lib/nations';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { cache } from 'react';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { LocalTime, LocalTimeScript } from '@/components/LocalTime';
import { JsonLd } from '@/components/JsonLd';
import { Breadcrumbs } from '@/components/blocks/Breadcrumbs';
import { FaqSection } from '@/components/blocks/FaqSection';
import { AppCard, roundEventsNode } from '@/components/pool/blocks';
import { INDEX_THRESHOLD, loadPoolLeague, loadRoundFixtures, splitsFor, totalPicks } from '@/components/pool/data';
import { fmtInt, poolStr, tpl } from '@/components/pool/strings';
import { fixturePhase, type Fixture } from '@/lib/api-football';
import type { PickSplit } from '@/lib/community';
import {
  competitionById,
  competitionBySlug,
  competitionName,
  roundLabel,
  roundWord,
  seasonLabel,
} from '@/lib/competitions';
import { ROUTE_LOCALES, homePath, matchPath, poolPath, sectionPath, type RouteLocale } from '@/lib/routes';
import { idFromSlug } from '@/lib/slug';
import { pageMetadata } from '@/lib/seo';
import { installLink, type Locale } from '@/lib/site';

// Quiniela hub of one league: /es/quiniela/liga-mx, /pt/bolao/brasileirao,
// /en/pool/premier-league. A stable URL (the round in progress changes every
// week, so redirecting this URL to it would be a moving permanent redirect):
// it features the round in progress and lists every numbered round of the
// current tournament. Indexed on the same rule as a round page — the
// featured round has ≥ 50 community picks.

export const revalidate = 300;

export async function generateStaticParams() {
  return [];
}

type Params = { locale: string; league: string };

function asLocale(v: string): RouteLocale | null {
  return (ROUTE_LOCALES as readonly string[]).includes(v) ? (v as RouteLocale) : null;
}

const resolve = cache(async (localeParam: string, league: string) => {
  const locale = asLocale(localeParam);
  if (!locale) notFound();
  const comp = competitionBySlug(league);
  if (!comp) {
    const id = idFromSlug(league);
    const byId = id ? competitionById(id) : null;
    if (byId) permanentRedirect(poolPath(locale, byId.id)!);
    notFound();
  }
  const data = await loadPoolLeague(comp, { withRounds: true });
  // Cups with knockout rounds only still get a hub for the stage in play.
  if (!data || (data.rounds.length === 0 && !data.currentRaw)) notFound();

  const fixtures = localizeFixtures(data.currentRaw ? await loadRoundFixtures(comp.id, data.season, data.currentRaw) : [], locale);
  const splits = await splitsFor(fixtures);
  const picks = totalPicks(splits, fixtures);
  return { locale, comp, data, fixtures, splits, picks, indexable: picks >= INDEX_THRESHOLD };
});

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const p = await params;
  const r = await resolve(p.locale, p.league);
  const t = poolStr(r.locale);
  const vars = {
    league: competitionName(r.comp, r.locale),
    season: seasonLabel(r.comp, { apiSeason: r.data.season, phase: r.data.phase }, r.locale),
  };
  return pageMetadata({
    locale: r.locale,
    path: (l) => poolPath(l, r.comp.id)!,
    title: tpl(t.ovMetaTitle, vars),
    description: tpl(t.ovMetaDesc, vars),
    noindex: !r.indexable,
    appRoute: 'quiniela',
  });
}

function FixtureLine({
  f,
  split,
  locale,
}: {
  f: Fixture;
  split: PickSplit | null;
  locale: RouteLocale;
}) {
  const t = poolStr(locale);
  const ph = fixturePhase(f);
  const scored = (ph === 'live' || ph === 'finished') && f.goals.home != null && f.goals.away != null;
  return (
    <li className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 sm:px-5">
      <Link href={matchPath(locale, f)} className="group flex min-w-0 flex-1 items-center gap-2 font-bold">
        <Image src={f.teams.home.logo} alt="" width={22} height={22} unoptimized className="h-[22px] w-[22px] shrink-0 object-contain" />
        <span className="truncate group-hover:text-primary">{f.teams.home.name}</span>
        <span className={`shrink-0 font-display tabular-nums ${ph === 'live' ? 'text-live' : scored ? '' : 'text-muted-foreground'}`}>
          {scored ? `${f.goals.home}-${f.goals.away}` : 'vs'}
        </span>
        <span className="truncate group-hover:text-primary">{f.teams.away.name}</span>
        <Image src={f.teams.away.logo} alt="" width={22} height={22} unoptimized className="h-[22px] w-[22px] shrink-0 object-contain" />
      </Link>
      <span className="text-xs font-semibold text-muted-foreground tabular-nums">
        {ph === 'live' ? (
          <span className="font-bold text-live">{t.live}</span>
        ) : ph === 'finished' ? (
          t.finished
        ) : ph === 'off' ? (
          t.off
        ) : (
          <LocalTime iso={f.fixture.date} locale={locale} />
        )}
        {split ? ` · 1 ${split.pct.home} % · X ${split.pct.draw} % · 2 ${split.pct.away} %` : ''}
      </span>
    </li>
  );
}

export default async function PoolLeaguePage({ params }: { params: Promise<Params> }) {
  const p = await params;
  const { locale, comp, data, fixtures, splits, picks } = await resolve(p.locale, p.league);
  const t = poolStr(locale);
  const league = competitionName(comp, locale);
  const season = seasonLabel(comp, { apiSeason: data.season, phase: data.phase }, locale);
  const path = poolPath(locale, comp.id)!;
  const word = roundWord(comp, locale);
  const current = data.current;
  const stage = data.currentRaw && !current ? roundLabel(data.currentRaw, locale, comp) : null;
  const h1 = tpl(t.ovH1, { league, season });
  const campaign = `pool-${comp.slug}`;
  const ctaHref = installLink('quiniela', campaign);

  const lead = current
    ? tpl(t.ovLead, { round: `${word} ${current.n}` })
    : stage
      ? `${t.ovLeadNone} ${tpl(t.ovCurrentStage, { stage })}.`
      : t.ovLeadNone;

  const faq: [string, string][] = [
    [t.ixFaqWhat, t.ixFaqWhatA],
    [t.faqScore, t.faqScoreA],
    [t.faqFree, t.faqFreeA],
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <LocalTimeScript locale={locale} />
      {fixtures.length > 0 ? (
        <JsonLd data={roundEventsNode(current ? `${league} ${word} ${current.n}` : `${league} · ${stage ?? ''}`, fixtures, locale, path)} />
      ) : null}
      <SiteNav />

      <main className="mx-auto max-w-4xl px-4 pt-2 pb-16 sm:px-6">
        <Breadcrumbs
          currentPath={path}
          crumbs={[
            { name: t.home, path: homePath(locale) },
            { name: t.pools, path: sectionPath('pool', locale) },
            { name: league },
          ]}
        />

        <section className="mt-5 rounded-3xl border border-border bg-gradient-to-br from-gold/15 via-surface to-surface p-5 sm:p-8">
          <p className="text-xs font-extrabold tracking-[0.14em] text-gold uppercase">{tpl(t.eyebrow, { league })}</p>
          <h1 className="mt-3 font-display text-3xl leading-[0.95] font-bold tracking-wide uppercase sm:text-5xl">{h1}</h1>
          <p className="mt-4 max-w-[62ch] leading-relaxed font-semibold text-muted-foreground">
            {lead}
            {picks > 0 ? ` ${tpl(t.leadPicks, { n: fmtInt(picks, locale) })}` : ''}
          </p>
        </section>

        {fixtures.length > 0 ? (
          <section className="mt-8 overflow-hidden rounded-2xl border border-border bg-surface">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
              <h2 className="font-display text-xl font-bold tracking-wide uppercase">
                {current ? `${t.ovCurrent}: ${word} ${current.n}` : tpl(t.ovCurrentStage, { stage: stage ?? '' })}
              </h2>
              {current ? (
                <Link
                  href={poolPath(locale, comp.id, current.n)!}
                  className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-extrabold text-primary-foreground transition hover:brightness-110"
                >
                  {tpl(t.ovGo, { round: `${word} ${current.n}` })}
                </Link>
              ) : null}
            </div>
            <ol className="divide-y divide-border border-t border-border">
              {fixtures.map((f) => (
                <FixtureLine key={f.fixture.id} f={f} split={splits.get(f.fixture.id) ?? null} locale={locale} />
              ))}
            </ol>
            {!current ? <p className="border-t border-border px-4 py-3 text-sm font-semibold text-muted-foreground sm:px-5">{t.ovStageNote}</p> : null}
          </section>
        ) : null}

        {data.rounds.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-display text-xl font-bold tracking-wide uppercase">{tpl(t.ovRounds, { league, season })}</h2>
          <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6">
            {data.rounds.map((r) => {
              const now = current?.n === r.n;
              const played = current ? r.n < current.n : false;
              return (
                <li key={r.n}>
                  <Link
                    href={poolPath(locale, comp.id, r.n)!}
                    aria-current={now ? 'page' : undefined}
                    className={`flex h-full flex-col rounded-xl border px-3 py-2.5 transition hover:border-primary/60 ${
                      now ? 'border-primary bg-primary/10' : 'border-border bg-surface'
                    }`}
                  >
                    <span className="text-xs font-semibold text-muted-foreground">{word}</span>
                    <span className="font-display text-xl font-bold tabular-nums">{r.n}</span>
                    <span className={`text-[11px] font-bold ${now ? 'text-primary' : 'text-muted-foreground'}`}>
                      {now ? t.ovNow : played ? t.ovPlayed : ' '}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
        ) : null}

        <div className="mt-10">
          <AppCard locale={locale} href={ctaHref} campaign={campaign} placement="league-hub" />
        </div>

        <FaqSection title={t.faqTitle} entries={faq} pagePath={path} />
      </main>

      <SiteFooter locale={locale as Locale} />
    </div>
  );
}
