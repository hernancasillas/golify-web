// Player page blocks (server components). Each block renders only from real
// data and returns null when there is nothing to show — no placeholders.
import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Fixture, SquadPlayer, Transfer, Trophy } from '@/lib/api-football';
import { competitionById, competitionName, roundLabel } from '@/lib/competitions';
import { competitionPath, fcPath, matchPath, playerPath, teamPath, type RouteLocale } from '@/lib/routes';
import { fill } from '@/lib/site';
import { InstallCTA } from '@/components/InstallCTA';
import { LocalTime } from '@/components/LocalTime';
import { cn } from '@/lib/utils';
import type { CompetitionLine, MatchLine, PlayerPageData, SeasonTotals, Stint } from './lib/data';
import { fcPositionLabel, type FcCard } from './lib/fc';
import { countryName } from './lib/countries';
import { calendarDate, heightText, num, per90, weightText, year } from './lib/format';
import { plural, positionLabel, type Strings } from './lib/strings';
import { Card, CardTitle, Crest, Eyebrow } from './ui';

type Common = { locale: RouteLocale; L: Strings };

// ---- Hero ---------------------------------------------------------------------

export function PlayerHero({ d, locale, L, seasonLabel }: Common & { d: PlayerPageData; seasonLabel: string }) {
  const p = d.profile;
  const clubLeague = d.club?.league ? competitionName(d.club.league, locale) : null;
  const born = p.birth?.date ? calendarDate(p.birth.date, locale) : null;
  const bornPlace = [p.birth?.place, countryName(p.birth?.country, locale)].filter(Boolean).join(', ');
  const facts: [string, ReactNode][] = [];
  if (d.club) {
    facts.push([
      L.facts.club,
      <Link key="club" href={teamPath(locale, d.club.team)} className="hover:text-primary">
        {d.club.team.name}
      </Link>,
    ]);
  }
  const pos = positionLabel(d.position, locale);
  if (pos) facts.push([L.facts.position, pos]);
  const nat = countryName(p.nationality, locale);
  if (nat) facts.push([L.facts.nationality, nat]);
  if (d.age != null) facts.push([L.facts.age, fill(L.years, { n: String(d.age) })]);
  const h = heightText(p.height, locale);
  if (h) facts.push([L.facts.height, h]);
  const w = weightText(p.weight, locale);
  if (w) facts.push([L.facts.weight, w]);
  if (born) facts.push([L.facts.born, bornPlace ? `${born} · ${bornPlace}` : born]);
  if (d.fullName && d.fullName !== d.name) facts.push([L.facts.fullName, d.fullName]);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/15 via-surface to-surface p-5 sm:p-9">
      {d.number != null ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-6 right-2 font-display text-[150px] leading-none font-bold text-foreground/[0.05] select-none sm:-top-10 sm:right-6 sm:text-[260px]"
        >
          {d.number}
        </div>
      ) : null}
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:gap-9">
        <div className="flex h-28 w-28 shrink-0 items-end justify-center overflow-hidden rounded-3xl border border-border bg-surface-2 sm:h-40 sm:w-40">
          <Image
            src={p.photo}
            alt={d.name}
            width={160}
            height={160}
            unoptimized
            priority
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          {d.club ? (
            <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-muted-foreground">
              <Crest src={d.club.team.logo} size={24} />
              <span className="text-foreground">{d.club.team.name}</span>
              {clubLeague ? <span>· {clubLeague}</span> : null}
              {d.number != null ? <span>· {fill(L.shirt, { n: String(d.number) })}</span> : null}
            </div>
          ) : null}
          <h1 className="font-display text-4xl leading-[0.95] font-bold tracking-wide break-words text-foreground uppercase sm:text-6xl">
            {d.name}
          </h1>
          <p className="text-sm font-semibold text-muted-foreground sm:text-base">
            {fill(L.subtitle, { season: seasonLabel })}
          </p>
          {facts.length ? (
            <dl className="mt-1 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:max-w-3xl">
              {facts.map(([k, v]) => (
                <div key={k} className="flex min-w-0 flex-col gap-0.5">
                  <dt className="text-[11px] font-extrabold tracking-[0.08em] text-muted-foreground uppercase">{k}</dt>
                  <dd className="text-sm font-bold break-words text-foreground sm:text-[15px]">{v}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </div>
    </section>
  );
}

// ---- In-page section nav -------------------------------------------------------

export function SectionTabs({ items, label }: { items: [id: string, text: string][]; label: string }) {
  if (items.length < 2) return null;
  return (
    <nav aria-label={label} className="-mx-1 overflow-x-auto border-b border-border">
      <ul className="flex min-w-max gap-5 px-1 sm:gap-7">
        {items.map(([id, text], i) => (
          <li key={id}>
            <a
              href={`#${id}`}
              className={cn(
                'flex h-12 items-center text-sm font-bold whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground',
                i === 0 && 'text-foreground shadow-[inset_0_-3px_0_var(--primary)]',
              )}
            >
              {text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// ---- Season summary tiles ------------------------------------------------------

function Tile({ value, label, sub }: { value: string; label: string; sub?: string | null }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl bg-surface-2 p-4">
      <div className="font-display text-3xl leading-none font-bold text-foreground tabular-nums sm:text-4xl">{value}</div>
      <div className="text-sm font-bold text-foreground">{label}</div>
      {sub ? <div className="text-xs font-semibold text-muted-foreground">{sub}</div> : null}
    </div>
  );
}

export function SeasonSummary({
  totals,
  seasonLabel,
  isGoalkeeper,
  insights,
  locale,
  L,
}: Common & { totals: SeasonTotals | null; seasonLabel: string; isGoalkeeper: boolean; insights: string[] }) {
  return (
    <Card id="summary" labelledBy="summary-title">
      <CardTitle
        id="summary-title"
        sub={totals ? fill(L.seasonSum, { list: totals.competitions.join(', ') }) : undefined}
      >
        {fill(L.seasonTitle, { season: seasonLabel })}
      </CardTitle>
      {totals ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          <Tile
            value={num(totals.apps, locale)}
            label={L.tiles.apps}
            sub={fill(L.tiles.minutes, { n: num(totals.minutes, locale) })}
          />
          {isGoalkeeper && totals.conceded != null ? (
            <>
              <Tile value={num(totals.conceded, locale)} label={L.tiles.conceded} sub={per90(totals.conceded, totals.minutes, locale) ? fill(L.tiles.per90, { v: per90(totals.conceded, totals.minutes, locale)! }) : null} />
              {totals.saves != null ? <Tile value={num(totals.saves, locale)} label={L.tiles.saves} /> : null}
            </>
          ) : (
            <>
              <Tile
                value={num(totals.goals, locale)}
                label={L.tiles.goals}
                sub={per90(totals.goals, totals.minutes, locale) ? fill(L.tiles.per90, { v: per90(totals.goals, totals.minutes, locale)! }) : null}
              />
              <Tile
                value={num(totals.assists, locale)}
                label={L.tiles.assists}
                sub={per90(totals.assists, totals.minutes, locale) ? fill(L.tiles.per90, { v: per90(totals.assists, totals.minutes, locale)! }) : null}
              />
              {totals.shots != null ? (
                <Tile
                  value={num(totals.shots, locale)}
                  label={L.tiles.shots}
                  sub={totals.shotsOn != null ? fill(L.tiles.onTarget, { n: num(totals.shotsOn, locale) }) : null}
                />
              ) : null}
            </>
          )}
          {totals.passAccuracy != null ? <Tile value={`${totals.passAccuracy}%`} label={L.tiles.passAcc} /> : null}
          <Tile
            value={num(totals.yellow + totals.red, locale)}
            label={L.tiles.cards}
            sub={`${plural(L.tiles.cardsYellow, totals.yellow, locale)} · ${plural(L.tiles.cardsRed, totals.red, locale)}`}
          />
        </div>
      ) : (
        <p className="font-semibold text-muted-foreground">{fill(L.noSeason, { season: seasonLabel })}</p>
      )}
      {insights.length ? (
        <ul className="mt-5 space-y-2 border-t border-border pt-4">
          {insights.map((s) => (
            <li key={s} className="flex gap-2.5 text-[15px] leading-relaxed font-semibold text-foreground">
              <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              {s}
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}

// ---- Stats per competition ------------------------------------------------------

export function CompetitionTable({
  lines,
  seasons,
  seasonLabelFor,
  locale,
  L,
}: Common & { lines: CompetitionLine[]; seasons: number[]; seasonLabelFor: (s: number) => string }) {
  if (!lines.length) return null;
  const th = 'px-2.5 py-2.5 text-[11px] font-extrabold tracking-[0.08em] text-muted-foreground uppercase whitespace-nowrap';
  const td = 'px-2.5 py-2.5 tabular-nums whitespace-nowrap';
  return (
    <Card id="stats" labelledBy="stats-title">
      <CardTitle id="stats-title" sub={fill(L.byCompSub, { seasons: seasons.map(seasonLabelFor).join(' · ') })}>
        {L.byComp}
      </CardTitle>
      <div className="-mx-1 overflow-x-auto">
        <table className="w-full min-w-[600px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th scope="col" className={th}>{L.th.competition}</th>
              <th scope="col" className={th}>{L.th.team}</th>
              <th scope="col" className={cn(th, 'text-right')}>{L.th.apps}</th>
              <th scope="col" className={cn(th, 'text-right')}>{L.th.minutes}</th>
              <th scope="col" className={cn(th, 'text-right')}>{L.th.goals}</th>
              <th scope="col" className={cn(th, 'text-right')}>{L.th.assists}</th>
              <th scope="col" className={cn(th, 'text-right')}>{L.th.cards}</th>
              <th scope="col" className={cn(th, 'text-right')}>{L.th.rating}</th>
            </tr>
          </thead>
          {seasons.map((s) => (
            <tbody key={s}>
              <tr>
                <th colSpan={8} scope="colgroup" className="bg-surface-2 px-2.5 py-2 text-left text-xs font-extrabold tracking-wide text-foreground uppercase">
                  {fill(L.seasonTitle, { season: seasonLabelFor(s) })}
                </th>
              </tr>
              {lines
                .filter((l) => l.season === s)
                .sort((a, b) => Number(!!b.competition) - Number(!!a.competition) || b.minutes - a.minutes)
                .map((l) => {
                  const href = l.competition ? competitionPath(locale, l.competition.id) : null;
                  const name = l.competition ? competitionName(l.competition, locale) : l.leagueName;
                  return (
                    <tr key={`${s}-${l.leagueId}-${l.team.id}`} className="border-b border-border last:border-0">
                      <td className="px-2.5 py-2.5 font-bold">
                        {href ? (
                          <Link href={href} className="hover:text-primary">
                            {name}
                          </Link>
                        ) : (
                          name
                        )}
                      </td>
                      <td className="px-2.5 py-2.5 font-semibold">
                        <span className="flex items-center gap-2 whitespace-nowrap">
                          <Crest src={l.team.logo} size={18} />
                          {l.national ? (
                            l.team.name
                          ) : (
                            <Link href={teamPath(locale, l.team)} className="hover:text-primary">
                              {l.team.name}
                            </Link>
                          )}
                        </span>
                      </td>
                      <td className={cn(td, 'text-right font-bold')}>{l.apps}</td>
                      <td className={cn(td, 'text-right')}>{num(l.minutes, locale)}</td>
                      <td className={cn(td, 'text-right font-bold')}>{l.goals}</td>
                      <td className={cn(td, 'text-right')}>{l.assists}</td>
                      <td className={cn(td, 'text-right')}>
                        {l.yellow}
                        <span className="text-muted-foreground"> / </span>
                        {l.red}
                      </td>
                      <td className={cn(td, 'text-right')}>{l.rating != null ? num(l.rating, locale, 2) : '—'}</td>
                    </tr>
                  );
                })}
            </tbody>
          ))}
        </table>
      </div>
      <p className="mt-3 text-xs font-semibold text-muted-foreground">{L.ratingNote}</p>
    </Card>
  );
}

// ---- Last matches ----------------------------------------------------------------

function contribution(m: MatchLine, L: Strings, locale: RouteLocale): string {
  if (m.status !== 'played') return L.status[m.status];
  const parts: string[] = [fill(L.minutesShort, { n: String(m.minutes ?? 0) })];
  if (m.goals) parts.push(fill(m.goals === 1 ? L.goal : L.goals, { n: num(m.goals, locale) }));
  if (m.assists) parts.push(fill(L.assist, { n: num(m.assists, locale) }));
  return parts.join(' · ');
}

const RESULT_TONE = {
  W: 'bg-primary text-primary-foreground',
  D: 'bg-surface-2 text-foreground',
  L: 'bg-foreground/80 text-background',
} as const;

export function LastMatches({ matches, teamName, locale, L }: Common & { matches: MatchLine[]; teamName: string }) {
  if (!matches.length) return null;
  return (
    <Card id="matches" labelledBy="matches-title">
      <CardTitle id="matches-title" sub={fill(L.lastMatchesSub, { team: teamName })}>
        {L.lastMatches}
      </CardTitle>
      <ul className="divide-y divide-border">
        {matches.map((m) => {
          const f = m.fixture;
          const c = competitionById(f.league.id);
          const pen = f.fixture.status.short === 'PEN' && f.score?.penalty?.home != null ? ` (${f.score.penalty.home}-${f.score.penalty.away} pen.)` : '';
          return (
            <li key={f.fixture.id} className="flex items-center gap-3 py-3">
              {m.result ? (
                <span
                  title={L.resultLong[m.result]}
                  className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-extrabold', RESULT_TONE[m.result])}
                >
                  <span aria-hidden="true">{L.result[m.result]}</span>
                  <span className="sr-only">{L.resultLong[m.result]}</span>
                </span>
              ) : null}
              <div className="min-w-0 flex-1">
                <Link href={matchPath(locale, f)} className="block truncate font-bold text-foreground hover:text-primary">
                  {f.teams.home.name} {f.goals.home}-{f.goals.away} {f.teams.away.name}
                  {pen}
                </Link>
                <div className="truncate text-xs font-semibold text-muted-foreground">
                  {calendarDate(f.fixture.date, locale, 'short')} ·{' '}
                  {c ? `${competitionName(c, locale)} · ${roundLabel(f.league.round, locale, c)}` : f.league.name}
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-0.5 text-right">
                <span className={cn('text-sm font-bold', m.status === 'played' ? 'text-foreground' : 'text-muted-foreground')}>
                  {contribution(m, L, locale)}
                </span>
                {m.rating != null ? (
                  <span className="text-xs font-bold text-muted-foreground">
                    {L.thMatch.rating} {num(m.rating, locale, 1)}
                  </span>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-xs font-semibold text-muted-foreground">{L.ratingNote}</p>
    </Card>
  );
}

// ---- Career / transfers / titles --------------------------------------------------

export function CareerList({ stints, locale, L }: Common & { stints: Stint[] }) {
  if (stints.length < 2) return null;
  return (
    <Card id="career" labelledBy="career-title">
      <CardTitle id="career-title" sub={L.careerNote}>
        {L.career}
      </CardTitle>
      <ol className="divide-y divide-border">
        {stints.map((s, i) => {
          const from = year(s.from);
          const to = s.current ? L.present : year(s.to);
          const span = from && to ? (from === to ? from : `${from} – ${to}`) : from ? `${from} –` : to ? `– ${to}` : '';
          return (
            <li key={`${s.team.id}-${i}`} className="flex items-center gap-3.5 py-3">
              <Crest src={s.team.logo} size={32} />
              <div className="min-w-0 flex-1">
                <Link href={teamPath(locale, s.team)} className="font-bold text-foreground hover:text-primary">
                  {s.team.name}
                </Link>
                {s.loan ? <span className="ml-1.5 text-sm font-semibold text-muted-foreground">({L.loan})</span> : null}
              </div>
              <span className="shrink-0 text-sm font-bold text-muted-foreground tabular-nums">{span}</span>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

function transferType(raw: string | null, L: Strings): string | null {
  if (!raw || raw === 'N/A' || raw === '-') return null;
  return L.transferType[raw] ?? raw;
}

export function TransfersList({ transfers, locale, L }: Common & { transfers: Transfer[] }) {
  if (!transfers.length) return null;
  return (
    <Card id="transfers" labelledBy="transfers-title">
      <CardTitle id="transfers-title">{L.transfers}</CardTitle>
      <ul className="divide-y divide-border">
        {transfers.map((tr, i) => {
          const type = transferType(tr.type, L);
          return (
            <li key={`${tr.date}-${i}`} className="flex flex-col gap-1.5 py-3 sm:flex-row sm:items-center sm:gap-4">
              <span className="w-28 shrink-0 text-sm font-bold text-muted-foreground tabular-nums">
                {calendarDate(tr.date, locale, 'short')}
              </span>
              <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1 font-bold">
                <span className="flex items-center gap-1.5">
                  <Crest src={tr.teams.out.logo} size={18} />
                  <Link href={teamPath(locale, tr.teams.out)} className="hover:text-primary">
                    {tr.teams.out.name}
                  </Link>
                </span>
                <span aria-hidden="true" className="text-muted-foreground">→</span>
                <span className="flex items-center gap-1.5">
                  <Crest src={tr.teams.in.logo} size={18} />
                  <Link href={teamPath(locale, tr.teams.in)} className="hover:text-primary">
                    {tr.teams.in.name}
                  </Link>
                </span>
              </span>
              {type ? (
                <span className="w-fit shrink-0 rounded-full bg-surface-2 px-3 py-1 text-xs font-extrabold text-foreground">{type}</span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export function TitlesList({ titles, total, L }: { titles: Trophy[]; total: number; L: Strings }) {
  if (!titles.length) return null;
  const sub = total === 1 ? L.titlesSub1 : total > titles.length ? fill(L.titlesSubN, { n: String(total) }) : fill(L.titlesSubAll, { n: String(total) });
  return (
    <Card id="titles" labelledBy="titles-title">
      <CardTitle id="titles-title" sub={sub}>
        {L.titles}
      </CardTitle>
      <ul className="grid gap-2 sm:grid-cols-2">
        {titles.map((tr, i) => (
          <li key={`${tr.league}-${tr.season}-${i}`} className="flex items-center gap-3 rounded-xl bg-surface-2 px-4 py-3">
            <span aria-hidden="true" className="text-gold">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" />
              </svg>
            </span>
            <span className="min-w-0 flex-1 font-bold">{tr.league}</span>
            <span className="shrink-0 text-sm font-bold text-muted-foreground tabular-nums">{tr.season}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

// ---- Sidebar -------------------------------------------------------------------

function NextTeam({ team, locale }: { team: Fixture['teams']['home']; locale: RouteLocale }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-2 text-center">
      <Crest src={team.logo} size={44} />
      <Link href={teamPath(locale, team)} className="text-sm font-bold hover:text-primary">
        {team.name}
      </Link>
    </div>
  );
}

export function NextMatchCard({ f, locale, L, children }: Common & { f: Fixture; children?: ReactNode }) {
  const c = competitionById(f.league.id);
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Eyebrow>{L.nextMatch}</Eyebrow>
        <span className="truncate text-xs font-bold text-muted-foreground">
          {/* Round names of uncovered competitions (club friendlies) are raw
              provider strings; only covered ones get a localized round. */}
          {c ? `${competitionName(c, locale)} · ${roundLabel(f.league.round, locale, c)}` : f.league.name}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <NextTeam team={f.teams.home} locale={locale} />
        <div className="px-1 text-center font-display text-2xl font-bold text-muted-foreground">vs</div>
        <NextTeam team={f.teams.away} locale={locale} />
      </div>
      <p className="mt-4 text-center text-sm font-bold text-foreground">
        <LocalTime iso={f.fixture.date} locale={locale} />
      </p>
      {children}
      <Link
        href={matchPath(locale, f)}
        className="mt-4 flex h-11 items-center justify-center rounded-xl border border-primary font-bold text-primary transition hover:bg-primary/10"
      >
        {L.seeMatch}
      </Link>
    </Card>
  );
}

export function FcCardBlock({ fc, locale, L }: Common & { fc: FcCard }) {
  const pos = fcPositionLabel(fc.primary_position);
  return (
    <Card id="fc" className="p-5">
      <div className="flex items-center gap-4">
        <div className="flex h-24 w-[72px] shrink-0 flex-col items-center justify-center rounded-xl border border-gold/40 bg-gold/10">
          <span className="font-display text-3xl leading-none font-bold text-gold tabular-nums">{fc.overall_rating}</span>
          {pos ? <span className="mt-1 text-xs font-extrabold text-gold">{pos}</span> : null}
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <Eyebrow tone="gold">{L.fcTitle}</Eyebrow>
          <span className="font-bold">
            {fill(L.fcLine, { r: String(fc.overall_rating) })}
            {pos ? ` · ${pos}` : ''}
          </span>
          <span className="text-xs font-semibold text-muted-foreground">{fc.game}</span>
          <Link href={fcPath(locale, fc)} className="text-sm font-bold text-primary hover:underline">
            {L.fcCard}
          </Link>
        </div>
      </div>
    </Card>
  );
}

export function SimilarPlayers({
  players,
  teamName,
  position,
  locale,
  L,
}: Common & { players: SquadPlayer[]; teamName: string; position: string | null }) {
  if (!players.length) return null;
  const posPlural = positionLabel(position, locale, true) ?? '';
  return (
    <Card className="p-5">
      <CardTitle sub={fill(L.similarSub, { position: posPlural, team: teamName })}>{L.similar}</CardTitle>
      <ul className="divide-y divide-border">
        {players.map((sp) => (
          <li key={sp.id}>
            <Link href={playerPath(locale, sp)} className="flex items-center gap-3 py-3 hover:text-primary">
              <Image
                src={sp.photo}
                alt=""
                width={40}
                height={40}
                unoptimized
                className="h-10 w-10 shrink-0 rounded-full bg-surface-2 object-cover"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-bold">{sp.name}</span>
                <span className="block text-xs font-semibold text-muted-foreground">
                  {[sp.number != null ? fill(L.shirt, { n: String(sp.number) }) : null, sp.age != null ? fill(L.years, { n: String(sp.age) }) : null]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </span>
              <span aria-hidden="true" className="text-muted-foreground">›</span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function AppCta({ name, teamName, playerId, L }: { name: string; teamName: string | null; playerId: number; L: Strings }) {
  return (
    <section className="flex flex-col gap-3.5 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 to-band p-6">
      <Eyebrow>{L.appEyebrow}</Eyebrow>
      <h2 className="font-display text-2xl leading-none font-bold tracking-wide text-foreground uppercase sm:text-3xl">
        {fill(L.appTitle, { name })}
      </h2>
      <p className="text-[15px] leading-relaxed font-semibold text-muted-foreground">
        {teamName ? fill(L.appBody, { team: teamName }) : L.appBodyNoTeam}
      </p>
      <InstallCTA deeplink={`golify://player/${playerId}`} labels={{ open: L.open, ios: L.ios, android: L.android }} />
      <p className="text-xs font-semibold text-muted-foreground">{L.noStream}</p>
    </section>
  );
}

