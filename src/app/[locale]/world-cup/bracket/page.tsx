import type { Metadata } from 'next';
import Link from 'next/link';
import {
  getWorldCupStandings,
  getWorldCupFixturesForBracket,
} from '@/lib/api-football';
import { InstallCTA } from '@/components/InstallCTA';
import { SmartAppOpen } from '@/components/SmartAppOpen';
import {
  SITE_NAME,
  SITE_URL,
  IOS_APP_ID,
  WORLD_CUP_LEAGUE_ID,
  WORLD_CUP_SEASON,
  worldCupEventNode,
  localeAlternates,
  absoluteUrl,
  type Locale,
} from '@/lib/site';
import {
  generateWorldCupBracket,
  buildGroupClinch,
  buildBracketOverlay,
  type BracketMatch,
  type BracketSlot,
  type WorldCupBracket,
  type GroupClinch,
  type MatchOverlay,
  type OverlayTeam,
} from '@/lib/bracket';
import { getTeamFlagByName, getTeamCodeByName } from '@/lib/bracket/flags';

// SSR knockout bracket for the FIFA World Cup 2026. The projected Round of 32 is
// computed from the CURRENT group standings (same deterministic engine as the
// app) so Google + AI answer engines index a real, live "who plays who" bracket
// for "world cup 2026 bracket", "mundial 2026 llave/llaves", "mundial KO", etc.
export const revalidate = 300;

const DEEPLINK = 'golify://world-cup';

type Params = { locale: string };

// ---- page-local i18n (chrome only; team facts come from the API) ----
interface LocaleStrings {
  kicker: string;
  title: string;
  h1: string;
  intro: string;
  howTitle: string;
  howBody: string;
  legendProjected: string;
  legendConfirmed: string;
  live: string;
  finalLabel: string;
  updated: string;
  partialNote: string;
  rounds: { R32: string; R16: string; QF: string; SF: string; F: string; P3: string };
  winner: string;
  loser: string;
  first: string;
  second: string;
  third: string;
  group: string;
  seeMatches: string;
  backToHub: string;
  followTitle: string;
  followBody: string;
  openApp: string;
  ios: string;
  android: string;
  faqTitle: string;
  faqs: { q: string; a: string }[];
}

