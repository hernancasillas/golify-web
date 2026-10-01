// Server building blocks shared by the quiniela index, league overview and
// round pages. Every block renders only what real data backs.

import type { ReactNode } from 'react';
import { TrackedLink } from '@/components/analytics/Tracked';
import { correctShare, type PickSplit } from '@/lib/community';
import { fixturePhase, type Fixture } from '@/lib/api-football';
import { matchPath, type RouteLocale } from '@/lib/routes';
import { absolute, type JsonLdNode } from '@/lib/seo';
import type { PickerMatch } from './PoolPicker';
import { poolStr, tpl } from './strings';

export function toPickerMatches(
  fixtures: Fixture[],
  splits: Map<number, PickSplit>,
  locale: RouteLocale,
): PickerMatch[] {
  return fixtures.map((f) => {
    const split = splits.get(f.fixture.id) ?? null;
    const phase = fixturePhase(f);
    return {
      id: f.fixture.id,
      home: { name: f.teams.home.name, logo: f.teams.home.logo },
      away: { name: f.teams.away.name, logo: f.teams.away.logo },
      iso: f.fixture.date,
      phase,
      goals: f.goals,
      elapsed: f.fixture.status.elapsed,
      href: matchPath(locale, f),
      split: split ? { home: split.pct.home, draw: split.pct.draw, away: split.pct.away } : null,
      correct: split && phase === 'finished' ? correctShare(split, f.goals) : null,
    };
  });
}

// schema.org EventStatusType has no "live"/"finished" member: a played match
// stays EventScheduled; only abnormal states flip.
function eventStatus(f: Fixture): string {
  const s = f.fixture.status.short;
  if (s === 'PST') return 'https://schema.org/EventPostponed';
  if (s === 'CANC' || s === 'ABD') return 'https://schema.org/EventCancelled';
  return 'https://schema.org/EventScheduled';
}

/** ItemList of the round's matches as SportsEvent nodes. */
export function roundEventsNode(name: string, fixtures: Fixture[], locale: RouteLocale, pagePath: string): JsonLdNode {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${absolute(pagePath)}#matches`,
    name,
    numberOfItems: fixtures.length,
    itemListElement: fixtures.map((f, i) => {
      const event: Record<string, unknown> = {
        '@type': 'SportsEvent',
        name: `${f.teams.home.name} vs ${f.teams.away.name}`,
        sport: 'Soccer',
        startDate: f.fixture.date,
        eventStatus: eventStatus(f),
        homeTeam: { '@type': 'SportsTeam', name: f.teams.home.name },
        awayTeam: { '@type': 'SportsTeam', name: f.teams.away.name },
        competitor: [
          { '@type': 'SportsTeam', name: f.teams.home.name },
          { '@type': 'SportsTeam', name: f.teams.away.name },
        ],
        url: absolute(matchPath(locale, f)),
      };
      if (f.fixture.venue?.name) {
        event.location = {
          '@type': 'Place',
          name: f.fixture.venue.name,
          ...(f.fixture.venue.city ? { address: f.fixture.venue.city } : {}),
        };
      }
      return { '@type': 'ListItem', position: i + 1, item: event };
    }),
  };
}

export function StatTile({ value, label, tone }: { value: ReactNode; label: string; tone?: 'gold' | 'primary' }) {
  const color = tone === 'gold' ? 'text-gold' : tone === 'primary' ? 'text-primary' : 'text-foreground';
  return (
    <div className="min-w-0 rounded-2xl border border-border bg-background/60 p-3.5">
      <div className={`font-display text-2xl leading-none font-bold break-words tabular-nums sm:text-3xl ${color}`}>{value}</div>
      <div className="mt-1.5 text-xs font-semibold text-muted-foreground">{label}</div>
    </div>
  );
}

export function AppCard({
  locale,
  href,
  campaign,
  placement,
}: {
  locale: RouteLocale;
  href: string;
  campaign: string;
  placement: string;
}) {
  const t = poolStr(locale);
  return (
    <section className="rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/15 via-surface to-surface p-5 sm:p-6">
      <p className="text-xs font-extrabold tracking-[0.14em] text-primary uppercase">Golify</p>
      <h2 className="mt-2 font-display text-xl font-bold tracking-wide uppercase sm:text-2xl">{t.appTitle}</h2>
      <p className="mt-2 leading-relaxed font-semibold text-muted-foreground">{t.appBody}</p>
      <TrackedLink
        event="quiniela_create_click"
        params={{ campaign, placement }}
        href={href}
        external
        className="mt-4 inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-extrabold text-primary-foreground transition hover:brightness-110"
      >
        {t.appCta}
      </TrackedLink>
    </section>
  );
}

export function HowItWorks({ locale }: { locale: RouteLocale }) {
  const t = poolStr(locale);
  return (
    <section>
      <h2 className="font-display text-xl font-bold tracking-wide uppercase">{t.howTitle}</h2>
      <ol className="mt-4 grid gap-3 sm:grid-cols-3">
        {t.how.map(([title, body], i) => (
          <li key={title} className="rounded-2xl border border-border bg-surface p-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-display font-bold text-primary-foreground">
              {i + 1}
            </span>
            <h3 className="mt-3 font-bold">{title}</h3>
            <p className="mt-1 text-sm leading-relaxed font-semibold text-muted-foreground">{body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** One rule-based sentence from the community split. The biggest upset among
 *  finished matches beats the clearest call among open ones. Null without
 *  community data. */
export function communityInsight(fixtures: Fixture[], splits: Map<number, PickSplit>, locale: RouteLocale): string | null {
  const t = poolStr(locale);
  let upset: { f: Fixture; pct: number } | null = null;
  let fav: { f: Fixture; pct: number; side: 'home' | 'draw' | 'away' } | null = null;
  for (const f of fixtures) {
    const s = splits.get(f.fixture.id);
    if (!s) continue;
    const ph = fixturePhase(f);
    if (ph === 'finished') {
      const pct = correctShare(s, f.goals);
      if (pct != null && (!upset || pct < upset.pct)) upset = { f, pct };
    } else if (ph === 'scheduled') {
      const side = (['home', 'draw', 'away'] as const).reduce((a, b) => (s.pct[b] > s.pct[a] ? b : a));
      if (!fav || s.pct[side] > fav.pct) fav = { f, pct: s.pct[side], side };
    }
  }
  // An "upset" only reads as one when a minority called it.
  if (upset && upset.pct < 34) {
    const { f } = upset;
    const g = f.goals;
    const result =
      g.home! > g.away!
        ? tpl(t.resultHome, { team: f.teams.home.name })
        : g.home! < g.away!
          ? tpl(t.resultAway, { team: f.teams.away.name })
          : t.resultDraw;
    return tpl(t.insightUpset, { pct: upset.pct, result, home: f.teams.home.name, away: f.teams.away.name });
  }
  if (fav) {
    const { f, side } = fav;
    const pick = side === 'home' ? f.teams.home.name : side === 'away' ? f.teams.away.name : t.drawShort.toLowerCase();
    return tpl(t.insightFav, { pct: fav.pct, pick, home: f.teams.home.name, away: f.teams.away.name });
  }
  return null;
}

export function InsightCard({ locale, text }: { locale: RouteLocale; text: string | null }) {
  if (!text) return null;
  const t = poolStr(locale);
  return (
    <section className="rounded-2xl border border-border bg-surface p-5">
      <h2 className="text-xs font-extrabold tracking-[0.14em] text-gold uppercase">{t.insightTitle}</h2>
      <p className="mt-2 leading-relaxed font-semibold">{text}</p>
    </section>
  );
}
