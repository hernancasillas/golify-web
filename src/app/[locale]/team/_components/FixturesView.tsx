import Link from 'next/link';
import { AdSlot } from '@/components/ads/AdSlot';
import { TeamCta } from '@/components/team/TeamCta';
import { Crest, FixtureRow, Panel } from '@/components/team/ui';
import { competitionById, roundLabel } from '@/lib/competitions';
import { competitionPath } from '@/lib/routes';
import { intlLocale, shortDateIn } from '@/lib/timezones';
import { compSeasonSlug, currentPhase, isFinished, isFriendly, leagueLabel, nowMs, outcomeFor, zoneForCountry, type Outcome } from '../_lib/data';
import type { FixturesData } from '../_lib/sections';
import type { TeamShell } from '../_lib/shell';
import { fill } from '../_lib/strings';

const LIVE = new Set(['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE', 'INT']);

// /calendario — every match of the team's season across competitions,
// grouped by month. Played matches carry the result and the date in the
// club's time zone; upcoming ones the kickoff in the visitor's own time
// (LocalTime rewrites it on load; the server HTML says UTC, never a guess).
export function FixturesView({ s, data }: { s: TeamShell; data: FixturesData }) {
  const { L, locale, team } = s;
  const id = team.id;
  const zone = zoneForCountry(s.core.info.team.country, locale);
  const intl = intlLocale(locale);
  const fixtures = data.fixtures;
  const now = nowMs();

  const months: { key: string; label: string; rows: typeof fixtures }[] = [];
  for (const f of fixtures) {
    const d = new Date(f.fixture.date);
    const key = d.toLocaleDateString('en-CA', { timeZone: zone.zone, year: 'numeric', month: '2-digit' });
    let m = months.find((x) => x.key === key);
    if (!m) {
      const label = d.toLocaleDateString(intl, { timeZone: zone.zone, month: 'long', year: 'numeric' });
      m = { key, label, rows: [] };
      months.push(m);
    }
    m.rows.push(f);
  }

  // The summary counts official matches only (it names the competitions);
  // friendlies are still listed month by month.
  const official = fixtures.filter((f) => !isFriendly(f.league));
  const results = official.map((f) => outcomeFor(f, id)).filter((o): o is Outcome => !!o);
  const played = official.filter(isFinished).length;
  const left = official.filter((f) => ['NS', 'TBD'].includes(f.fixture.status.short)).length;
  const comps = [...new Map(fixtures.map((f) => [f.league.id, f.league])).values()];
  // Friendlies are listed but are not a competition the summary counts.
  const officialComps = comps.filter((c) => !isFriendly(c));
  const count = (o: Outcome) => String(results.filter((x) => x === o).length);

  const status = (short: string) => {
    if (LIVE.has(short)) return { text: L.live, live: true };
    if (short === 'PST') return { text: L.postponed };
    if (['CANC', 'ABD', 'AWD', 'WO'].includes(short)) return { text: L.cancelled };
    return null;
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8">
      <div className="flex min-w-0 flex-col gap-6">
        {fixtures.length ? (
          <p className="leading-relaxed font-semibold text-muted-foreground">
            {fill(L.fixturesSummary, {
              played: String(played),
              w: count('W'),
              d: count('D'),
              l: count('L'),
              left: String(left),
              comps: String(officialComps.length),
            })}
          </p>
        ) : (
          <p className="font-semibold text-muted-foreground">{L.fixturesEmpty}</p>
        )}

        {months.map((m, i) => (
          <div key={m.key} className="flex flex-col gap-6">
            <Panel title={<span className="capitalize">{m.label}</span>} aside={fill(L.matchesCount, { n: String(m.rows.length) })} flush>
              <ul>
                {m.rows.map((f) => {
                  const o = outcomeFor(f, id);
                  const upcoming = !isFinished(f) && Date.parse(f.fixture.date) > now - 3 * 3600_000;
                  const comp = competitionById(f.league.id);
                  return (
                    <FixtureRow
                      key={f.fixture.id}
                      f={f}
                      meta={isFriendly(f.league) ? leagueLabel(f.league, locale) : `${leagueLabel(f.league, locale)} · ${roundLabel(f.league.round, locale, comp)}`}
                      locale={locale}
                      teamId={id}
                      outcome={o ? { key: o, letter: L[o], title: L.wdl[o] } : null}
                      dateLabel={upcoming ? undefined : shortDateIn(f.fixture.date, zone.zone, locale)}
                      statusLabel={status(f.fixture.status.short)}
                    />
                  );
                })}
              </ul>
            </Panel>
            {i === 1 ? <AdSlot label={L.ad} id="team-fixtures-in-content-1" format="leaderboard" indexable={data.indexable} className="my-0" /> : null}
          </div>
        ))}
      </div>

      <aside className="flex min-w-0 flex-col gap-6">
        {comps.length ? (
          <Panel title={fill(L.competitions, { season: s.seasonText ?? '' })}>
            <ul className="space-y-2">
              {comps.map((c) => {
                const reg = competitionById(c.id);
                const phase = currentPhase(fixtures, c.id, now);
                const href = reg ? competitionPath(locale, c.id, compSeasonSlug(reg, c.season, reg.id === s.core.main?.id ? (s.phase ?? phase) : phase)) : null;
                const n = fixtures.filter((f) => f.league.id === c.id).length;
                const name = leagueLabel(c, locale);
                return (
                  <li key={c.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <Crest src={c.logo} size={22} />
                      {href ? (
                        <Link href={href} className="truncate font-bold hover:text-primary">
                          {name}
                        </Link>
                      ) : (
                        <span className="truncate font-bold">{name}</span>
                      )}
                    </span>
                    <span className="shrink-0 font-display font-bold tabular-nums">{n}</span>
                  </li>
                );
              })}
            </ul>
          </Panel>
        ) : null}

        <AdSlot label={L.ad} id="team-fixtures-aside" format="rectangle" indexable={data.indexable} className="my-0" />

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
