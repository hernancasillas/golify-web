import Link from 'next/link';
import type { ReactNode } from 'react';
import { AdSlot } from '@/components/ads/AdSlot';
import { TeamCta } from '@/components/team/TeamCta';
import { Avatar, Panel } from '@/components/team/ui';
import { playerPath } from '@/lib/routes';
import { intlLocale } from '@/lib/timezones';
import { leaders, type Leader, type TeamSeasonStats } from '../_lib/data';
import type { StatsData } from '../_lib/sections';
import type { TeamShell } from '../_lib/shell';
import { fill } from '../_lib/strings';

// /estadisticas — the team's season in its main league, from the provider's
// season summary (/teams/statistics): record, goals, clean sheets, home and
// away, records and streaks, penalties, goals and cards by minute, and the
// squad leaders of that league. Blocks with no data are left out.

const BUCKETS = ['0-15', '16-30', '31-45', '46-60', '61-75', '76-90', '91-105', '106-120'];

/** The provider writes biggest results home-away; we print them from the
 *  team's side (own goals first) so "0-2" away reads as the 2-0 win it was. */
function ownSide(score: string | null, away: boolean): string | null {
  if (!score) return null;
  const m = /^(\d+)-(\d+)$/.exec(score.trim());
  if (!m) return score;
  return away ? `${m[2]}-${m[1]}` : `${m[1]}-${m[2]}`;
}

function n(v: number | null | undefined): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

