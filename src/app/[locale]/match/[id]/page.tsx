import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getFixtureById, type Fixture } from '@/lib/api-football';
import { InstallCTA } from '@/components/InstallCTA';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { DisplayHeading } from '@/components/revamp/ui';
import { LocalTime, LocalTimeScript } from '@/components/LocalTime';
import {
  SITE_NAME,
  IOS_APP_ID,
  WORLD_CUP_LEAGUE_ID,
  worldCupEventNode,
  absoluteUrl,
  fill,
  localeAlternates,
  type Locale,
} from '@/lib/site';

// SSR content page (was a client redirect funnel). Renders real match facts so
// Google AND AI answer-engines can index/cite it, with an install CTA below.
export const revalidate = 30;

type Params = { locale: string; id: string };

// ---- tiny i18n (page-local; chrome only, facts come from data) ----
const STR = {
  es: {
    vs: 'vs',
    scheduled: 'Programado',
    live: 'En vivo',
    finished: 'Finalizado',
    venue: 'Estadio',
    competition: 'Competición',
    round: 'Fase',
    kickoff: 'Inicio',
    followInApp:
      'Sigue este partido en vivo, con alineaciones, estadísticas y notificaciones en la app Golify.',
    openApp: 'Abrir en Golify',
    ios: 'Descargar para iOS',
    android: 'Descargar para Android',
    // "Dónde ver" section. We do not broadcast the match and we do not list
    // TV channels we cannot verify, so this answers the question we can
    // answer: how to follow it minute by minute, and where.
    howToTitle: 'Dónde seguir {home} vs {away} en vivo',
    howToLead:
      'El partido se sigue minuto a minuto en Golify: marcador en vivo, alineaciones, tarjetas y notificación en cuanto cae el gol.',
    howToHonest:
      'Golify no transmite el partido. Te damos el seguimiento en vivo y las estadísticas; la transmisión corre por cuenta de quien tenga los derechos en tu país.',
    howToKickoff: 'Hora de inicio, en tu horario local:',
    howToStarted: 'Comenzó, en tu horario local:',
    faqWhere: '¿Dónde seguir {home} vs {away} en vivo?',
    faqWhereA:
      'En Golify. La app da el marcador en vivo minuto a minuto, alineaciones, tarjetas y una notificación en cada gol de {home} vs {away}. Golify no transmite el partido en video.',
    faqWhen: '¿A qué hora juegan {home} y {away}?',
    faqWhenA: '{home} vs {away} comienza {when} ({competition}).',
    faqScore: '¿Cómo quedó {home} vs {away}?',
    faqScoreA: '{home} {score} {away}, en {competition}.',
    metaScheduled: '{home} vs {away}: horario y dónde seguirlo en vivo',
    metaLive: '{home} {score} {away} en vivo: minuto a minuto',
    metaFinished: '{home} {score} {away}: resultado',
    descScheduled:
      '{home} vs {away} de {competition} ({round}). Horario de inicio y seguimiento en vivo minuto a minuto, con alineaciones y alertas de gol en Golify.',
    descPlayed:
      '{home} {score} {away} en {competition} ({round}). Resultado, estadísticas y el minuto a minuto del partido en Golify.',
  },
  en: {
    vs: 'vs',
    scheduled: 'Scheduled',
    live: 'Live',
    finished: 'Finished',
    venue: 'Venue',
    competition: 'Competition',
    round: 'Round',
    kickoff: 'Kickoff',
    followInApp:
      'Follow this match live with lineups, stats and notifications in the Golify app.',
    openApp: 'Open in Golify',
    ios: 'Download for iOS',
    android: 'Download for Android',
    howToTitle: 'Where to follow {home} vs {away} live',
    howToLead:
      'Follow the match minute by minute in Golify: live score, lineups, cards and a notification the moment a goal goes in.',
    howToHonest:
      'Golify does not broadcast the match. We give you the live tracking and the stats; the video feed belongs to whoever holds the rights in your country.',
    howToKickoff: 'Kickoff, in your local time:',
    howToStarted: 'Kicked off, in your local time:',
    faqWhere: 'Where can I follow {home} vs {away} live?',
    faqWhereA:
      'In Golify. The app gives you the live minute-by-minute score, lineups, cards and a notification on every goal of {home} vs {away}. Golify does not stream the match video.',
    faqWhen: 'What time do {home} and {away} play?',
    faqWhenA: '{home} vs {away} kicks off {when} ({competition}).',
    faqScore: 'How did {home} vs {away} end?',
    faqScoreA: '{home} {score} {away}, in {competition}.',
    metaScheduled: '{home} vs {away}: kickoff time and how to follow it live',
    metaLive: '{home} {score} {away} live: minute by minute',
    metaFinished: '{home} {score} {away}: result',
    descScheduled:
      '{home} vs {away} in {competition} ({round}). Kickoff time and live minute-by-minute tracking, with lineups and goal alerts in Golify.',
    descPlayed:
      '{home} {score} {away} in {competition} ({round}). Result, stats and the full minute-by-minute in Golify.',
  },
  pt: {
    vs: 'x',
    scheduled: 'Agendado',
    live: 'Ao vivo',
    finished: 'Encerrado',
    venue: 'Estádio',
    competition: 'Competição',
    round: 'Fase',
    kickoff: 'Início',
    followInApp:
      'Acompanhe este jogo ao vivo, com escalações, estatísticas e notificações no app Golify.',
    openApp: 'Abrir no Golify',
    ios: 'Baixar para iOS',
    android: 'Baixar para Android',
    howToTitle: 'Onde acompanhar {home} x {away} ao vivo',
    howToLead:
      'O jogo é acompanhado minuto a minuto no Golify: placar ao vivo, escalações, cartões e notificação na hora do gol.',
    howToHonest:
      'O Golify não transmite o jogo. A gente entrega o acompanhamento ao vivo e as estatísticas; a transmissão é de quem tem os direitos no seu país.',
    howToKickoff: 'Horário de início, no seu horário local:',
    howToStarted: 'Começou, no seu horário local:',
    faqWhere: 'Onde acompanhar {home} x {away} ao vivo?',
    faqWhereA:
      'No Golify. O app traz o placar ao vivo minuto a minuto, escalações, cartões e notificação em cada gol de {home} x {away}. O Golify não transmite o vídeo do jogo.',
    faqWhen: 'Que horas {home} e {away} jogam?',
    faqWhenA: '{home} x {away} começa {when} ({competition}).',
    faqScore: 'Como terminou {home} x {away}?',
    faqScoreA: '{home} {score} {away}, na {competition}.',
    metaScheduled: '{home} x {away}: horário e onde acompanhar ao vivo',
    metaLive: '{home} {score} {away} ao vivo: minuto a minuto',
    metaFinished: '{home} {score} {away}: resultado',
    descScheduled:
      '{home} x {away} na {competition} ({round}). Horário de início e acompanhamento ao vivo minuto a minuto, com escalações e alertas de gol no Golify.',
    descPlayed:
      '{home} {score} {away} na {competition} ({round}). Resultado, estatísticas e o minuto a minuto do jogo no Golify.',
  },
} as const;