const STR: Record<'es' | 'en', LocaleStrings> = {
  es: {
    kicker: 'Mundial 2026',
    title: 'Bracket Mundial 2026: llave y proyección de eliminatorias',
    h1: 'Bracket del Mundial 2026 — Llave de eliminatorias',
    intro:
      'Así quedaría la llave del Mundial 2026 si la fase de grupos terminara ahora mismo. Esta es la proyección en vivo del bracket de eliminatorias —dieciseisavos (Round of 32), octavos, cuartos, semifinales y la final— calculada con las posiciones actuales de los 12 grupos, incluyendo los 8 mejores terceros según el cuadro oficial de la FIFA. Se actualiza automáticamente conforme avanzan los resultados.',
    howTitle: 'Cómo se arma esta proyección',
    howBody:
      'No es una predicción ni una simulación: es determinista. Tomamos la tabla actual de cada grupo (puntos, diferencia de goles, goles a favor) y colocamos a 1°, 2° y a los 8 mejores terceros en su casilla según el reglamento del Mundial 2026. Cuando una posición ya es matemáticamente segura, la marcamos como Confirmado ✓; mientras pueda cambiar, es una Proyección. Las rondas posteriores a dieciseisavos muestran al ganador proyectado de cada cruce.',
    legendProjected: 'Proyección',
    legendConfirmed: 'Confirmado',
    live: 'En vivo',
    finalLabel: 'Final',
    updated: 'Actualizado',
    partialNote:
      'Aún no se pueden proyectar todos los terceros: faltan grupos por definir su top 3. Las casillas de tercero se completan cuando los 12 grupos tengan posiciones determinables.',
    rounds: {
      R32: 'Dieciseisavos',
      R16: 'Octavos',
      QF: 'Cuartos',
      SF: 'Semifinales',
      F: 'Final',
      P3: 'Tercer lugar',
    },
    winner: 'Ganador',
    loser: 'Perdedor',
    first: '1°',
    second: '2°',
    third: '3°',
    group: 'Grupo',
    seeMatches: 'Ver calendario y resultados del Mundial',
    backToHub: '← Mundial 2026',
    followTitle: 'Sigue la llave en vivo en Golify',
    followBody:
      'Golify recalcula el bracket del Mundial 2026 en tiempo real, con resultados en vivo, alineaciones y notificaciones de cada partido de eliminatorias.',
    openApp: 'Abrir en Golify',
    ios: 'Descargar para iOS',
    android: 'Descargar para Android',
    faqTitle: 'Preguntas frecuentes sobre la llave del Mundial 2026',
    faqs: [
      {
        q: '¿Cómo funciona el bracket del Mundial 2026?',
        a: 'El Mundial 2026 tiene 48 selecciones en 12 grupos. Avanzan los dos primeros de cada grupo más los 8 mejores terceros (32 equipos), que arrancan en los dieciseisavos de final (Round of 32). De ahí siguen octavos, cuartos, semifinales y la final el 19 de julio de 2026.',
      },
      {
        q: '¿Esta llave es una predicción?',
        a: 'No. Es una proyección determinista: muestra cómo quedarían los cruces si la fase de grupos terminara con las posiciones actuales. No simula ni adivina resultados futuros.',
      },
      {
        q: '¿Qué significa "Confirmado"?',
        a: 'Que esa posición de grupo ya es matemáticamente segura sin importar los resultados que falten. Si todavía puede cambiar, la casilla aparece como "Proyección".',
      },
      {
        q: '¿Cómo se eligen los 8 mejores terceros?',
        a: 'Se rankean los 12 terceros de cada grupo por puntos, diferencia de goles y goles a favor. Los 8 mejores clasifican y se asignan a una casilla de octavos según el cuadro oficial (Anexo C) del reglamento del Mundial 2026.',
      },
    ],
  },
  en: {
    kicker: 'World Cup 2026',
    title: 'World Cup 2026 Bracket: knockout stage projection',
    h1: 'World Cup 2026 Bracket — Knockout stage',
    intro:
      "Here's how the World Cup 2026 bracket would look if the group stage ended right now. This is the live knockout projection — Round of 32, Round of 16, quarter-finals, semi-finals and the final — built from the current standings of all 12 groups, including the 8 best third-placed teams per FIFA's official table. It updates automatically as results come in.",
    howTitle: 'How this projection is built',
    howBody:
      "It's not a prediction or a simulation — it's deterministic. We take each group's current table (points, goal difference, goals for) and place 1st, 2nd and the 8 best third-placed teams into their slots per the World Cup 2026 regulations. Once a position is mathematically secure we mark it Confirmed ✓; while it can still change it's a Projection. Rounds beyond the Round of 32 show the projected winner of each tie.",
    legendProjected: 'Projection',
    legendConfirmed: 'Confirmed',
    live: 'Live',
    finalLabel: 'Full time',
    updated: 'Updated',
    partialNote:
      "Third-placed teams can't all be projected yet — some groups still need a determinable top 3. Third-place slots fill in once all 12 groups have decidable positions.",
    rounds: {
      R32: 'Round of 32',
      R16: 'Round of 16',
      QF: 'Quarter-finals',
      SF: 'Semi-finals',
      F: 'Final',
      P3: 'Third place',
    },
    winner: 'Winner',
    loser: 'Loser',
    first: '1st',
    second: '2nd',
    third: '3rd',
    group: 'Group',
    seeMatches: 'See the World Cup schedule and results',
    backToHub: '← World Cup 2026',
    followTitle: 'Follow the live bracket on Golify',
    followBody:
      'Golify recalculates the World Cup 2026 bracket in real time, with live scores, lineups and notifications for every knockout match.',
    openApp: 'Open in Golify',
    ios: 'Download for iOS',
    android: 'Download for Android',
    faqTitle: 'World Cup 2026 bracket — frequently asked questions',
    faqs: [
      {
        q: 'How does the World Cup 2026 bracket work?',
        a: 'The 2026 World Cup has 48 teams in 12 groups. The top two of each group plus the 8 best third-placed teams advance (32 teams), starting in the Round of 32. From there it goes to the Round of 16, quarter-finals, semi-finals and the final on 19 July 2026.',
      },
      {
        q: 'Is this bracket a prediction?',
        a: "No. It's a deterministic projection: it shows the matchups if the group stage ended with the current standings. It does not simulate or guess future results.",
      },
      {
        q: 'What does "Confirmed" mean?',
        a: "It means that group position is already mathematically locked regardless of remaining results. If it can still change, the slot shows as a 'Projection'.",
      },
      {
        q: 'How are the 8 best third-placed teams chosen?',
        a: "The 12 third-placed teams are ranked by points, goal difference and goals for. The best 8 qualify and are assigned to a Round-of-32 slot per the official table (Annex C) of the World Cup 2026 regulations.",
      },
    ],
  },
};

