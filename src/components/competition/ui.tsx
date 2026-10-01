// Server-rendered building blocks of the competition pages. Layout follows
// the CEO's "Temporada" design (header, section tabs, a main column with the
// table and a side column with FAQ / scorers / next round / app), painted
// with the site's own tokens so light and dark themes both work.

import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Fixture, PlayerWithStats, StandingRow, StandingsGroup } from '@/lib/api-football';
import { fixturePhase } from '@/lib/api-football';
import type { Competition } from '@/lib/competitions';
import { competitionPath, matchPath, playerPath, poolPath, teamPath, type RouteLocale } from '@/lib/routes';
import { shortDateIn, timeIn, type ZoneRow } from '@/lib/timezones';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { SmartDownload } from '@/components/SmartDownload';
import { TrackedLink } from '@/components/analytics/Tracked';
import { cn } from '@/lib/utils';
import { fmt, groupLabel, ui, type UiStrings } from './i18n';
import { statFor, timeUnknown, zoneLabel, zonesFor, type TopKind, type Zone } from './data';

// ---- Page shell ---------------------------------------------------------------

export function PageShell({ locale, children }: { locale: RouteLocale; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />
      <main className="mx-auto max-w-6xl px-4 pt-1 pb-16 sm:px-8">{children}</main>
      <SiteFooter locale={locale} />
    </div>
  );
}

/** Main column + side column; stacks on phones (main first). */
export function TwoColumn({ main, side }: { main: ReactNode; side: ReactNode }) {
  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0">{main}</div>
      <aside className="min-w-0 space-y-6">{side}</aside>
    </div>
  );
}

export function LeagueLogo({ id, size = 44 }: { id: number; size?: number }) {
  // Logos follow the provider's CDN pattern, so the index page needs no
  // call per league just to print a crest.
  const inner = Math.round(size * 0.68);
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-white"
      style={{ width: size, height: size }}
    >
      <Image
        src={`https://media.api-sports.io/football/leagues/${id}.png`}
        alt=""
        width={inner}
        height={inner}
        unoptimized
        className="object-contain"
        style={{ width: inner, height: inner }}
      />
    </span>
  );
}

export function CompetitionHeader({
  comp,
  eyebrow,
  title,
  sub,
}: {
  comp: Competition;
  eyebrow: string;
  title: string;
  sub?: ReactNode;
}) {
  return (
    <header className="mt-5 flex items-start gap-4">
      <LeagueLogo id={comp.id} size={56} />
      <div className="min-w-0">
        <p className="text-xs font-extrabold tracking-wide text-muted-foreground uppercase">{eyebrow}</p>
        <h1 className="mt-1 font-display text-3xl leading-tight font-bold tracking-wide text-foreground uppercase sm:text-4xl">
          {title}
        </h1>
        {sub ? <div className="mt-1.5 text-sm font-semibold text-muted-foreground">{sub}</div> : null}
      </div>
    </header>
  );
}

export type SeasonTab = 'overview' | 'table' | 'fixtures' | 'scorers' | 'assists' | 'cards';

/** Section tabs of a season. Plain links (each tab is its own indexable
 *  URL), horizontally scrollable on phones instead of wrapping. */
