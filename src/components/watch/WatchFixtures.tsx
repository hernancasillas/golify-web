import Image from 'next/image';
import Link from 'next/link';
import type { Fixture } from '@/lib/api-football';
import { matchPath, type RouteLocale } from '@/lib/routes';
import { shortDateIn, timeIn, type ZoneRow } from '@/lib/timezones';
import type { Competition } from '@/lib/competitions';
import { roundLabel } from '@/lib/competitions';

const L = {
  es: { date: 'Fecha', match: 'Partido', round: 'Jornada', tbd: 'Por definir' },
  pt: { date: 'Data', match: 'Jogo', round: 'Rodada', tbd: 'A definir' },
  en: { date: 'Date', match: 'Match', round: 'Round', tbd: 'TBD' },
} as const;

// API-Football statuses for a fixture whose date is not a real kickoff yet.
const UNCONFIRMED = new Set(['TBD', 'PST', 'CANC', 'ABD', 'SUSP']);

/** Upcoming fixtures with the kickoff in each given zone, rendered on the
 *  server from fixed IANA zones: right for a crawler and for any visitor. The
 *  date column follows the first zone (the country the page is about). */
export function WatchFixtures({
  fixtures,
  zones,
  zoneHeader,
  locale,
  competition,
}: {
  fixtures: Fixture[];
  zones: ZoneRow[];
  /** Column heading per zone ("ET", "México"). */
  zoneHeader: (z: ZoneRow) => string;
  locale: RouteLocale;
  competition: Competition;
}) {
  const t = L[locale];
  if (fixtures.length === 0 || zones.length === 0) return null;
  const dateZone = zones[0].zone;
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
      <table className="w-full min-w-[30rem] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs font-bold tracking-wide text-muted-foreground uppercase">
            <th className="px-4 py-2.5">{t.date}</th>
            <th className="px-3 py-2.5">{t.match}</th>
            {zones.map((z) => (
              <th key={z.key} className="px-3 py-2.5 text-right whitespace-nowrap">
                {zoneHeader(z)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {fixtures.map((f) => {
            const tbd = UNCONFIRMED.has(f.fixture.status.short);
            return (
              <tr key={f.fixture.id} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-2.5 align-top">
                  <span className="block font-semibold whitespace-nowrap capitalize">
                    {shortDateIn(f.fixture.date, dateZone, locale)}
                  </span>
                  <span className="block text-xs font-semibold text-muted-foreground">
                    {roundLabel(f.league.round, locale, competition)}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <Link href={matchPath(locale, f)} className="flex flex-col gap-1 font-bold hover:text-primary">
                    <TeamLine name={f.teams.home.name} logo={f.teams.home.logo} />
                    <TeamLine name={f.teams.away.name} logo={f.teams.away.logo} />
                  </Link>
                </td>
                {zones.map((z) => (
                  <td key={z.key} className="px-3 py-2.5 text-right align-top font-bold tabular-nums">
                    {tbd ? (
                      <span className="text-xs font-semibold text-muted-foreground">{t.tbd}</span>
                    ) : (
                      <time dateTime={f.fixture.date}>{timeIn(f.fixture.date, z.zone, locale)}</time>
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TeamLine({ name, logo }: { name: string; logo: string }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <Image src={logo} alt="" width={18} height={18} unoptimized className="h-[18px] w-[18px] shrink-0 object-contain" />
      <span className="truncate">{name}</span>
    </span>
  );
}