function t(locale: string) {
  return STR[locale as keyof typeof STR] ?? STR.es;
}

function isLiveStatus(f: Fixture): boolean {
  return ['1H', '2H', 'HT', 'ET', 'P', 'LIVE'].includes(f.fixture.status.short);
}

function statusLabel(f: Fixture, locale: string): string {
  const s = f.fixture.status.short;
  const L = t(locale);
  if (isLiveStatus(f)) return L.live;
  if (['FT', 'AET', 'PEN'].includes(s)) return L.finished;
  return L.scheduled;
}

// schema.org EventStatusType only defines Scheduled/Postponed/Cancelled/
// Rescheduled/MovedOnline — there is no "live" or "finished" member, so a
// playing/played match stays EventScheduled; we only flip the abnormal states.
function schemaEventStatus(f: Fixture): string {
  const s = f.fixture.status.short;
  if (s === 'PST') return 'https://schema.org/EventPostponed';
  if (['CANC', 'ABD'].includes(s)) return 'https://schema.org/EventCancelled';
  return 'https://schema.org/EventScheduled';
}

function title(f: Fixture, locale: string): string {
  const L = t(locale);
  const base = `${f.teams.home.name} ${L.vs} ${f.teams.away.name}`;
  const played = f.goals.home != null && f.goals.away != null;
  return played ? `${base} ${f.goals.home}-${f.goals.away}` : base;
}