function t(locale: string): LocaleStrings {
  return STR[locale as keyof typeof STR] ?? STR.es;
}

type Strings = LocaleStrings;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale } = await params;
  const L = t(locale);
  const desc = L.intro;
  const keywords =
    locale === 'en'
      ? [
          'world cup 2026 bracket',
          'world cup 2026 knockout bracket',
          'world cup bracket projection',
          'round of 32 world cup 2026',
          'world cup 2026 KO stage',
        ]
      : [
          'mundial 2026 bracket',
          'mundial 2026 llave',
          'llave mundial 2026',
          'bracket mundial 2026',
          'mundial 2026 eliminatorias',
          'mundial 2026 octavos',
          'cuadro mundial 2026',
          'mundial KO 2026',
        ];
  return {
    title: `${L.title} | ${SITE_NAME}`,
    description: desc,
    keywords,
    alternates: localeAlternates(locale as Locale, '/world-cup/bracket'),
    openGraph: {
      title: `${L.title} | ${SITE_NAME}`,
      description: desc,
      url: absoluteUrl(`/${locale}/world-cup/bracket`),
      siteName: SITE_NAME,
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title: L.title, description: desc },
    other: {
      'apple-itunes-app': `app-id=${IOS_APP_ID}, app-argument=${DEEPLINK}`,
    },
  };
}

// ─── slot helpers ──────────────────────────────────────────────────────────

/** A group position is "locked" when only one team can still finish there. */
function positionLocked(
  clinch: Map<string, GroupClinch>,
  group: string,
  position: number,
): boolean {
  const occ = clinch.get(group)?.positionOccupants.get(position);
  return !!occ && occ.size === 1;
}

/** True when this side's participant is settled (real team in a locked slot). */
function slotLocked(slot: BracketSlot, clinch: Map<string, GroupClinch>): boolean {
  if (!slot.team) return false;
  if (slot.source.type === 'group') {
    return positionLocked(clinch, slot.source.group, slot.source.position);
  }
  return false;
}

/** Localized placeholder for an undetermined slot (e.g. "1° Grupo A", "Ganador 74"). */
function slotLabel(slot: BracketSlot, L: Strings): string {
  const s = slot.source;
  switch (s.type) {
    case 'group':
      return `${s.position === 1 ? L.first : s.position === 2 ? L.second : L.third} ${L.group} ${s.group}`;
    case 'thirdPlacePending':
      return `${L.third} ${L.group} ${s.eligibleGroups.join('/')}`;
    case 'matchWinner':
      return `${L.winner} ${s.matchNumber}`;
    case 'matchLoser':
      return `${L.loser} ${s.matchNumber}`;
  }
}

