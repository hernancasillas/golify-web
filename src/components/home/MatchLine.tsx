import type { Fixture } from '@/lib/api-football';
import { fixturePhase } from '@/lib/api-football';
import type { RouteLocale } from '@/lib/routes';
import { LocalTime } from '@/components/LocalTime';
import { FxRow } from '@/components/broadcast/FxRow';
import { intlLocale } from '@/lib/timezones';

const FINAL: Record<RouteLocale, string> = { es: 'Final', pt: 'Fim', en: 'FT' };

// One fixture for Home boards, as a broadcast strip: live minute, kickoff time
// or "Final", both teams, the score once there is one.
export function MatchLine({ f, locale }: { f: Fixture; locale: RouteLocale }) {
  const phase = fixturePhase(f);
  const status =
    phase === 'live' ? (
      <span data-minute>{f.fixture.status.short === 'HT' ? 'HT' : `${f.fixture.status.elapsed ?? ''}′`}</span>
    ) : phase === 'finished' ? (
      FINAL[locale]
    ) : (
      <LocalTime iso={f.fixture.date} locale={intlLocale(locale)} style="time" />
    );
  return <FxRow f={f} locale={locale} status={status} />;
}
