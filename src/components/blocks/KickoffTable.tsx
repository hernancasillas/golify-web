import { kickoffRows } from '@/lib/timezones';
import type { RouteLocale } from '@/lib/routes';

const L = {
  es: { title: 'Horario por país', country: 'País', time: 'Hora', date: 'Fecha' },
  pt: { title: 'Horário por país', country: 'País', time: 'Hora', date: 'Data' },
  en: { title: 'Kickoff time by country', country: 'Country', time: 'Time', date: 'Date' },
} as const;

// Kickoff in every market we serve, computed server-side from fixed IANA
// zones (plan A1.4). Static HTML: correct for the crawler and for a visitor
// in any country, no client JS.
export function KickoffTable({
  iso,
  locale,
  title,
  headingLevel = 'h2',
}: {
  iso: string;
  locale: RouteLocale;
  title?: string;
  headingLevel?: 'h2' | 'h3';
}) {
  const t = L[locale];
  const rows = kickoffRows(iso, locale);
  const H = headingLevel;
  return (
    <section className="mt-8">
      <H className="font-display text-lg font-bold tracking-wide uppercase">{title ?? t.title}</H>
      <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-bold tracking-wide text-muted-foreground uppercase">
              <th className="px-4 py-2.5">{t.country}</th>
              <th className="px-4 py-2.5">{t.date}</th>
              <th className="px-4 py-2.5 text-right">{t.time}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-2.5 font-semibold">{r.label}</td>
                <td className="px-4 py-2.5 font-semibold text-muted-foreground capitalize">{r.date}</td>
                <td className="px-4 py-2.5 text-right font-bold tabular-nums">{r.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