const FINISHED_STATUS = new Set(['FT', 'AET', 'PEN']);
const LIVE_STATUS = new Set(['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE', 'INT']);

function fmtDate(date: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

// ─── presentational pieces (server-rendered) ────────────────────────────────

/** One side of a match card. A resolved `team` wins over the placeholder. */
function SlotRow({
  team,
  placeholder,
  locked,
  score,
  winner,
  dim,
  L,
}: {
  team: OverlayTeam | null;
  placeholder: string;
  locked: boolean;
  score: number | null;
  winner: boolean;
  dim: boolean;
  L: Strings;
}) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5">
      {team ? (
        <>
          <span className="text-base leading-none">
            {getTeamFlagByName(team.name) || '⚽'}
          </span>
          <span
            className={`flex-1 truncate text-sm ${winner ? 'font-bold' : 'font-medium'} ${
              dim ? 'text-neutral-400 dark:text-neutral-500' : ''
            }`}
            title={team.name}
          >
            {getTeamCodeByName(team.name)}
          </span>
        </>
      ) : (
        <>
          <span className="text-base leading-none text-neutral-400">•</span>
          <span className="flex-1 truncate text-sm text-neutral-500 dark:text-neutral-400">
            {placeholder}
          </span>
        </>
      )}
      {score != null ? (
        <span
          className={`text-sm tabular-nums ${winner ? 'font-bold' : ''} ${
            dim ? 'text-neutral-400' : ''
          }`}
        >
          {score}
        </span>
      ) : locked ? (
        <span
          className="text-xs text-green-600"
          title={L.legendConfirmed}
          aria-label={L.legendConfirmed}
        >
          ✓
        </span>
      ) : null}
    </div>
  );
}

function MatchCard({
  match,
  overlay,
  clinch,
  locale,
  L,
}: {
  match: BracketMatch;
  overlay: Map<number, MatchOverlay>;
  clinch: Map<string, GroupClinch>;
  locale: string;
  L: Strings;
}) {
  const ov = overlay.get(match.matchNumber);
  const fx = ov?.fixture ?? null;
  const home = ov?.home ?? null;
  const away = ov?.away ?? null;

  const isFinished = !!fx && FINISHED_STATUS.has(fx.statusShort);
  const isLive = !!fx && LIVE_STATUS.has(fx.statusShort);
  const isScheduled = !!fx && !isFinished && !isLive;

  // Align fixture goals to our home/away (fixture home may differ).
  let homeScore: number | null = null;
  let awayScore: number | null = null;
  if (fx) {
    const homeIsFixtureHome = home?.id === fx.homeId;
    homeScore = homeIsFixtureHome ? fx.homeGoals : fx.awayGoals;
    awayScore = homeIsFixtureHome ? fx.awayGoals : fx.homeGoals;
  }

  const winnerId = isFinished ? ov?.winnerId ?? null : null;
  const homeWinner = winnerId != null && home?.id === winnerId;
  const awayWinner = winnerId != null && away?.id === winnerId;
  const homeDim = winnerId != null && !homeWinner;
  const awayDim = winnerId != null && !awayWinner;

  // R32 clinch ticks only matter while there's no real fixture yet.
  const homeLocked = !fx && slotLocked(match.home, clinch);
  const awayLocked = !fx && slotLocked(match.away, clinch);
  const confirmed =
    !fx && !!match.home.team && !!match.away.team && homeLocked && awayLocked;

  let label: string;
  let headerClass: string;
  if (isFinished) {
    label = L.finalLabel;
    headerClass =
      'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400';
  } else if (isLive) {
    label = fx && fx.elapsed != null ? `${fx.elapsed}'` : L.live;
    headerClass = 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400';
  } else if (isScheduled && fx) {
    label = fmtDate(fx.date, locale);
    headerClass =
      'bg-neutral-50 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300';
  } else {
    label = confirmed ? L.legendConfirmed : L.legendProjected;
    headerClass = confirmed
      ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400'
      : 'bg-neutral-50 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400';
  }

  const cardClass = `block w-40 shrink-0 overflow-hidden rounded-lg border bg-white shadow-sm sm:w-44 dark:bg-neutral-900 ${
    isLive
      ? 'border-red-300 dark:border-red-800'
      : 'border-neutral-200 dark:border-neutral-700'
  } ${fx ? 'hover:border-green-400 dark:hover:border-green-700' : ''}`;

  const body = (
    <>
      <div
        className={`flex items-center justify-between px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${headerClass}`}
      >
        <span>P{match.matchNumber}</span>
        <span>{label}</span>
      </div>
      <SlotRow
        team={home}
        placeholder={slotLabel(match.home, L)}
        locked={homeLocked}
        score={homeScore}
        winner={homeWinner}
        dim={homeDim}
        L={L}
      />
      <div className="border-t border-neutral-100 dark:border-neutral-800" />
      <SlotRow
        team={away}
        placeholder={slotLabel(match.away, L)}
        locked={awayLocked}
        score={awayScore}
        winner={awayWinner}
        dim={awayDim}
        L={L}
      />
    </>
  );

  // Real fixtures link to the match page; projections link nowhere (the rows
  // would otherwise nest <a>s). Undetermined slots stay static.
  return fx ? (
    <Link href={`/${locale}/match/${fx.id}`} className={cardClass}>
      {body}
    </Link>
  ) : (
    <div className={cardClass}>{body}</div>
  );
}

