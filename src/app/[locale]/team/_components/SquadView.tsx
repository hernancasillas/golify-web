import Link from 'next/link';
import { AdSlot } from '@/components/ads/AdSlot';
import { TeamCta } from '@/components/team/TeamCta';
import { Avatar, Panel } from '@/components/team/ui';
import { playerPath } from '@/lib/routes';
import { slugify } from '@/lib/slug';
import { intlLocale } from '@/lib/timezones';
import { groupByPosition, leaders, mostUsedFormation, seasonLine, type SeasonLine } from '../_lib/data';
import type { SquadData } from '../_lib/sections';
import type { TeamShell } from '../_lib/shell';
import { fill } from '../_lib/strings';

// /plantilla — the squad by position (design "Plantilla"): number, photo,
// age and this season's games, goals, assists and minutes for the club.
// Aside: most used formation (shape only: the provider's season summary says
// which formation, not who played where) and the team's scorers.
export function SquadView({ s, data }: { s: TeamShell; data: SquadData }) {
  const { L, locale, team } = s;
  const id = team.id;
  const hasStats = data.players.length > 0;
  const lines = new Map<number, SeasonLine>(data.players.map((p) => [p.player.id, seasonLine(p, id)]));
  const rows = data.squad
    .map((p) => ({ ...p, line: lines.get(p.id) ?? null }))
    .sort((a, b) => (a.number ?? 999) - (b.number ?? 999) || a.name.localeCompare(b.name));
  const groups = groupByPosition(rows);
  const scorers = leaders(data.players, id, (l) => l.goals, 6);
  const formation = mostUsedFormation(data.stats);
  const leaguePlayed = data.stats?.fixtures.played.total ?? 0;
  const season = s.seasonText ?? '';

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8">
      <div className="flex min-w-0 flex-col gap-6">
        <nav aria-label={L.tabs.squad} className="flex flex-wrap gap-2">
          {groups.map((g) => (
            <a
              key={g.position ?? 'other'}
              href={`#${slugify(L.positions[g.position ?? 'other'])}`}
              className="inline-flex h-10 items-center rounded-full border border-border px-4 text-sm font-semibold whitespace-nowrap transition-colors hover:border-primary/50 hover:text-primary"
            >
              {L.positionsShort[g.position ?? ''] ?? L.positions[g.position ?? 'other']}
            </a>
          ))}
        </nav>

        {groups.map((g, gi) => (
          <div key={g.position ?? 'other'} className="flex flex-col gap-6">
            <Panel
              id={slugify(L.positions[g.position ?? 'other'])}
              title={L.positions[g.position ?? 'other']}
              aside={fill(L.squadCount, { n: String(g.rows.length) })}
              flush
            >
              <div className="overflow-x-auto px-2 pb-2">
                <table className="w-full table-fixed text-sm">
                  <thead>
                    <tr className="text-left text-xs font-bold tracking-wider whitespace-nowrap text-muted-foreground uppercase">
                      <th scope="col" className="w-12 px-3 py-2.5">{L.cols.number}</th>
                      <th scope="col" className="px-3 py-2.5">{L.cols.player}</th>
                      <th scope="col" className="hidden w-16 px-3 py-2.5 text-center sm:table-cell">{L.cols.age}</th>
                      {hasStats ? (
                        <>
                          <th scope="col" className="w-10 px-2 py-2.5 text-center sm:w-14">{L.cols.apps}</th>
                          <th scope="col" className="w-10 px-2 py-2.5 text-center sm:w-16">
                            <span className="sm:hidden">{L.colsShort.goals}</span>
                            <span className="hidden sm:inline">{L.cols.goals}</span>
                          </th>
                          <th scope="col" className="w-10 px-2 py-2.5 text-center sm:w-16">
                            <span className="sm:hidden">{L.colsShort.assists}</span>
                            <span className="hidden sm:inline">{L.cols.assists}</span>
                          </th>
                          <th scope="col" className="hidden w-24 px-3 py-2.5 text-right sm:table-cell">{L.cols.minutes}</th>
                        </>
                      ) : null}
                    </tr>
                  </thead>
                  <tbody>
                    {g.rows.map((p) => (
                      <tr key={p.id} className="border-t border-border">
                        <td className="px-3 py-2.5 font-display text-lg font-bold text-muted-foreground tabular-nums">{p.number ?? ''}</td>
                        <td className="px-3 py-2.5">
                          <Link href={playerPath(locale, p)} className="flex min-w-0 items-center gap-3 font-semibold hover:text-primary">
                            <Avatar src={p.photo} size={32} />
                            <span className="min-w-0 truncate">{p.name}</span>
                          </Link>
                        </td>
                        <td className="hidden px-3 py-2.5 text-center tabular-nums sm:table-cell">{p.age ?? ''}</td>
                        {hasStats ? (
                          <>
                            <td className="px-2 py-2.5 text-center tabular-nums">{p.line?.apps ?? 0}</td>
                            <td className="px-2 py-2.5 text-center tabular-nums">
                              {p.line?.goals ? <b>{p.line.goals}</b> : 0}
                            </td>
                            <td className="px-2 py-2.5 text-center tabular-nums">{p.line?.assists ?? 0}</td>
                            <td className="hidden px-3 py-2.5 text-right text-muted-foreground tabular-nums sm:table-cell">
                              {(p.line?.minutes ?? 0).toLocaleString(intlLocale(locale))}&apos;
                            </td>
                          </>
                        ) : null}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
            {gi === 1 ? <AdSlot label={L.ad} id="team-squad-in-content-1" format="leaderboard" indexable={data.indexable} className="my-0" /> : null}
          </div>
        ))}

        <p className="text-sm font-semibold text-muted-foreground">
          {hasStats ? fill(L.squadNote, { season, team: team.name }) : L.squadNoStats}
        </p>
      </div>

      <aside className="flex min-w-0 flex-col gap-6">
        {formation && s.compName ? (
          <Panel title={L.formation} aside={<span className="font-display text-lg font-bold text-primary">{formation.formation}</span>}>
            <FormationPitch formation={formation.formation} label={`${L.formation} ${formation.formation}`} />
            <p className="mt-3 text-sm font-semibold text-muted-foreground">
              {fill(L.formationHint, { n: String(formation.played), total: String(leaguePlayed), league: s.compName })}
            </p>
          </Panel>
        ) : null}

        {scorers.length ? (
          <Panel title={L.scorers}>
            <ol>
              {scorers.map((p, i) => (
                <li key={p.id} className="flex items-center gap-3 border-t border-border py-2.5 first:border-t-0">
                  <span className="w-4 font-display font-bold text-muted-foreground tabular-nums">{i + 1}</span>
                  <Link href={playerPath(locale, p)} className="min-w-0 flex-1 truncate font-semibold hover:text-primary">
                    {p.name}
                  </Link>
                  <span className="font-display text-xl font-bold tabular-nums">{p.value}</span>
                </li>
              ))}
            </ol>
          </Panel>
        ) : null}

        <AdSlot label={L.ad} id="team-squad-aside" format="rectangle" indexable={data.indexable} className="my-0" />

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

/** The shape of a formation ("4-2-3-1") on a half-schematic pitch: one dot
 *  per position, goalkeeper at the bottom. No names or numbers: the season
 *  summary does not say who played where. */
function FormationPitch({ formation, label }: { formation: string; label: string }) {
  const lines = formation
    .split('-')
    .map((n) => Number(n))
    .filter((n) => Number.isInteger(n) && n > 0 && n <= 6);
  if (lines.reduce((a, b) => a + b, 0) !== 10) return null;
  const all = [1, ...lines];
  return (
    <div role="img" aria-label={label} className="relative h-72 overflow-hidden rounded-xl border border-border bg-primary/10">
      <div className="absolute inset-2.5 rounded border border-foreground/15" />
      <div className="absolute inset-x-2.5 top-1/2 border-t border-foreground/15" />
      <div className="absolute inset-x-[30%] bottom-2.5 h-[16%] border border-b-0 border-foreground/15" />
      <div className="absolute inset-x-[30%] top-2.5 h-[16%] border border-t-0 border-foreground/15" />
      {all.map((count, row) => {
        const top = 90 - (row * 76) / (all.length - 1);
        return Array.from({ length: count }, (_, i) => {
          const left = ((i + 1) * 100) / (count + 1);
          return (
            <span
              key={`${row}-${i}`}
              className="absolute h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-primary"
              style={{ left: `${left}%`, top: `${top}%` }}
            />
          );
        });
      })}
    </div>
  );
}