/** The values every localized template for this page interpolates. */
function matchVars(f: Fixture, locale: string) {
  const L = t(locale);
  const played = f.goals.home != null && f.goals.away != null;
  return {
    home: f.teams.home.name,
    away: f.teams.away.name,
    vs: L.vs,
    score: played ? `${f.goals.home}-${f.goals.away}` : '',
    competition: f.league.name,
    round: f.league.round,
    // Templates that mention a time keep it machine-neutral: the visible
    // kickoff is rendered by <LocalTime> in the visitor's timezone, and the
    // structured data carries the ISO instant.
    when: new Date(f.fixture.date).toLocaleString(locale, {
      dateStyle: 'long',
      timeStyle: 'short',
      timeZone: 'UTC',
    }) + ' UTC',
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const f = await getFixtureById(Number(id));
  if (!f) return { title: SITE_NAME };

  const L = t(locale);
  const vars = matchVars(f, locale);

  // Search Console shows the demand as "argentina vs egypt live" and
  // "argentina vs switzerland": the fixture, plus an intent. The headline
  // matches the intent the match is actually in — a kickoff time before it
  // starts, the running score while it plays, the result once it is over.
  const played = f.goals.home != null && f.goals.away != null;
  const headline = fill(
    isLiveStatus(f) ? L.metaLive : played ? L.metaFinished : L.metaScheduled,
    vars,
  );
  // The league stays in the description and the H2, not the title: with it,
  // titles ran past 80 characters and Google cut the intent phrase off.
  const name = `${headline} | ${SITE_NAME}`;
  const desc = fill(played ? L.descPlayed : L.descScheduled, vars);
  const path = `/${locale}/match/${id}`;

  return {
    title: name,
    description: desc,
    alternates: localeAlternates(locale as Locale, `/match/${id}`),
    openGraph: {
      title: name,
      description: desc,
      url: absoluteUrl(path),
      siteName: SITE_NAME,
      type: 'website',
      images: [f.teams.home.logo, f.teams.away.logo].filter(Boolean),
    },
    twitter: { card: 'summary_large_image', title: name, description: desc },
    other: {
      'apple-itunes-app': `app-id=${IOS_APP_ID}, app-argument=golify://match/${id}`,
    },
  };
}

export default async function MatchPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, id } = await params;
  const f = await getFixtureById(Number(id));
  if (!f) notFound();

  const L = t(locale);
  const played = f.goals.home != null && f.goals.away != null;
  const kickoff = new Date(f.fixture.date);
  const isWorldCup = f.league.id === WORLD_CUP_LEAGUE_ID;

  const homeTeam = {
    '@type': 'SportsTeam',
    name: f.teams.home.name,
    logo: f.teams.home.logo,
  };
  const awayTeam = {
    '@type': 'SportsTeam',
    name: f.teams.away.name,
    logo: f.teams.away.logo,
  };

  // schema.org SportsEvent — the structured signal AI/Google parse to cite us.
  // `location` and `startDate` are required by Google; we always emit both
  // (venue fields fall back to the league's host country so the item stays
  // valid even when the API hasn't assigned a stadium yet).
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: `${f.teams.home.name} ${L.vs} ${f.teams.away.name}`,
    description: `${f.teams.home.name} ${L.vs} ${f.teams.away.name} — ${f.league.name} ${f.league.round}. ${L.followInApp}`,
    sport: 'Soccer',
    startDate: f.fixture.date,
    // Football matches run ~2h; gives Google an explicit endDate.
    endDate: new Date(kickoff.getTime() + 2 * 60 * 60 * 1000).toISOString(),
    eventStatus: schemaEventStatus(f),
    location: {
      '@type': 'Place',
      name: f.fixture.venue.name ?? f.league.country ?? f.league.name,
      address: f.fixture.venue.city ?? f.league.country ?? undefined,
    },
    image: [f.teams.home.logo, f.teams.away.logo, f.league.logo].filter(
      Boolean,
    ),
    homeTeam,
    awayTeam,
    performer: [homeTeam, awayTeam],
    organizer: isWorldCup
      ? {
          '@type': 'Organization',
          name: 'FIFA',
          url: 'https://www.fifa.com',
        }
      : { '@type': 'Organization', name: f.league.name },
    // superEvent must itself be a valid Event (name + startDate + location):
    // for World Cup matches we link the canonical tournament node by @id.
    superEvent: isWorldCup
      ? worldCupEventNode(absoluteUrl(`/${locale}/world-cup`))
      : {
          '@type': 'SportsEvent',
          name: f.league.name,
          startDate: f.fixture.date,
          location: {
            '@type': 'Place',
            name: f.league.country ?? f.league.name,
          },
        },
    url: absoluteUrl(`/${locale}/match/${id}`),
  };

  const live = isLiveStatus(f);
  const vars = matchVars(f, locale);

  // The question this page is found by. We answer the one we can answer
  // truthfully — how to follow the match — and say plainly that we do not
  // carry the broadcast, rather than inventing a channel list.
  const faqEntries = played
    ? [
        [fill(L.faqScore, vars), fill(L.faqScoreA, vars)],
        [fill(L.faqWhere, vars), fill(L.faqWhereA, vars)],
      ]
    : [
        [fill(L.faqWhere, vars), fill(L.faqWhereA, vars)],
        [fill(L.faqWhen, vars), fill(L.faqWhenA, vars)],
      ];

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${absoluteUrl(`/${locale}/match/${id}`)}#faq`,
    mainEntity: faqEntries.map(([question, answer]) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <LocalTimeScript locale={locale} />
      <SiteNav />

      <main className="mx-auto max-w-2xl px-5 pt-2 pb-16 sm:px-8">
        <p className="text-sm font-bold tracking-wide text-muted-foreground uppercase">
          {f.league.name} · {f.league.round}
        </p>

        <DisplayHeading as="h1" className="mt-3 text-3xl sm:text-4xl">
          {title(f, locale)}
        </DisplayHeading>

        {live ? (
          <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-live-glow px-3 py-1.5 text-sm font-bold text-live">
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-live" />
            {statusLabel(f, locale)}
            {f.fixture.status.elapsed ? ` · ${f.fixture.status.elapsed}'` : ''}
          </span>
        ) : (
          <p className="mt-3 text-sm font-bold text-muted-foreground">
            {statusLabel(f, locale)}
          </p>
        )}

        <div className="mt-7 flex items-center justify-between rounded-2xl border border-border bg-surface p-6">
          <div className="flex flex-1 flex-col items-center gap-2.5 text-center">
            <Image src={f.teams.home.logo} alt={f.teams.home.name} width={56} height={56} unoptimized />
            <span className="text-sm font-bold">{f.teams.home.name}</span>
          </div>
          <div className="px-4 font-display text-3xl font-bold tabular-nums">
            {played ? `${f.goals.home} - ${f.goals.away}` : L.vs}
          </div>
          <div className="flex flex-1 flex-col items-center gap-2.5 text-center">
            <Image src={f.teams.away.logo} alt={f.teams.away.name} width={56} height={56} unoptimized />
            <span className="text-sm font-bold">{f.teams.away.name}</span>
          </div>
        </div>

        <dl className="mt-7 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-bold text-muted-foreground">{L.kickoff}</dt>
            <dd className="mt-0.5 font-semibold">
              <LocalTime iso={f.fixture.date} locale={locale} />
            </dd>
          </div>
          {f.fixture.venue.name ? (
            <div>
              <dt className="font-bold text-muted-foreground">{L.venue}</dt>
              <dd className="mt-0.5 font-semibold">
                {f.fixture.venue.name}
                {f.fixture.venue.city ? `, ${f.fixture.venue.city}` : ''}
              </dd>
            </div>
          ) : null}
          <div>
            <dt className="font-bold text-muted-foreground">{L.competition}</dt>
            <dd className="mt-0.5 font-semibold">{f.league.name}</dd>
          </div>
          <div>
            <dt className="font-bold text-muted-foreground">{L.round}</dt>
            <dd className="mt-0.5 font-semibold">{f.league.round}</dd>
          </div>
        </dl>

        <section className="mt-10 rounded-2xl border border-border bg-surface p-6">
          <h2 className="font-display text-xl font-bold tracking-wide uppercase">
            {fill(L.howToTitle, vars)}
          </h2>
          <p className="mt-3 leading-relaxed font-semibold text-muted-foreground">
            {L.howToLead}
          </p>
          <p className="mt-2 leading-relaxed font-semibold text-muted-foreground">
            {played ? L.howToStarted : L.howToKickoff}{' '}
            <LocalTime iso={f.fixture.date} locale={locale} />
          </p>

          {/* These two Q&A pairs are the FAQPage in the structured data. They
              are rendered here word for word: schema that does not appear on
              the page is a rich-result penalty waiting to happen. */}
          <div className="mt-6 space-y-5">
            {faqEntries.map(([question, answer]) => (
              <div key={question}>
                <h3 className="text-sm font-bold text-foreground">{question}</h3>
                <p className="mt-1 leading-relaxed font-semibold text-muted-foreground">
                  {answer}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-5 text-sm font-semibold text-muted-foreground">
            {L.howToHonest}
          </p>

          <div className="mt-6">
            <InstallCTA
              deeplink={`golify://match/${id}`}
              labels={{ open: L.openApp, ios: L.ios, android: L.android }}
            />
          </div>
        </section>
      </main>

      <SiteFooter locale={locale as Locale} />
    </div>
  );
}