function RoundColumn({
  title,
  matches,
  overlay,
  clinch,
  locale,
  L,
}: {
  title: string;
  matches: BracketMatch[];
  overlay: Map<number, MatchOverlay>;
  clinch: Map<string, GroupClinch>;
  locale: string;
  L: Strings;
}) {
  return (
    <div className="flex flex-col">
      <h3 className="mb-3 text-center text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
        {title}
      </h3>
      <div className="flex flex-1 flex-col justify-around gap-3">
        {matches.map((m) => (
          <MatchCard
            key={m.matchNumber}
            match={m}
            overlay={overlay}
            clinch={clinch}
            locale={locale}
            L={L}
          />
        ))}
      </div>
    </div>
  );
}

function BracketTree({
  bracket,
  overlay,
  clinch,
  locale,
  L,
}: {
  bracket: WorldCupBracket;
  overlay: Map<number, MatchOverlay>;
  clinch: Map<string, GroupClinch>;
  locale: string;
  L: Strings;
}) {
  return (
    <div className="w-full max-w-full overflow-x-auto pb-4">
      <div className="flex min-w-max items-stretch gap-4">
        <RoundColumn title={L.rounds.R32} matches={bracket.roundOf32} overlay={overlay} clinch={clinch} locale={locale} L={L} />
        <RoundColumn title={L.rounds.R16} matches={bracket.roundOf16} overlay={overlay} clinch={clinch} locale={locale} L={L} />
        <RoundColumn title={L.rounds.QF} matches={bracket.quarterFinals} overlay={overlay} clinch={clinch} locale={locale} L={L} />
        <RoundColumn title={L.rounds.SF} matches={bracket.semiFinals} overlay={overlay} clinch={clinch} locale={locale} L={L} />
        <RoundColumn title={L.rounds.F} matches={[bracket.final]} overlay={overlay} clinch={clinch} locale={locale} L={L} />
      </div>
    </div>
  );
}