export function SeasonTabs({
  locale,
  comp,
  seasonSlug,
  active,
  hide = [],
}: {
  locale: RouteLocale;
  comp: Competition;
  seasonSlug: string;
  active: SeasonTab | null;
  hide?: SeasonTab[];
}) {
  const t = ui(locale).tabs;
  const tabs: SeasonTab[] = (['overview', 'table', 'fixtures', 'scorers', 'assists', 'cards'] as SeasonTab[]).filter(
    (k) => !hide.includes(k),
  );
  return (
    <nav aria-label={t.overview} className="-mx-4 mt-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex min-w-max gap-1 border-b border-border">
        {tabs.map((k) => {
          const href = competitionPath(locale, comp.id, seasonSlug, k === 'overview' ? undefined : k)!;
          const on = k === active;
          return (
            <li key={k}>
              <Link
                href={href}
                aria-current={on ? 'page' : undefined}
                className={cn(
                  '-mb-px block border-b-2 px-3.5 py-2.5 text-sm font-bold whitespace-nowrap transition-colors',
                  on ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                {t[k]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function SectionTitle({ children, action, as: Tag = 'h2' }: { children: ReactNode; action?: ReactNode; as?: 'h2' | 'h3' }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <Tag className="font-display text-xl font-bold tracking-wide text-foreground uppercase">{children}</Tag>
      {action}
    </div>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('rounded-2xl border border-border bg-surface', className)}>{children}</div>;
}

export function AnswerBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6 rounded-2xl border border-primary/30 bg-surface p-5">
      <h2 className="text-sm font-extrabold tracking-wide text-primary uppercase">{title}</h2>
      <div className="mt-2 leading-relaxed font-semibold text-foreground">{children}</div>
    </section>
  );
}

// ---- Standings ------------------------------------------------------------------

function FormChips({ form, t }: { form: string | null | undefined; t: UiStrings }) {
  if (!form) return null;
  // Provider order is most recent first; we print oldest → newest.
  const letters = form.slice(0, 5).split('').reverse();
  return (
    <span className="inline-flex gap-1">
      {letters.map((c, i) => {
        const k = (c === 'W' || c === 'D' || c === 'L' ? c : null) as 'W' | 'D' | 'L' | null;
        if (!k) return null;
        return (
          <span
            key={i}
            title={t.formWords[k]}
            className={cn(
              'inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-extrabold',
              k === 'W' && 'bg-primary text-primary-foreground',
              k === 'D' && 'bg-surface-2 text-muted-foreground',
              k === 'L' && 'bg-destructive/85 text-white',
            )}
          >
            {t.formLetters[k]}
          </span>
        );
      })}
    </span>
  );
}

type Split = 'all' | 'home' | 'away';

function lineOf(r: StandingRow, split: Split) {
  if (split === 'all') return r.all;
  return (split === 'home' ? r.home : r.away) ?? null;
}

function sortedFor(rows: StandingRow[], split: Split): { row: StandingRow; pos: number }[] {
  if (split === 'all') return rows.map((row) => ({ row, pos: row.rank }));
  const pts = (r: StandingRow) => {
    const l = lineOf(r, split);
    return l ? l.win * 3 + l.draw : 0;
  };
  const gd = (r: StandingRow) => {
    const l = lineOf(r, split);
    return l ? l.goals.for - l.goals.against : 0;
  };
  const gf = (r: StandingRow) => lineOf(r, split)?.goals.for ?? 0;
  return [...rows]
    .sort((a, b) => pts(b) - pts(a) || gd(b) - gd(a) || gf(b) - gf(a) || a.rank - b.rank)
    .map((row, i) => ({ row, pos: i + 1 }));
}

function StandingsRows({
  rows,
  locale,
  split,
  zones,
  full,
}: {
  rows: StandingRow[];
  locale: RouteLocale;
  split: Split;
  zones: Map<string, Zone>;
  full: boolean;
}) {
  const t = ui(locale);
  return (
    <table className={cn('w-full text-sm', full ? 'min-w-[40rem]' : 'min-w-[20rem]')}>
      <thead>
        <tr className="border-b border-border text-left text-[11px] font-extrabold tracking-wide text-muted-foreground uppercase">
          <th className="w-10 py-2.5 pr-1 pl-4">#</th>
          <th className="px-2 py-2.5">{t.team}</th>
          <th className="px-1.5 py-2.5 text-center">{t.p}</th>
          {full ? (
            <>
              <th className="px-1.5 py-2.5 text-center">{t.w}</th>
              <th className="px-1.5 py-2.5 text-center">{t.d}</th>
              <th className="px-1.5 py-2.5 text-center">{t.l}</th>
              <th className="px-1.5 py-2.5 text-center">{t.gf}</th>
              <th className="px-1.5 py-2.5 text-center">{t.ga}</th>
            </>
          ) : null}
          <th className="px-1.5 py-2.5 text-center">{t.gd}</th>
          <th className="px-3 py-2.5 text-center">{t.pts}</th>
          {full && split === 'all' ? (
            <th className="px-3 py-2.5">
              {t.form}
              <span className="sr-only"> ({t.formHint})</span>
            </th>
          ) : null}
        </tr>
      </thead>
      <tbody>
        {sortedFor(rows, split).map(({ row, pos }) => {
          const l = lineOf(row, split);
          if (!l) return null;
          const zone = split === 'all' && row.description ? zones.get(row.description.trim()) : undefined;
          const gd = l.goals.for - l.goals.against;
          return (
            <tr key={row.team.id} className="border-b border-border/60 last:border-0">
              <td className="relative py-2.5 pr-1 pl-4 font-bold tabular-nums text-muted-foreground">
                {zone ? (
                  <span
                    title={zoneLabel(zone.description, locale)}
                    className={cn('absolute inset-y-1 left-0 w-1 rounded-r', zone.className)}
                  />
                ) : null}
                {pos}
              </td>
              <td className="px-2 py-2.5">
                <Link href={teamPath(locale, row.team)} className="flex min-w-0 items-center gap-2 font-bold hover:text-primary">
                  <Image
                    src={row.team.logo}
                    alt=""
                    width={18}
                    height={18}
                    unoptimized
                    className="h-[18px] w-[18px] shrink-0 object-contain"
                  />
                  <span className="truncate">{row.team.name}</span>
                </Link>
              </td>
              <td className="px-1.5 py-2.5 text-center tabular-nums">{l.played}</td>
              {full ? (
                <>
                  <td className="px-1.5 py-2.5 text-center tabular-nums">{l.win}</td>
                  <td className="px-1.5 py-2.5 text-center tabular-nums">{l.draw}</td>
                  <td className="px-1.5 py-2.5 text-center tabular-nums">{l.lose}</td>
                  <td className="px-1.5 py-2.5 text-center tabular-nums">{l.goals.for}</td>
                  <td className="px-1.5 py-2.5 text-center tabular-nums">{l.goals.against}</td>
                </>
              ) : null}
              <td className="px-1.5 py-2.5 text-center tabular-nums">{gd > 0 ? `+${gd}` : gd}</td>
              <td className="px-3 py-2.5 text-center font-display text-base font-bold tabular-nums">
                {split === 'all' ? row.points : l.win * 3 + l.draw}
              </td>
              {full && split === 'all' ? (
                <td className="px-3 py-2.5">
                  <FormChips form={row.form} t={t} />
                </td>
              ) : null}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function ZoneLegend({ zones, locale }: { zones: Map<string, Zone>; locale: RouteLocale }) {
  if (zones.size === 0) return null;
  return (
    <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs font-semibold text-muted-foreground">
      {[...zones.values()].map((z) => (
        <li key={z.description} className="flex items-center gap-2">
          <span aria-hidden="true" className={cn('h-3 w-1 rounded', z.className)} />
          {zoneLabel(z.description, locale)}
        </li>
      ))}
    </ul>
  );
}

/** Standings for one or several groups. `limit` trims a single-group table
 *  (hub snapshot); `splits` adds General / Local / Visitante panels driven by
 *  a CSS-only radio switch, so all three tables are in the HTML. */
export function Standings({
  groups,
  locale,
  groupNames,
  full = true,
  splits = false,
  limit,
}: {
  groups: StandingsGroup[];
  locale: RouteLocale;
  /** Display name per group (already cleaned); empty hides the heading. */
  groupNames: string[];
  full?: boolean;
  splits?: boolean;
  limit?: number;
}) {
  const t = ui(locale);
  const zones = zonesFor(groups);
  const hasSplits = splits && groups.every((g) => g.rows.every((r) => r.home && r.away));
  const panels: Split[] = hasSplits ? ['all', 'home', 'away'] : ['all'];
  const panelClass: Record<Split, string> = {
    all: 'block group-has-[#st-home:checked]/st:hidden group-has-[#st-away:checked]/st:hidden',
    home: 'hidden group-has-[#st-home:checked]/st:block',
    away: 'hidden group-has-[#st-away:checked]/st:block',
  };
  const label: Record<Split, string> = { all: t.general, home: t.homeT, away: t.awayT };
  return (
    <div className="group/st">
      {hasSplits ? (
        <div role="radiogroup" className="mb-3 inline-flex rounded-full border border-border bg-surface p-1 text-sm font-bold">
          {panels.map((p) => (
            <label
              key={p}
              className="cursor-pointer rounded-full px-3.5 py-1.5 text-muted-foreground transition-colors has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
            >
              <input type="radio" name="standings-split" id={`st-${p}`} defaultChecked={p === 'all'} className="sr-only" />
              {label[p]}
            </label>
          ))}
        </div>
      ) : null}
      {panels.map((p) => (
        <div key={p} className={hasSplits ? panelClass[p] : undefined}>
          {groups.map((g, i) => {
            const name = groupNames[i] ? groupLabel(groupNames[i], locale) : '';
            const rows = limit ? g.rows.slice(0, limit) : g.rows;
            return (
              <div key={`${p}-${i}`} className={i > 0 ? 'mt-6' : undefined}>
                {name ? <h3 className="mb-2 text-sm font-extrabold tracking-wide text-muted-foreground uppercase">{name}</h3> : null}
                <Card className="overflow-x-auto">
                  <StandingsRows rows={rows} locale={locale} split={p} zones={zones} full={full} />
                </Card>
              </div>
            );
          })}
        </div>
      ))}
      <ZoneLegend zones={zones} locale={locale} />
    </div>
  );
}

// ---- Fixtures --------------------------------------------------------------------

function StatusOrTime({ f, locale, zone }: { f: Fixture; locale: RouteLocale; zone: ZoneRow }) {
  const t = ui(locale);
  const phase = fixturePhase(f);
  if (phase === 'live') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-live">
        <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-live" />
        {f.fixture.status.elapsed != null ? `${f.fixture.status.elapsed}'` : t.live}
      </span>
    );
  }
  if (phase === 'finished') return <span className="text-xs font-extrabold text-muted-foreground uppercase">{t.finished}</span>;
  if (phase === 'off') return <span className="text-xs font-extrabold text-muted-foreground">{t.postponed}</span>;
  if (timeUnknown(f)) return <span className="text-xs font-extrabold text-muted-foreground">{t.tbd}</span>;
  return (
    <time dateTime={f.fixture.date} className="text-xs font-extrabold tabular-nums text-foreground">
      {timeIn(f.fixture.date, zone.zone, locale)}
    </time>
  );
}

/** One match line: date, both teams, score or kickoff in the reference zone,
 *  linking to the match page. `extra` renders under it (per-country times,
 *  community split). */
export function FixtureLine({
  f,
  locale,
  zone,
  showDate = true,
  extra,
}: {
  f: Fixture;
  locale: RouteLocale;
  zone: ZoneRow;
  showDate?: boolean;
  extra?: ReactNode;
}) {
  const t = ui(locale);
  const played = f.goals.home != null && f.goals.away != null && fixturePhase(f) !== 'scheduled';
  return (
    <li className="border-b border-border/60 last:border-0">
      <Link href={matchPath(locale, f)} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2">
        <div className="w-20 shrink-0 text-left">
          {showDate ? (
            <div className="text-[11px] font-bold whitespace-nowrap text-muted-foreground capitalize">
              {timeUnknown(f) ? t.tbd : shortDateIn(f.fixture.date, zone.zone, locale)}
            </div>
          ) : null}
          <StatusOrTime f={f} locale={locale} zone={zone} />
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          {(['home', 'away'] as const).map((side) => (
            <div key={side} className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2">
                <Image
                  src={f.teams[side].logo}
                  alt=""
                  width={18}
                  height={18}
                  unoptimized
                  className="h-[18px] w-[18px] shrink-0 object-contain"
                />
                <span className={cn('truncate text-sm font-bold', f.teams[side].winner ? 'text-foreground' : 'text-foreground/85')}>
                  {f.teams[side].name}
                </span>
              </span>
              {played ? (
                <span className="shrink-0 font-display text-base font-bold tabular-nums">{f.goals[side]}</span>
              ) : null}
            </div>
          ))}
        </div>
      </Link>
      {extra ? <div className="px-4 pb-3">{extra}</div> : null}
    </li>
  );
}

export function FixtureCard({ children }: { children: ReactNode }) {
  return (
    <Card>
      <ul>{children}</ul>
    </Card>
  );
}

// ---- Top lists ---------------------------------------------------------------------

function PlayerCell({ p, locale, leagueId }: { p: PlayerWithStats; locale: RouteLocale; leagueId: number }) {
  const s = statFor(p, leagueId);
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <Image
        src={p.player.photo}
        alt=""
        width={28}
        height={28}
        unoptimized
        className="h-7 w-7 shrink-0 rounded-full bg-surface-2 object-cover"
      />
      <div className="min-w-0">
        <Link href={playerPath(locale, p.player)} className="block truncate text-sm font-bold hover:text-primary">
          {p.player.name}
        </Link>
        {s ? (
          <Link href={teamPath(locale, s.team)} className="block truncate text-xs font-semibold text-muted-foreground hover:text-foreground">
            {s.team.name}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

/** Top-5 card for the side column / season overview. */
export function TopFive({
  title,
  rows,
  kind,
  locale,
  leagueId,
  href,
  note,
}: {
  title: string;
  rows: PlayerWithStats[];
  kind: TopKind;
  locale: RouteLocale;
  leagueId: number;
  href?: string | null;
  note?: string;
}) {
  const t = ui(locale);
  if (rows.length === 0) return null;
  return (
    <section>
      <SectionTitle
        as="h2"
        action={
          href ? (
            <Link href={href} className="text-sm font-bold text-primary hover:underline">
              {t.seeAll}
            </Link>
          ) : undefined
        }
      >
        {title}
      </SectionTitle>
      {note ? <p className="mt-1 text-xs font-semibold text-muted-foreground">{note}</p> : null}
      <Card className="mt-3">
        <ol>
          {rows.slice(0, 5).map((p, i) => {
            const s = statFor(p, leagueId);
            const v = kind === 'scorers' ? s?.goals.total : kind === 'assists' ? s?.goals.assists : s?.cards.yellow;
            return (
              <li key={p.player.id} className="flex items-center gap-3 border-b border-border/60 px-4 py-2.5 last:border-0">
                <span className="w-4 shrink-0 text-sm font-bold tabular-nums text-muted-foreground">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <PlayerCell p={p} locale={locale} leagueId={leagueId} />
                </div>
                <span className="shrink-0 font-display text-lg font-bold tabular-nums">{v ?? 0}</span>
              </li>
            );
          })}
        </ol>
      </Card>
    </section>
  );
}

/** Top-20 table for the scorers / assists / cards pages. */
export function TopTable({
  rows,
  kind,
  locale,
  leagueId,
}: {
  rows: PlayerWithStats[];
  kind: TopKind;
  locale: RouteLocale;
  leagueId: number;
}) {
  const t = ui(locale);
  const cols =
    kind === 'scorers'
      ? [t.goals, t.pens, t.assists, t.apps]
      : kind === 'assists'
        ? [t.assists, t.goals, t.apps]
        : [t.yellow, t.red, t.apps];
  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[34rem] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-[11px] font-extrabold tracking-wide text-muted-foreground uppercase">
            <th className="w-10 py-2.5 pl-4">#</th>
            <th className="px-2 py-2.5">{t.player}</th>
            {cols.map((c) => (
              <th key={c} className="px-2 py-2.5 text-center">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 20).map((p, i) => {
            const s = statFor(p, leagueId);
            const vals =
              kind === 'scorers'
                ? [s?.goals.total, s?.penalty?.scored, s?.goals.assists, s?.games.appearences]
                : kind === 'assists'
                  ? [s?.goals.assists, s?.goals.total, s?.games.appearences]
                  : [s?.cards.yellow, (s?.cards.red ?? 0) + (s?.cards.yellowred ?? 0), s?.games.appearences];
            return (
              <tr key={p.player.id} className="border-b border-border/60 last:border-0">
                <td className="py-2.5 pl-4 font-bold tabular-nums text-muted-foreground">{i + 1}</td>
                <td className="px-2 py-2.5">
                  <PlayerCell p={p} locale={locale} leagueId={leagueId} />
                </td>
                {vals.map((v, j) => (
                  <td
                    key={j}
                    className={cn('px-2 py-2.5 text-center tabular-nums', j === 0 && 'font-display text-base font-bold')}
                  >
                    {v ?? 0}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

// ---- App / links -------------------------------------------------------------------

export function AppPromo({
  locale,
  comp,
  round,
  roundText,
  campaign,
}: {
  locale: RouteLocale;
  comp: Competition;
  /** Current-season round number: adds the "fill in this round" link. */
  round?: number | null;
  roundText?: string;
  campaign: string;
}) {
  const t = ui(locale);
  const pool = round ? poolPath(locale, comp.id, round) : null;
  return (
    <section className="rounded-2xl border border-primary/25 bg-gradient-to-br from-surface to-band p-5">
      <p className="text-xs font-extrabold tracking-wide text-primary uppercase">{t.appKicker}</p>
      <h2 className="mt-1.5 font-display text-xl font-bold tracking-wide uppercase">{t.appTitle}</h2>
      <p className="mt-2 text-sm leading-relaxed font-semibold text-muted-foreground">{t.appBody}</p>
      <div className="mt-4 flex flex-wrap gap-2.5">
        {pool && roundText ? (
          <TrackedLink
            event="quiniela_create_click"
            params={{ league: comp.slug, round: round ?? undefined, placement: campaign }}
            href={pool}
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-extrabold text-primary-foreground"
          >
            {fmt(t.poolCta, { round: roundText })}
          </TrackedLink>
        ) : null}
        <SmartDownload variant={pool ? 'outline' : 'mint'} className="px-5 py-3">
          {t.appCta}
        </SmartDownload>
      </div>
    </section>
  );
}

export function LinkList({ title, links }: { title: string; links: { href: string; label: string; hint?: string }[] }) {
  if (links.length === 0) return null;
  return (
    <section>
      <SectionTitle>{title}</SectionTitle>
      <Card className="mt-3">
        <ul>
          {links.map((l) => (
            <li key={l.href} className="border-b border-border/60 last:border-0">
              <Link href={l.href} className="flex items-center justify-between gap-3 px-4 py-3 text-sm font-bold hover:bg-surface-2">
                <span className="min-w-0">
                  <span className="block truncate">{l.label}</span>
                  {l.hint ? <span className="block truncate text-xs font-semibold text-muted-foreground">{l.hint}</span> : null}
                </span>
                <span aria-hidden="true" className="text-muted-foreground">
                  ›
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}

// ---- Round extras --------------------------------------------------------------------

/** Compact kickoff line for a round page: the same instant in up to four
 *  markets, computed on the server from fixed IANA zones (no client JS, so
 *  the crawler reads the same times a visitor does). */
export function ZoneTimes({ iso, zones, locale }: { iso: string; zones: ZoneRow[]; locale: RouteLocale }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-muted-foreground">
      {zones.map((z) => (
        <li key={z.key}>
          <span>{z.label[locale]}</span>{' '}
          <span className="font-bold tabular-nums text-foreground">{timeIn(iso, z.zone, locale)}</span>
          <span className="sr-only"> ({shortDateIn(iso, z.zone, locale)})</span>
        </li>
      ))}
    </ul>
  );
}

/** Previous / next round links under a round page. */
export function RoundPager({
  prev,
  next,
}: {
  prev?: { href: string; label: string } | null;
  next?: { href: string; label: string } | null;
}) {
  if (!prev && !next) return null;
  return (
    <nav className="mt-6 flex items-center justify-between gap-3 text-sm font-bold">
      {prev ? (
        <Link href={prev.href} className="rounded-full border border-border bg-surface px-4 py-2 hover:border-primary/50">
          ‹ {prev.label}
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link href={next.href} className="rounded-full border border-border bg-surface px-4 py-2 hover:border-primary/50">
          {next.label} ›
        </Link>
      ) : null}
    </nav>
  );
}

export function EmptyNote({ children }: { children: ReactNode }) {
  return (
    <Card className="mt-3 p-5">
      <p className="text-sm leading-relaxed font-semibold text-muted-foreground">{children}</p>
    </Card>
  );
}
