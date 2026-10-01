import type { Injury, TeamRef } from '@/lib/api-football';
import type { RouteLocale } from '@/lib/routes';
import { PlayerLink } from './PlayerLink';
import { Card, Logo } from './ui';

// The provider words these in English ("Missing Fixture", "Knee Injury").
// Type is translated; the reason is translated when it is one of the common
// shapes and otherwise shown as a generic injury/suspension label, so an
// untranslated English phrase never lands in the Spanish or Portuguese page.

const L = {
  es: { out: 'Baja', doubt: 'Duda', injury: 'Lesión', susp: 'Suspensión', illness: 'Enfermedad' },
  pt: { out: 'Desfalque', doubt: 'Dúvida', injury: 'Lesão', susp: 'Suspensão', illness: 'Doença' },
  en: { out: 'Out', doubt: 'Doubtful', injury: 'Injury', susp: 'Suspension', illness: 'Illness' },
} as const;

function reasonText(reason: string, l: RouteLocale): string {
  if (l === 'en') return reason;
  const t = L[l];
  if (/suspen|card/i.test(reason)) return t.susp;
  if (/illness|sick|virus/i.test(reason)) return t.illness;
  return t.injury;
}

export function InjuryList({ injuries, teams, locale }: { injuries: Injury[]; teams: TeamRef[]; locale: RouteLocale }) {
  if (injuries.length === 0) return null;
  const t = L[locale];
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {teams.map((team) => {
        const list = injuries.filter((i) => i.team.id === team.id);
        if (list.length === 0) return null;
        return (
          <Card key={team.id} className="p-4">
            <p className="flex items-center gap-2 border-b border-border pb-2.5 font-extrabold">
              <Logo src={team.logo} size={20} />
              {team.name}
            </p>
            <ul className="mt-2 space-y-1.5">
              {list.map((i) => (
                <li key={i.player.id} className="flex items-center justify-between gap-3 text-sm">
                  <PlayerLink id={i.player.id} name={i.player.name} locale={locale} className="min-w-0 truncate font-semibold hover:underline" />
                  <span className="shrink-0 text-xs font-bold text-muted-foreground">
                    {/question/i.test(i.player.type) ? t.doubt : t.out} · {reasonText(i.player.reason, locale)}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        );
      })}
    </div>
  );
}
