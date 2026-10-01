import { CommunitySplit } from '@/components/blocks/CommunitySplit';
import { InstallCTA } from '@/components/InstallCTA';
import { TrackedLink } from '@/components/analytics/Tracked';
import { withUtm } from '@/lib/analytics';
import type { PickSplit } from '@/lib/community';
import type { RouteLocale } from '@/lib/routes';
import { installLink } from '@/lib/site';
import { TrackInstallClicks } from './TrackInstallClicks';
import { Card } from './ui';

const L = {
  es: {
    pre: '¿Quién gana? Haz tu pronóstico en Golify',
    post: 'Juega la quiniela de la próxima jornada en Golify',
    leadPre: 'Arma tu quiniela con tus amigos y compite jornada a jornada.',
    leadPost: 'Pronostica los próximos partidos con tus amigos y sigue la tabla de tu quiniela.',
    predict: 'Hacer mi pronóstico',
    open: 'Abrir en Golify',
    ios: 'Descargar para iOS',
    android: 'Descargar para Android',
  },
  pt: {
    pre: 'Quem vence? Dê seu palpite no Golify',
    post: 'Jogue o bolão da próxima rodada no Golify',
    leadPre: 'Monte seu bolão com os amigos e dispute rodada a rodada.',
    leadPost: 'Palpite nos próximos jogos com os amigos e acompanhe a classificação do seu bolão.',
    predict: 'Dar meu palpite',
    open: 'Abrir no Golify',
    ios: 'Baixar para iOS',
    android: 'Baixar para Android',
  },
  en: {
    pre: 'Who wins? Make your prediction on Golify',
    post: 'Play next round’s pool on Golify',
    leadPre: 'Set up a pool with your friends and compete round by round.',
    leadPost: 'Predict the next matches with your friends and follow your pool’s table.',
    predict: 'Make my prediction',
    open: 'Open in Golify',
    ios: 'Download for iOS',
    android: 'Download for Android',
  },
} as const;

/** App CTA with the community 1/X/2 when there is one (plan §0.6 events). */
export function PredictCta({
  locale,
  fixtureId,
  slug,
  split,
  home,
  away,
  played,
}: {
  locale: RouteLocale;
  fixtureId: number;
  slug: string;
  split: PickSplit | null;
  home: string;
  away: string;
  played: boolean;
}) {
  const t = L[locale];
  const href = withUtm(installLink(`match/${fixtureId}`, 'web_match'), 'match', slug);
  const params = { page_type: 'match', fixture_id: fixtureId, locale };
  return (
    <Card className="p-5">
      <p className="text-xs font-extrabold tracking-[0.14em] text-primary uppercase">Golify</p>
      <h2 className="mt-1 font-display text-xl leading-tight font-bold tracking-wide uppercase">{played ? t.post : t.pre}</h2>
      <p className="mt-2 text-sm font-semibold text-muted-foreground">{played ? t.leadPost : t.leadPre}</p>
      {!played && split ? (
        <div className="mt-4">
          <CommunitySplit split={split} home={home} away={away} locale={locale} compact />
        </div>
      ) : null}
      <TrackedLink
        external
        event="quiniela_create_click"
        params={params}
        href={href}
        className="mt-4 flex h-11 items-center justify-center rounded-xl bg-primary text-sm font-extrabold text-primary-foreground transition hover:brightness-105"
      >
        {t.predict}
      </TrackedLink>
      <div className="mt-3">
        <TrackInstallClicks params={params}>
          <InstallCTA deeplink={`golify://match/${fixtureId}`} labels={{ open: t.open, ios: t.ios, android: t.android }} />
        </TrackInstallClicks>
      </div>
    </Card>
  );
}
