import Image from 'next/image';
import Link from 'next/link';
import { TransferFilters } from './TransferFilters';

// The transfer list with its "Todos / Altas / Bajas" tabs and club filter.
//
// The table is plain server HTML with every row, so crawlers and no-JS
// visitors read the full list. The filters are a tiny client island that
// only writes a CSS rule hiding the rows that do not match (via the data-in /
// data-out attributes), so the rows are never serialized a second time into
// the client payload.

export interface TransferRowView {
  key: string;
  /** Display date ("12 sep"). */
  date: string;
  iso: string;
  player: { name: string; href: string };
  from: { id: number; name: string; href: string; logo: string; inLeague: boolean };
  to: { id: number; name: string; href: string; logo: string; inLeague: boolean };
  type: string;
}

export function TransferTable({
  id,
  rows,
  clubs,
  labels,
}: {
  /** DOM id the filter rules are scoped to. */
  id: string;
  rows: TransferRowView[];
  clubs: { id: number; name: string }[];
  labels: {
    all: string;
    in: string;
    out: string;
    allClubs: string;
    clubFilter: string;
    date: string;
    player: string;
    from: string;
    to: string;
    type: string;
  };
}) {
  return (
    <div>
      <TransferFilters
        tableId={id}
        clubs={clubs}
        labels={{ all: labels.all, in: labels.in, out: labels.out, allClubs: labels.allClubs, clubFilter: labels.clubFilter }}
      />
      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <table
          id={id}
          // Cell styles live on the table (descendant variants) instead of on
          // every cell: the rows are most of the page weight.
          className="w-full min-w-[36rem] text-sm [&_tbody_td]:px-3 [&_tbody_td]:py-2.5 [&_tbody_td:first-child]:pl-4 [&_tbody_tr]:border-b [&_tbody_tr]:border-border/60 [&_tbody_tr:last-child]:border-0 [&_td_a:hover]:text-primary"
        >
          <thead>
            <tr className="border-b border-border text-left text-xs font-bold tracking-wide text-muted-foreground uppercase">
              <th className="px-4 py-2.5">{labels.date}</th>
              <th className="px-3 py-2.5">{labels.player}</th>
              <th className="px-3 py-2.5">{labels.from}</th>
              <th className="px-3 py-2.5">{labels.to}</th>
              <th className="px-3 py-2.5 text-right">{labels.type}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} data-in={r.to.inLeague ? r.to.id : ''} data-out={r.from.inLeague ? r.from.id : ''}>
                <td className="font-semibold whitespace-nowrap text-muted-foreground">
                  <time dateTime={r.iso}>{r.date}</time>
                </td>
                <td>
                  <Link href={r.player.href} className="font-bold">
                    {r.player.name}
                  </Link>
                </td>
                <td>
                  <Club c={r.from} />
                </td>
                <td>
                  <Club c={r.to} />
                </td>
                <td className="text-right font-semibold whitespace-nowrap">{r.type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Club({ c }: { c: TransferRowView['from'] }) {
  return (
    <Link href={c.href} className={c.inLeague ? 'flex items-center gap-2 font-bold' : 'flex items-center gap-2 text-muted-foreground'}>
      {c.logo ? <Image src={c.logo} alt="" width={18} height={18} unoptimized className="size-[18px] shrink-0 object-contain" /> : null}
      <span className="truncate">{c.name}</span>
    </Link>
  );
}