export function StatsView({ s, data }: { s: TeamShell; data: StatsData }) {
  const { L, locale, team } = s;
  const id = team.id;
  const st = data.stats;
  const league = s.compName ?? '';
  const intl = intlLocale(locale);
  const played = n(st?.fixtures.played.total);

  if (!st || played === 0) {
    return (
      <div className="flex flex-col gap-6">
        <p className="font-semibold text-muted-foreground">{fill(L.statsEmpty, { team: team.name, league })}</p>
        <TeamCta
          teamId={id}
          title={fill(L.ctaTitle, { team: team.name })}
          body={fill(L.ctaBody, { team: team.name })}
          labels={{ open: L.openApp, ios: L.ios, android: L.android }}
        />
      </div>
    );
  }

  const leagueId = s.core.main?.id;
  const scorers = leaders(data.players, id, (l) => l.goals, 5, leagueId);
  const assists = leaders(data.players, id, (l) => l.assists, 5, leagueId);
  const cards = leaders(data.players, id, (l) => l.yellow + l.red * 2, 5, leagueId);
  const cardLine = new Map(
    data.players.map((p) => {
      let y = 0;
      let r = 0;
      for (const x of p.statistics) {
        if (x.team?.id !== id || x.league?.id !== leagueId) continue;
        y += n(x.cards?.yellow) + n(x.cards?.yellowred);
        r += n(x.cards?.red);
      }
      return [p.player.id, { y, r }];
    }),
  );

  const gf = n(st.goals.for.total.total);
  const ga = n(st.goals.against.total.total);
  const cs = n(st.clean_sheet.total);
  const lead = fill(L.statsLead, {
    team: team.name,
    league,
    gf: st.goals.for.average.total ?? (gf / played).toFixed(1),
    ga: st.goals.against.average.total ?? (ga / played).toFixed(1),
    cs: String(cs),
    played: String(played),
  });

  const kpis: [string, ReactNode, string?][] = [
    [L.kpi.played, played],
    [L.kpi.record, `${n(st.fixtures.wins.total)}-${n(st.fixtures.draws.total)}-${n(st.fixtures.loses.total)}`],
    [L.kpi.gf, gf, st.goals.for.average.total ? fill(L.kpi.perGame, { n: st.goals.for.average.total }) : undefined],
    [L.kpi.ga, ga, st.goals.against.average.total ? fill(L.kpi.perGame, { n: st.goals.against.average.total }) : undefined],
    [L.kpi.cleanSheets, cs],
    [L.kpi.failed, n(st.failed_to_score.total)],
  ];

  const split = (k: 'home' | 'away' | 'total') => ({
    played: n(st.fixtures.played[k]),
    w: n(st.fixtures.wins[k]),
    d: n(st.fixtures.draws[k]),
    l: n(st.fixtures.loses[k]),
    gf: n(st.goals.for.total[k]),
    ga: n(st.goals.against.total[k]),
    cs: n(st.clean_sheet[k]),
  });
  const splits: [string, ReturnType<typeof split>][] = [
    [L.homeLabel, split('home')],
    [L.awayLabel, split('away')],
    [L.totalLabel, split('total')],
  ];

  const records: [string, string | null][] = [
    [L.biggestWinHome, ownSide(st.biggest.wins.home, false)],
    [L.biggestWinAway, ownSide(st.biggest.wins.away, true)],
    [L.biggestLossHome, ownSide(st.biggest.loses.home, false)],
    [L.biggestLossAway, ownSide(st.biggest.loses.away, true)],
    [L.streakWins, n(st.biggest.streak.wins) >= 2 ? fill(L.streakValue, { n: String(st.biggest.streak.wins) }) : null],
    [L.streakDraws, n(st.biggest.streak.draws) >= 2 ? fill(L.streakValue, { n: String(st.biggest.streak.draws) }) : null],
    [L.streakLosses, n(st.biggest.streak.loses) >= 2 ? fill(L.streakValue, { n: String(st.biggest.streak.loses) }) : null],
  ];
  const shownRecords = records.filter((r): r is [string, string] => !!r[1]);

  const penTotal = n(st.penalty?.total);
  const formations = [...(st.lineups ?? [])].filter((x) => x.formation && x.played > 0).sort((a, b) => b.played - a.played);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8">
      <div className="flex min-w-0 flex-col gap-6">
        <div>
          <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
            {fill(L.statsIn, { league, season: s.eyebrow?.split(' · ').slice(1).join(' · ') || (s.seasonText ?? '') })}
          </p>
          <p className="mt-2 leading-relaxed font-semibold text-muted-foreground">{lead}</p>
        </div>

        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {kpis.map(([label, value, hint]) => (
            <div key={label} className="rounded-2xl border border-border bg-surface p-4">
              <dt className="text-xs font-bold tracking-wider text-muted-foreground uppercase">{label}</dt>
              <dd className="mt-1 font-display text-3xl font-bold tabular-nums">{value}</dd>
              {hint ? <dd className="text-xs font-semibold text-muted-foreground">{hint}</dd> : null}
            </div>
          ))}
        </dl>

        <Panel title={L.homeAway} flush>
          <div className="overflow-x-auto px-2 pb-2">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                  <th scope="col" className="px-3 py-2 text-left">
                    <span className="sr-only">{L.homeAway}</span>
                  </th>
                  {(['played', 'w', 'd', 'l', 'gf', 'ga', 'cs'] as const).map((k) => (
                    <th key={k} scope="col" className="px-2 py-2 text-center whitespace-nowrap">
                      {L.haCols[k]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {splits.map(([label, v]) => (
                  <tr key={label} className="border-t border-border">
                    <th scope="row" className="px-3 py-2.5 text-left font-bold">
                      {label}
                    </th>
                    {[v.played, v.w, v.d, v.l, v.gf, v.ga, v.cs].map((x, i) => (
                      <td key={i} className="px-2 py-2.5 text-center tabular-nums">
                        {x}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <AdSlot label={L.ad} id="team-stats-in-content-1" format="leaderboard" indexable={data.indexable} className="my-0" />

        {shownRecords.length ? (
          <Panel title={L.records}>
            <dl className="grid gap-x-8 sm:grid-cols-2">
              {shownRecords.map(([label, value]) => (
                <div key={label} className="flex items-baseline justify-between gap-4 border-t border-border py-2.5">
                  <dt className="text-sm font-semibold text-muted-foreground">{label}</dt>
                  <dd className="font-display text-lg font-bold tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        ) : null}

        <MinuteBars
          title={L.goalsByMinute}
          series={[
            { label: L.goalsFor, cls: 'bg-primary', data: st.goals.for.minute },
            { label: L.goalsAgainst, cls: 'bg-muted-foreground/60', data: st.goals.against.minute },
          ]}
        />

        <MinuteBars
          title={L.cardsByMinute}
          series={[
            { label: L.yellow, cls: 'bg-gold', data: st.cards?.yellow },
            { label: L.red, cls: 'bg-destructive', data: st.cards?.red },
          ]}
        />

        {scorers.length || assists.length || cards.length ? (
          <Panel title={fill(L.leadersTitle, { league })}>
            <div className="grid gap-6 md:grid-cols-3">
              <LeaderList title={L.topScorers} rows={scorers} s={s} />
              <LeaderList title={L.topAssists} rows={assists} s={s} />
              <LeaderList
                title={L.topCards}
                rows={cards}
                s={s}
                render={(p) => {
                  const c = cardLine.get(p.id) ?? { y: 0, r: 0 };
                  return (
                    <span className="flex items-center gap-2 font-display font-bold tabular-nums">
                      <span className="inline-flex items-center gap-1">
                        <span aria-hidden="true" className="inline-block h-3.5 w-2.5 rounded-[2px] bg-gold" />
                        <span className="sr-only">{L.yellow}</span>
                        {c.y}
                      </span>
                      {c.r ? (
                        <span className="inline-flex items-center gap-1">
                          <span aria-hidden="true" className="inline-block h-3.5 w-2.5 rounded-[2px] bg-destructive" />
                          <span className="sr-only">{L.red}</span>
                          {c.r}
                        </span>
                      ) : null}
                    </span>
                  );
                }}
              />
            </div>
          </Panel>
        ) : null}
      </div>

      <aside className="flex min-w-0 flex-col gap-6">
        {penTotal > 0 ? (
          <Panel title={L.penalties} aside={String(penTotal)}>
            <dl className="grid grid-cols-2 gap-3">
              <div>
                <dt className="text-xs font-bold tracking-wider text-muted-foreground uppercase">{L.penScored}</dt>
                <dd className="font-display text-3xl font-bold tabular-nums">{n(st.penalty.scored.total)}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold tracking-wider text-muted-foreground uppercase">{L.penMissed}</dt>
                <dd className="font-display text-3xl font-bold tabular-nums">{n(st.penalty.missed.total)}</dd>
              </div>
            </dl>
          </Panel>
        ) : null}

        {formations.length ? (
          <Panel title={L.formations}>
            <ul>
              {formations.map((f) => (
                <li key={f.formation} className="flex items-baseline justify-between gap-3 border-t border-border py-2 first:border-t-0">
                  <span className="font-display text-lg font-bold">{f.formation}</span>
                  <span className="text-sm font-semibold text-muted-foreground">
                    {fill(L.formationPlayed, { n: f.played.toLocaleString(intl) })}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        ) : null}

        <AdSlot label={L.ad} id="team-stats-aside" format="rectangle" indexable={data.indexable} className="my-0" />

        <TeamCta
          compact
          teamId={id}
          title={fill(L.ctaTitle, { team: team.name })}
          body={fill(L.ctaBody, { team: team.name })}
          labels={{ open: L.openApp, ios: L.ios, android: L.android }}
        />
      </aside>
    </div>
  );
}

function LeaderList({
  title,
  rows,
  s,
  render,
}: {
  title: string;
  rows: Leader[];
  s: TeamShell;
  render?: (p: Leader) => ReactNode;
}) {
  if (!rows.length) return null;
  return (
    <div className="min-w-0">
      <h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">{title}</h3>
      <ol className="mt-2">
        {rows.map((p) => (
          <li key={p.id} className="flex items-center gap-2.5 border-t border-border py-2 first:border-t-0">
            <Avatar src={p.photo} size={28} />
            <Link href={playerPath(s.locale, p)} className="min-w-0 flex-1 truncate text-sm font-semibold hover:text-primary">
              {p.name}
            </Link>
            {render ? render(p) : <span className="font-display text-lg font-bold tabular-nums">{p.value}</span>}
          </li>
        ))}
      </ol>
    </div>
  );
}

type Buckets = TeamSeasonStats['goals']['for']['minute'];

/** Horizontal bars per 15-minute bucket, one bar per series, scaled to the
 *  largest bucket across series. Buckets with no data in any series (extra
 *  time in a league) are dropped. */
function MinuteBars({ title, series }: { title: string; series: { label: string; cls: string; data: Buckets | undefined }[] }) {
  const val = (b: Buckets | undefined, k: string) => n(b?.[k]?.total);
  const keys = BUCKETS.filter((k) => series.some((x) => val(x.data, k) > 0));
  if (!keys.length) return null;
  const max = Math.max(...keys.flatMap((k) => series.map((x) => val(x.data, k))));
  return (
    <Panel
      title={title}
      aside={
        <span className="flex flex-wrap gap-3">
          {series.map((x) => (
            <span key={x.label} className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className={`inline-block h-2.5 w-2.5 rounded-sm ${x.cls}`} />
              {x.label}
            </span>
          ))}
        </span>
      }
    >
      <table className="w-full text-sm">
        <caption className="sr-only">{title}</caption>
        <thead className="sr-only">
          <tr>
            <th scope="col">Min</th>
            {series.map((x) => (
              <th key={x.label} scope="col">
                {x.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {keys.map((k) => (
            <tr key={k} className="border-t border-border first:border-t-0">
              <th scope="row" className="w-16 py-2 pr-3 text-left text-xs font-bold whitespace-nowrap text-muted-foreground tabular-nums">
                {k}&apos;
              </th>
              <td className="py-2">
                <div className="flex flex-col gap-1">
                  {series.map((x) => {
                    const v = val(x.data, k);
                    return (
                      <div key={x.label} className="flex items-center gap-2">
                        <span className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                          <span className={`absolute inset-y-0 left-0 rounded-full ${x.cls}`} style={{ width: `${max ? (v / max) * 100 : 0}%` }} />
                        </span>
                        <span className="w-6 text-right text-xs font-bold tabular-nums">{v}</span>
                      </div>
                    );
                  })}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}