export default async function BracketPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale } = await params;
  const L = t(locale);

  const [standings, fixtures] = await Promise.all([
    getWorldCupStandings(WORLD_CUP_LEAGUE_ID, WORLD_CUP_SEASON),
    getWorldCupFixturesForBracket(WORLD_CUP_LEAGUE_ID, WORLD_CUP_SEASON),
  ]);

  const bracket = generateWorldCupBracket({ standings, liveFixtures: fixtures });
  const clinch = buildGroupClinch(standings, fixtures);
  // Overlay real knockout fixtures (scores/dates) + propagate winners forward.
  const overlay = buildBracketOverlay(bracket, fixtures);

  const updated = new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-ES', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      ...worldCupEventNode(absoluteUrl(`/${locale}/world-cup/bracket`)),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: L.kicker,
          item: absoluteUrl(`/${locale}/world-cup`),
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: L.rounds.R32,
          item: absoluteUrl(`/${locale}/world-cup/bracket`),
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      publisher: { '@id': `${SITE_URL}/#organization` },
      mainEntity: L.faqs.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ];

  return (
    <main className="mx-auto max-w-6xl overflow-x-hidden px-4 py-8 sm:px-5 sm:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SmartAppOpen deeplink={DEEPLINK} />

      <Link
        href={`/${locale}/world-cup`}
        className="text-sm text-green-600 hover:underline"
      >
        {L.backToHub}
      </Link>

      <p className="mt-3 text-sm uppercase tracking-wide text-neutral-500">
        {L.kicker}
      </p>
      <h1 className="mt-2 text-balance text-xl font-bold break-words sm:text-3xl">
        {L.h1}
      </h1>
      <p className="mt-4 max-w-3xl text-sm text-neutral-700 sm:text-base dark:text-neutral-300">
        {L.intro}
      </p>

      <p className="mt-3 text-xs text-neutral-500">
        {L.updated}: {updated}
      </p>

      {/* legend */}
      <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-neutral-600 dark:text-neutral-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-neutral-200 dark:bg-neutral-700" />
          {L.legendProjected}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="text-green-600">✓</span>
          {L.legendConfirmed}
        </span>
      </div>

      {!bracket.meta.canProjectThirdPlace ? (
        <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          {L.partialNote}
        </p>
      ) : null}

      {/* the bracket */}
      <p className="mt-8 text-xs text-neutral-400 sm:hidden">
        {locale === 'en' ? 'Swipe to see all rounds →' : 'Desliza para ver todas las rondas →'}
      </p>
      <div className="mt-2 sm:mt-8">
        <BracketTree bracket={bracket} overlay={overlay} clinch={clinch} locale={locale} L={L} />
      </div>

      {/* third place playoff */}
      <div className="mt-8 max-w-xs">
        <RoundColumn
          title={L.rounds.P3}
          matches={[bracket.thirdPlace]}
          overlay={overlay}
          clinch={clinch}
          locale={locale}
          L={L}
        />
      </div>

      <p className="mt-8">
        <Link
          href={`/${locale}/world-cup`}
          className="font-medium text-green-600 hover:underline"
        >
          {L.seeMatches} →
        </Link>
      </p>

      {/* how it works — depth for SEO + AI citation */}
      <section className="mt-12 max-w-3xl">
        <h2 className="text-xl font-bold">{L.howTitle}</h2>
        <p className="mt-3 text-neutral-700 dark:text-neutral-300">{L.howBody}</p>
      </section>

      {/* follow / install */}
      <section className="mt-12 max-w-3xl">
        <h2 className="text-xl font-bold">{L.followTitle}</h2>
        <p className="mt-3 text-neutral-700 dark:text-neutral-300">
          {L.followBody}
        </p>
        <InstallCTA
          deeplink={DEEPLINK}
          labels={{ open: L.openApp, ios: L.ios, android: L.android }}
        />
      </section>

      {/* FAQ */}
      <section className="mt-12 max-w-3xl">
        <h2 className="text-xl font-bold">{L.faqTitle}</h2>
        <dl className="mt-4 space-y-5">
          {L.faqs.map((f) => (
            <div key={f.q}>
              <dt className="font-semibold">{f.q}</dt>
              <dd className="mt-1 text-neutral-700 dark:text-neutral-300">
                {f.a}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
