'use client';

import { useState } from 'react';

// Filter controls for TransferTable. Instead of re-rendering rows, it emits a
// scoped CSS rule that hides the rows that do not match: rows carry
// data-in="{club id}" when a league club signs the player and
// data-out="{club id}" when a league club lets him go.

type Tab = 'all' | 'in' | 'out';

function rule(tableId: string, tab: Tab, club: number): string {
  const sel = `#${tableId} tbody tr`;
  if (tab === 'in') return club ? `${sel}:not([data-in="${club}"]){display:none}` : `${sel}[data-in=""]{display:none}`;
  if (tab === 'out') return club ? `${sel}:not([data-out="${club}"]){display:none}` : `${sel}[data-out=""]{display:none}`;
  return club ? `${sel}:not([data-in="${club}"]):not([data-out="${club}"]){display:none}` : '';
}

export function TransferFilters({
  tableId,
  clubs,
  labels,
}: {
  tableId: string;
  clubs: { id: number; name: string }[];
  labels: { all: string; in: string; out: string; allClubs: string; clubFilter: string };
}) {
  const [tab, setTab] = useState<Tab>('all');
  const [club, setClub] = useState(0);
  const tabs: { key: Tab; label: string }[] = [
    { key: 'all', label: labels.all },
    { key: 'in', label: labels.in },
    { key: 'out', label: labels.out },
  ];
  const css = rule(tableId, tab, club);

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      {css ? <style>{css}</style> : null}
      <div role="group" aria-label={labels.all} className="flex flex-wrap gap-2">
        {tabs.map((x) => (
          <button
            key={x.key}
            type="button"
            aria-pressed={tab === x.key}
            onClick={() => setTab(x.key)}
            className={
              tab === x.key
                ? 'rounded-full bg-primary px-4 py-2 text-xs font-extrabold text-primary-foreground'
                : 'rounded-full border border-border bg-surface px-4 py-2 text-xs font-extrabold text-foreground hover:border-primary/60'
            }
          >
            {x.label}
          </button>
        ))}
      </div>
      <label className="ml-auto flex items-center text-xs font-bold">
        <span className="sr-only">{labels.clubFilter}</span>
        <select
          value={club}
          onChange={(e) => setClub(Number(e.target.value))}
          className="max-w-[12rem] rounded-full border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground"
        >
          <option value={0}>{labels.allClubs}</option>
          {clubs.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
