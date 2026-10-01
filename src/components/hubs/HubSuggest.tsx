'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import { hubPath, type HubCountry, type RouteLocale } from '@/lib/routes';

// Plan A1.4: the generic board "uses the visitor's zone with an option to
// change". The HTML is cached for everyone, so the server cannot know the
// zone; the browser does. This reads it once and, when it belongs to one of
// our hub countries, offers that country's board (kickoffs in its own clock).
// Renders nothing on the server and nothing for zones we have no hub for, so
// the cached HTML never depends on who requested it.

const ZONE_COUNTRY: [RegExp, HubCountry][] = [
  [/^America\/(Mexico_City|Monterrey|Merida|Cancun|Tijuana|Chihuahua|Hermosillo|Mazatlan|Bahia_Banderas|Matamoros|Ojinaga|Ciudad_Juarez)$/, 'mx'],
  [/^America\/Bogota$/, 'co'],
  [/^America\/(Argentina\/.+|Buenos_Aires|Cordoba|Mendoza)$/, 'ar'],
  [/^(America\/(Santiago|Punta_Arenas)|Pacific\/Easter)$/, 'cl'],
  [/^America\/Lima$/, 'pe'],
  [/^(America\/Guayaquil|Pacific\/Galapagos)$/, 'ec'],
  [/^(America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix|Anchorage|Detroit|Boise|Indiana\/.+|Kentucky\/.+|North_Dakota\/.+)|Pacific\/Honolulu)$/, 'us'],
  [/^(Europe\/Madrid|Atlantic\/Canary|Africa\/Ceuta)$/, 'es'],
  [/^America\/(Sao_Paulo|Fortaleza|Recife|Bahia|Manaus|Belem|Cuiaba|Campo_Grande|Porto_Velho|Boa_Vista|Rio_Branco|Maceio|Araguaina|Santarem|Noronha|Eirunepe)$/, 'br'],
];

function countryForZone(zone: string): HubCountry | null {
  for (const [re, cc] of ZONE_COUNTRY) if (re.test(zone)) return cc;
  return null;
}

const noop = () => () => {};
function browserZone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;
  } catch {
    return null;
  }
}

export function HubSuggest({
  locale,
  labels,
}: {
  locale: RouteLocale;
  /** Per-country CTA text, already localized ("Ver en hora de Colombia"). */
  labels: Record<HubCountry, string>;
}) {
  const zone = useSyncExternalStore(noop, browserZone, () => null);
  const cc = zone ? countryForZone(zone) : null;
  if (!cc) return null;
  return (
    <Link
      href={hubPath(locale, cc)}
      className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-extrabold text-primary transition-colors hover:bg-primary/15"
    >
      {labels[cc]} ›
    </Link>
  );
}
